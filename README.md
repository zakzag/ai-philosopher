# 🎭 Philosopher - AI Debate Application

An application where two AI agents debate philosophical topics in real-time. Watch them argue opposing standpoints and try to reach an agreement!

## Features

- **Real-time AI debates**: Two AI agents argue opposing viewpoints with streaming responses
- **Configurable AI providers**: Support for Groq and OpenRouter APIs
- **Live chat interface**: Watch the debate unfold like a chat conversation
- **Pause/Resume**: Pause the debate at any time and resume when ready
- **Edit messages**: Modify agent responses before the next turn (while paused)
- **Undo functionality**: Revert the debate to any previous message
- **Replay past debates**: Watch completed debates with adjustable playback speed
- **Agreement detection**: Debates end when both agents find common ground
- **Time limits**: Set a maximum duration for debates

## Project Structure

```
philosopher/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── server/       # Express backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── turbo.json        # Turborepo configuration
└── package.json      # Root workspace configuration
```

## Prerequisites

- Node.js 18+
- MongoDB (local or cloud instance)
- API key for Groq or OpenRouter

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   
   Copy the example env file and edit it:
   ```bash
   cp .env.example apps/server/.env
   ```
   
   Edit `apps/server/.env`:
   ```env
   # Choose your AI provider: 'groq' or 'openrouter'
   AI_PROVIDER=openrouter
   
   # Groq API key (get one at https://console.groq.com)
   GROQ_API_KEY=your_groq_api_key_here
   
   # OpenRouter API key (get one at https://openrouter.ai)
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   
   # Optional: Override default models
   # For OpenRouter free models, use:
   # OPENROUTER_MODEL=google/gemini-2.0-flash-exp:free
   # OPENROUTER_MODEL=qwen/qwen-2.5-7b-instruct:free
   # OPENROUTER_MODEL=mistralai/mistral-7b-instruct:free
   
   # For Groq:
   # GROQ_MODEL=llama-3.1-70b-versatile
   
   # MongoDB connection
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=philosopher
   
   # Server port
   PORT=3001
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

4. **Run the development servers**:
   ```bash
   npm run dev
   ```
   
   This starts both the frontend (http://localhost:3000) and backend (http://localhost:3001).

## Usage

1. Open http://localhost:3000 in your browser
2. Enter two opposing standpoints (e.g., "God exists" vs "God does not exist")
3. Set a time limit (1-30 minutes)
4. Click "Start Debate" and watch the AI agents discuss!

### Controls During Debate

- **Pause**: Pauses after the current response completes
- **Resume**: Continues the debate from where it paused
- **Stop**: Ends the debate immediately

### Editing & Undo

While paused, you can:
- Click the "⋯" menu on any message to access options
- **Edit**: Modify the message content before continuing
- **Undo to this**: Revert the debate to that point and continue from there

### Replay

Completed debates can be replayed:
- Adjust playback speed with the slider
- Use play/pause/reset controls
- Jump to end to see the full conversation instantly

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/debates` | Create a new debate |
| GET | `/api/debates` | List all debates |
| GET | `/api/debates/:id` | Get debate with messages |
| GET | `/api/debates/:id/stream` | SSE stream for live debate |
| POST | `/api/debates/:id/pause` | Pause debate |
| POST | `/api/debates/:id/resume` | Resume debate |
| POST | `/api/debates/:id/stop` | Stop debate |
| PUT | `/api/debates/:id/messages/:messageId` | Edit message |
| DELETE | `/api/debates/:id/messages/after/:messageId` | Undo to message |
| DELETE | `/api/debates/:id` | Delete debate |

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, React Router
- **Backend**: Express, TypeScript, MongoDB
- **AI**: Groq API / OpenRouter API
- **Monorepo**: Turborepo, npm workspaces

## License

ISC
