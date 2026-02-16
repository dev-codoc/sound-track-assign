import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-2.5-flash";

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
    const systemPrompt = `You are a friendly assistant in a chat app that also has audio features. 
When the user says "track 1" or "track 2" or "combine", the app will handle playing those audio tracks; you can briefly acknowledge and encourage them to try it.
Otherwise, have a normal helpful conversation. Keep replies concise.`;

    const contents = toGeminiContents(messages);
    const url = `${GEMINI_API_BASE}/models/${MODEL}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents,
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

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    return NextResponse.json({ content: text });
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
