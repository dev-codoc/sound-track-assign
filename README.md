# Chat Bot with audio (Howler.js)

A chat-based app powered by **Google Gemini** with **Howler.js** audio playback. Audio actions are **decided by Gemini via tool-calling on the backend**, and the frontend only executes the returned audio instruction.

## Features

- **Chat**: Talk to a bot powered by Google’s Gemini API.
- **Audio control (model-driven)**:
  - Type **\"track 1\"**, **\"track 2\"**, **\"combine\"**, or **\"stop\"** (or use buttons).
  - Gemini chooses a tool call, the backend returns an **audio instruction**, and the browser plays it with Howler.js.
- **Tech**: Next.js 14 (App Router), Howler.js, Gemini API (REST + tool calling).

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Gemini API key

Create `.env` or `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

### 3. Audio tracks

Place two MP3 files in `public/tracks/`:

- `public/tracks/track1.mp3`
- `public/tracks/track2.mp3`

You can use any short MP3s. For testing, you can download a sample (e.g. from [Learning Container](https://www.learningcontainer.com/sample-audio-file/)), rename one to `track1.mp3`, and duplicate or use another file as `track2.mp3`.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

- Type **track 1**, **track 2**, **combine**, or **stop** in the chat (or click the buttons).
- **Important**: the frontend does **not** decide which track to play. It always calls `POST /api/chat`; the backend (Gemini tool-calling) returns `audio.command`, and the browser executes it.
- The “Now playing” line shows the current audio state.

## Project structure

- `app/page.tsx` – Chat UI; sends messages to `/api/chat`; plays audio only when backend returns `audio.command`
- `app/api/chat/route.ts` – Calls Gemini with tool declarations; may do 2-step tool calling (functionCall → functionResponse → final text)
- `app/api/audio/route.ts` – Backend audio instruction API (`{command}` → `{audio}`), used as the tool target conceptually
- `lib/audioInstructions.ts` – Canonical mapping between commands/tool calls and `{ command, urls }`
- `lib/useAudioTracks.ts` – Howler.js hook; executes audio commands (`track1`, `track2`, `combine`, `stop`)
- `public/tracks/` – Add `track1.mp3` and `track2.mp3` here

