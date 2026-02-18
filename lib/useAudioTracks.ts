"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import type { AudioCommand } from "@/lib/audioInstructions";

const TRACK_1_SRC = "/tracks/track1.mp3";
const TRACK_2_SRC = "/tracks/track2.mp3";

export type PlaybackState = "idle" | "track1" | "track2" | "combine";

export function useAudioTracks() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [error, setError] = useState<string | null>(null);
  const howl1 = useRef<Howl | null>(null);
  const howl2 = useRef<Howl | null>(null);
  const initialized = useRef(false);

  const initHowls = useCallback(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      howl1.current = new Howl({
        src: [TRACK_1_SRC],
        html5: true,
        onloaderror: () => setError("Failed to load track 1"),
      });
      howl2.current = new Howl({
        src: [TRACK_2_SRC],
        html5: true,
        onloaderror: () => setError("Failed to load track 2"),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio init failed");
    }
  }, []);

  useEffect(() => {
    initHowls();
    return () => {
      howl1.current?.unload();
      howl2.current?.unload();
      howl1.current = null;
      howl2.current = null;
      initialized.current = false;
    };
  }, [initHowls]);

  const stopBoth = () => {
    howl1.current?.stop();
    howl2.current?.stop();
  };

  const stopAll = useCallback(() => {
    stopBoth();
    setPlaybackState("idle");
  }, []);

  const playTrack1 = useCallback(() => {
    initHowls();
    stopBoth();
    howl1.current?.play();
    setPlaybackState("track1");
    setError(null);
  }, [initHowls]);

  const playTrack2 = useCallback(() => {
    initHowls();
    stopBoth();
    howl2.current?.play();
    setPlaybackState("track2");
    setError(null);
  }, [initHowls]);

  const playCombine = useCallback(() => {
    initHowls();
    stopBoth();
    howl1.current?.play();
    howl2.current?.play();
    setPlaybackState("combine");
    setError(null);
  }, [initHowls]);

  const applyAudioCommand = useCallback(
    (command: AudioCommand) => {
      switch (command) {
        case "track1":
          playTrack1();
          return;
        case "track2":
          playTrack2();
          return;
        case "combine":
          playCombine();
          return;
        case "stop":
          stopAll();
          return;
      }
    },
    [playTrack1, playTrack2, playCombine, stopAll],
  );

  return {
    playbackState,
    error,
    stopAll,
    applyAudioCommand,
  };
}
