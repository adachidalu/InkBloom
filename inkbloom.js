document.addEventListener('DOMContentLoaded', function () {
  const teaserInput = document.getElementById('teaserInput');
  const wordCount = document.getElementById('wordCount');
  const sceneDetails = document.getElementById("scene-details");
  const imageSection = document.getElementById("image-section");
  const imageResult = document.getElementById("imageResult");

  let lastTeaser = "";

  // 📘 Word Counter
  teaserInput.addEventListener('input', () => {
    const words = teaserInput.value.trim().split(/\s+/).filter(Boolean);
    if (words.length > 150) {
      teaserInput.value = words.slice(0, 150).join(' ');
    }
    wordCount.textContent = `${words.length}/150 words`;
  });

  // 🔒 Escape HTML to prevent errors
  function escapeHTML(text) {
    return text?.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") || "";
  }

  // 🎬 Generate Scene Breakdown
  window.generateSceneDetails = async function (override = false) {
    const teaser = teaserInput.value.trim();
    if (!teaser || teaser.length < 10) {
      alert("Please enter a meaningful teaser.");
      return;
    }

    lastTeaser = teaser;
    sceneDetails.innerHTML = "<p>Generating scene...</p>";
    sceneDetails.style.display = "block";
    sceneDetails.style.opacity = "0.5";
    imageSection.style.display = "none";
    imageResult.innerHTML = "";

    try {
      const response = await fetch("http://localhost:4000/generate-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teaser, override })
      });

      const data = await response.json();
      console.log("🧠 Scene breakdown:", data);

      if (!response.ok && data.allowOverride) {
        sceneDetails.innerHTML = `
          <p class="error">⚠️ Teaser flagged as "${escapeHTML(data.type)}"</p>
          <button onclick="generateSceneDetails(true)">Generate Anyway</button>
        `;
        sceneDetails.style.opacity = "1";
        return;
      }

      // ✏️ Editable Textareas
      sceneDetails.innerHTML = `
        <h3>Scene Preview (Editable)</h3>
        <div class="scene-group">
          <label>Characters:</label>
          <textarea id="characters">${escapeHTML(data.characters)}</textarea>

          <label>Setting:</label>
          <textarea id="setting">${escapeHTML(data.setting)}</textarea>

          <label>Mood:</label>
          <textarea id="mood">${escapeHTML(data.mood)}</textarea>

          <label>Camera:</label>
          <textarea id="camera">${escapeHTML(data.camera)}</textarea>

          <label>Actions:</label>
          <textarea id="actions">${escapeHTML(data.actions)}</textarea>
        </div>
        <div class="sticky-generate-btn">
          <button onclick="generateImage()">Generate Image</button>
          <button onclick="generateNextScene()">Continue → Next Scene</button>
        </div>
      `;
      sceneDetails.style.opacity = "1";
      document.getElementById("teaser-and-scene-container").classList.add("scene-visible");

    } catch (err) {
      console.error("❌ Scene error:", err.message);
      sceneDetails.innerHTML = `<p class="error">⚠️ ${escapeHTML(err.message)}</p>`;
    }
  };

  // 🎨 Generate Image
  window.generateImage = async function () {
    const characters = document.getElementById("characters").value;
    const setting = document.getElementById("setting").value;
    const mood = document.getElementById("mood").value;
    const camera = document.getElementById("camera").value;
    const actions = document.getElementById("actions").value;

    const prompt = `
Characters: ${characters}
Setting: ${setting}
Mood: ${mood}
Camera: ${camera}
Actions: ${actions}
`.trim();

    imageSection.style.display = "block";
    imageResult.innerHTML = "<p>Generating images...</p>";

    try {
      const response = await fetch("http://localhost:4000/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      console.log("🖼️ Image response:", data);

      if (!Array.isArray(data.images)) {
        throw new Error(data.error || "No images returned.");
      }

      imageResult.innerHTML = data.images.map(url => `
        <div class="generated-image-block">
          <img src="${url}" alt="Scene image" />
          <a href="${url}" download target="_blank" class="download-button">Download</a>
        </div>
      `).join('');
    } catch (err) {
      console.error("❌ Image error:", err.message);
      imageResult.innerHTML = `<p class="error">⚠️ ${escapeHTML(err.message)}</p>`;
    }
  };

  // 🔁 Generate Next Scene
  window.generateNextScene = function () {
    const nextTeaser = `Next scene after: ${lastTeaser}`;
    teaserInput.value = nextTeaser;
    generateSceneDetails(true);
  };
});

