import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "[Chat API] ANTHROPIC_API_KEY is not set. Add it to .env or .env.local in the project root and restart the dev server (npm run dev)."
    );
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not set. Add it to .env or .env.local in the project root (e.g. ANTHROPIC_API_KEY=sk-ant-...) and restart the dev server (stop and run: npm run dev).",
      },
      { status: 500 }
    );
  }
  console.log("[Chat API] Calling Anthropic API...");

  try {
    const { messages } = await req.json();
    const systemPrompt = `You are a friendly assistant in a chat app that also has audio features. 
When the user says "track 1" or "track 2" or "combine", the app will handle playing those audio tracks; you can briefly acknowledge and encourage them to try it.
Otherwise, have a normal helpful conversation. Keep replies concise.`;

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const textBlock = response.content?.find((block) => block.type === "text");
    const text =
      textBlock && "text" in textBlock ? (textBlock.text as string) : "";

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
