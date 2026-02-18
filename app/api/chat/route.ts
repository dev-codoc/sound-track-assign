import { NextRequest, NextResponse } from "next/server";
import {
  instructionFromToolCall,
  type AudioInstruction,
} from "@/lib/audioInstructions";
import { chatSystemPrompt } from "@/lib/prompts/chatSystemPrompt";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-2.5-flash";

type GeminiContent = { role: "user" | "model"; parts: any[] };

const tools = [
  {
    function_declarations: [
      {
        name: "play_track",
        description:
          "Play a single track in the chat app's audio player. Use when the user asks to play track 1 or track 2.",
        parameters: {
          type: "object",
          properties: {
            track: {
              type: "string",
              enum: ["1", "2"],
              description: "Which track to play.",
            },
          },
          required: ["track"],
        },
      },
      {
        name: "combine_tracks",
        description:
          "Play both tracks together at the same time. Use when the user asks to combine the tracks.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "stop_audio",
        description: "Stop any currently playing audio.",
        parameters: { type: "object", properties: {} },
      },
    ],
  },
];

function extractTextFromCandidateParts(parts: any[]): string {
  return parts
    .filter((p) => typeof p?.text === "string")
    .map((p) => String(p.text))
    .join("")
    .trim();
}

function getFunctionCall(
  parts: any[],
): { name: string; args: Record<string, any> } | null {
  const fcPart = parts.find((p) => p?.functionCall);
  if (!fcPart?.functionCall?.name) return null;
  return {
    name: String(fcPart.functionCall.name),
    args: (fcPart.functionCall.args ?? {}) as Record<string, any>,
  };
}

function executeAudioToolCall(fc: {
  name: string;
  args: Record<string, any>;
}): { toolName: string; audio: AudioInstruction } | null {
  const audio = instructionFromToolCall(fc);
  if (!audio) return null;
  return { toolName: fc.name, audio };
}

function toGeminiContents(
  messages: { role: string; content: string }[],
): { role: "user" | "model"; parts: { text: string }[] }[] {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "[Chat API] GEMINI_API_KEY is not set. Add it to .env or .env.local in the project root and restart the dev server (npm run dev).",
    );
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not set. Add it to .env or .env.local in the project root (e.g. GEMINI_API_KEY=...) and restart the dev server (stop and run: npm run dev).",
      },
      { status: 500 },
    );
  }
  console.log("[Chat API] Calling Gemini API...");

  try {
    const { messages } = await req.json();
    const systemPrompt = chatSystemPrompt;

    const contents = toGeminiContents(messages) as GeminiContent[];
    const url = `${GEMINI_API_BASE}/models/${MODEL}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents,
        tools,
        toolConfig: {
          functionCallingConfig: {
            mode: "AUTO",
          },
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        generationConfig: {
          maxOutputTokens: 1024,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg =
        data?.error?.message ||
        data?.error?.details?.[0]?.message ||
        JSON.stringify(data) ||
        "Request failed";
      return NextResponse.json(
        { error: `Gemini API error: ${response.status} ${errMsg}` },
        { status: response.status },
      );
    }

    const candidateParts = data?.candidates?.[0]?.content?.parts ?? [];
    const functionCall = getFunctionCall(candidateParts);

    // Gemini final reply.
    if (functionCall) {
      const executed = executeAudioToolCall(functionCall);

      if (executed) {
        let action: "track1" | "track2" | "combine" | null = null;

        if (executed.audio.command === "track1") action = "track1";
        if (executed.audio.command === "track2") action = "track2";
        if (executed.audio.command === "combine") action = "combine";

        // SECOND CALL to Gemini to generate final natural response
        const followUpContents = [
          ...contents,
          {
            role: "model",
            parts: [
              {
                functionCall: {
                  name: functionCall.name,
                  args: functionCall.args,
                },
              },
            ],
          },
          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: functionCall.name,
                  response: executed.audio,
                },
              },
            ],
          },
        ];

        const response2 = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: followUpContents,
            tools,
            toolConfig: {
              functionCallingConfig: {
                mode: "AUTO",
              },
            },
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
          }),
        });

        const data2 = await response2.json();

        const finalParts = data2?.candidates?.[0]?.content?.parts ?? [];

        const finalText = extractTextFromCandidateParts(finalParts);

        return NextResponse.json({
          reply: finalText || "Done.",
          action,
        });
      }
    }

    const text = extractTextFromCandidateParts(candidateParts);
    return NextResponse.json({ reply: text, action: null });
  } catch (e) {
    console.error("Chat API error:", e);
    const message = e instanceof Error ? e.message : "Chat request failed";
    const status =
      e && typeof e === "object" && "status" in e
        ? (e as { status: number }).status
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
