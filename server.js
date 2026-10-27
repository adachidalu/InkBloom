require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors({ origin: '*' }));

let styleContext = {
  characterDesign: "",
  colorPalette: "",
  cameraStyle: ""
};

// 🔍 Classify teaser type
async function classifyTeaser(teaser) {
  const prompt = `Classify this teaser using one of these labels only:
- story
- non-story
- unclear

Teaser: "${teaser}"`;

  const response = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }]
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    }
  });

  return response.data.choices[0].message.content.trim().toLowerCase();
}

// 🔎 Fallback relevance check
async function checkRelevance(teaser) {
  const prompt = `Does this teaser describe a cinematic story scene? Answer yes or no only.

"${teaser}"`;

  const response = await axios.post("https://api.openai.com/v1/chat/completions", {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }]
  }, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
  });

  return /yes/i.test(response.data.choices[0].message.content.trim());
}

// 🎬 Scene Breakdown Generator
app.post('/generate-scene', async (req, res) => {
  const teaser = req.body.teaser?.trim();
  const override = req.body.override === true;

  if (!teaser || teaser.length < 10) {
    return res.status(400).json({ error: "Teaser must be at least 10 characters." });
  }

  try {
    const classification = await classifyTeaser(teaser);
    console.log("🧠 Teaser Classification:", classification);

    let isRelevant = classification === "story";

    if (!isRelevant && classification === "unclear") {
      const relevance = await checkRelevance(teaser);
      console.log("🔍 Fallback relevance:", relevance);
      isRelevant = relevance;
    }

    if (!isRelevant && !override) {
      return res.status(400).json({
        error: "Teaser not recognized as story.",
        type: classification,
        allowOverride: true
      });
    }

    const prompt = `
You are a scene breakdown parser. Format the following teaser using exactly five labeled fields:

Characters: [Who is present]
Setting: [Where the scene takes place]
Mood: [Emotional tone]
Camera: [Suggested camera angle/style]
Actions: [Key movements or events]

Only reply with those five labeled lines.

Teaser: "${teaser}"`;

    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const raw = response.data.choices[0].message.content;
    console.log("📥 Raw GPT response:\n", raw);

    const result = {
      characters: "",
      setting: "",
      mood: "",
      camera: "",
      actions: ""
    };

    raw.split('\n').forEach(line => {
      const match = line.match(/^\s*(characters|setting|mood|camera|actions)\s*[:\-]\s*(.+)$/i);
      if (match) {
        const key = match[1].toLowerCase();
        const value = match[2].trim();
        result[key] = value;
      }
    });

    console.log("✅ Parsed Scene Elements:", result);

    // 🎨 Save style context for visuals
    styleContext.characterDesign = result.characters;
    styleContext.colorPalette = result.mood?.toLowerCase().includes("dark") ? "muted shadows" : "natural tones";
    styleContext.cameraStyle = result.camera;

    res.json(result);
  } catch (err) {
    console.error("❌ Scene error:", err.message);
    res.status(500).json({ error: "Scene generation failed." });
  }
});

// 🖼️ Image Generator
app.post('/generate-image', async (req, res) => {
  const prompt = req.body.prompt?.trim();
  if (!prompt || prompt.length < 5) {
    return res.status(400).json({ error: "Valid image prompt required." });
  }

  const styledPrompt = `
${prompt}

Visual Consistency:
Character Design: ${styleContext.characterDesign}
Color Palette: ${styleContext.colorPalette}
Camera Style: ${styleContext.cameraStyle}
`.trim();

  try {
    const response = await axios.post("https://api.openai.com/v1/images/generations", {
      model: "dall-e-2",
      prompt: styledPrompt,
      n: 4,
      size: "1024x1024"
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const imageUrls = response.data.data.map(img => img.url);
    console.log("🖼️ Image URLs:", imageUrls);
    res.json({ images: imageUrls });
  } catch (err) {
    console.error("❌ Image generation error:", err.message);
    res.status(500).json({ error: "Image generation failed." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Ink Bloom backend running at http://localhost:${PORT}`);
});
