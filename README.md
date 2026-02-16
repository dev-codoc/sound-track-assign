# Chat Bot with audio (Howler.js)

A chat-based app powered by **Google Gemini** with **Howler.js** audio triggers.

## Features

- **Chat**: Talk to a bot powered by Google’s Gemini API.
- **Audio triggers** (type in chat or use the buttons):
  - **"track 1"** → plays audio track 1
  - **"track 2"** → plays audio track 2
  - **"combine"** → plays both tracks at the same time
- **Tech**: Next.js 14, Howler.js, Gemini API.

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

- Type **track 1**, **track 2**, or **combine** in the chat to trigger playback (exact phrases, case-insensitive).
- Use the **Track 1**, **Track 2**, **Combine**, and **Stop** buttons above the chat for direct control.
- The “Now playing” line shows the current audio state; the bot will still reply to your messages.

## Project structure

- `app/page.tsx` – Chat UI and audio trigger handling
- `app/api/chat/route.ts` – Gemini API proxy
- `lib/useAudioTracks.ts` – Howler.js hook for track 1, track 2, and combined playback
- `public/tracks/` – Add `track1.mp3` and `track2.mp3` here
