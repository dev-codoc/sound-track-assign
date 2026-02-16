"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Howl } from "howler";

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
    if (typeof window === "undefined" || initialized.current) return;
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

  const stopAll = useCallback(() => {
    howl1.current?.stop();
    howl2.current?.stop();
    setPlaybackState("idle");
  }, []);

  const playTrack1 = useCallback(() => {
    initHowls();
    howl2.current?.stop();
    howl1.current?.stop();
    howl1.current?.play();
    setPlaybackState("track1");
    setError(null);
  }, [initHowls]);

  const playTrack2 = useCallback(() => {
    initHowls();
    howl1.current?.stop();
    howl2.current?.stop();
    howl2.current?.play();
    setPlaybackState("track2");
    setError(null);
  }, [initHowls]);

  const playCombine = useCallback(() => {
    initHowls();
    howl1.current?.stop();
    howl2.current?.stop();
    howl1.current?.play();
    howl2.current?.play();
    setPlaybackState("combine");
    setError(null);
  }, [initHowls]);

  const triggerByMessage = useCallback(
    (message: string) => {
      const lower = message.trim().toLowerCase();
      if (lower === "track 1") {
        playTrack1();
        return true;
      }
      if (lower === "track 2") {
        playTrack2();
        return true;
      }
      if (lower === "combine") {
        playCombine();
        return true;
      }
      return false;
    },
    [playTrack1, playTrack2, playCombine],
  );

  return {
    playbackState,
    error,
    playTrack1,
    playTrack2,
    playCombine,
    stopAll,
    triggerByMessage,
  };
}
