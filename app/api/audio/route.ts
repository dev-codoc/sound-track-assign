import { NextRequest, NextResponse } from "next/server";
import {
  instructionFromCommand,
  type AudioCommand,
} from "@/lib/audioInstructions";

export async function POST(req: NextRequest) {
  try {
    const { command } = (await req.json()) as { command?: AudioCommand };
    if (!command) {
      return NextResponse.json(
        { error: "Missing required field: command" },
        { status: 400 },
      );
    }

    const audio = instructionFromCommand(command);
    return NextResponse.json({ audio });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 },
    );
  }
}

