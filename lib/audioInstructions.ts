export type AudioCommand = "track1" | "track2" | "combine" | "stop";

export type AudioInstruction =
  | { command: "track1"; urls: [string] }
  | { command: "track2"; urls: [string] }
  | { command: "combine"; urls: [string, string] }
  | { command: "stop"; urls: [] };

const TRACK_1_URL = "/tracks/track1.mp3";
const TRACK_2_URL = "/tracks/track2.mp3";

export function instructionFromCommand(command: AudioCommand): AudioInstruction {
  switch (command) {
    case "track1":
      return { command: "track1", urls: [TRACK_1_URL] };
    case "track2":
      return { command: "track2", urls: [TRACK_2_URL] };
    case "combine":
      return { command: "combine", urls: [TRACK_1_URL, TRACK_2_URL] };
    case "stop":
      return { command: "stop", urls: [] };
  }
}

export function instructionFromToolCall(fc: {
  name: string;
  args: Record<string, any>;
}): AudioInstruction | null {
  if (fc.name === "play_track") {
    const track = String(fc.args?.track ?? "");
    if (track === "1") return instructionFromCommand("track1");
    if (track === "2") return instructionFromCommand("track2");
    return null;
  }
  if (fc.name === "combine_tracks") return instructionFromCommand("combine");
  if (fc.name === "stop_audio") return instructionFromCommand("stop");
  return null;
}

