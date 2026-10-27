# InkBloom

An AI-powered creative writing companion that generates scene breakdowns and visuals from your story teasers.

## Project Structure
- `index.html`: The main frontend interface.
- `css/`: Stylesheets for the UI.
- `js/`: Frontend logic handling API calls to the local server.
- `server.js`: Node.js Express backend that communicates with the OpenAI API.

## How to Run Locally

Because this project uses the OpenAI API, you must run the local Node.js server.

### 1. Install Dependencies
Open your terminal in the root folder of this project and run:
```bash
npm install
```

### 2. Set Up Environment Variables
Create a file named `.env` in the root folder and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Start the Backend Server
Run the following command to start the backend on port 4000:
```bash
node server.js
```

### 4. Open the Frontend
Leave the server running in your terminal. Then, simply double-click the `index.html` file to open it in your web browser. You can now type your teaser and generate scene details!
