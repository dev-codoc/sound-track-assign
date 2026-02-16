"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioTracks } from "@/lib/useAudioTracks";
import styles from "./page.module.css";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    playbackState,
    error: audioError,
    playTrack1,
    playTrack2,
    playCombine,
    stopAll,
    triggerByMessage,
  } = useAudioTracks();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      scrollToBottom();

      triggerByMessage(trimmed);

      setLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: trimmed },
            ],
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          const errMsg = data.error || "Request failed";
          const isBillingError =
            response.status === 400 &&
            (errMsg.includes("credit") ||
              errMsg.includes("balance") ||
              errMsg.includes("billing"));
          throw new Error(
            isBillingError
              ? 'BILLING: Chat is temporarily unavailable (no API credits). You can still use the audio: try "track 1", "track 2", or "combine".'
              : errMsg,
          );
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content || "" },
        ]);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Something went wrong.";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: message.startsWith("BILLING:")
              ? message.slice(8).trim()
              : `Error: ${message}. If the key is missing: add GEMINI_API_KEY to .env in the project root and restart the dev server (npm run dev).`,
          },
        ]);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    },
    [messages, loading, triggerByMessage, scrollToBottom],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1>Chat with Audio</h1>
        <p className={styles.subtitle}>
          Try &quot;track 1&quot;, &quot;track 2&quot;, or &quot;combine&quot;
        </p>
        <div className={styles.audioControls}>
          <button
            type="button"
            onClick={playTrack1}
            className={playbackState === "track1" ? styles.active : undefined}
            aria-pressed={playbackState === "track1"}
          >
            Track 1
          </button>
          <button
            type="button"
            onClick={playTrack2}
            className={playbackState === "track2" ? styles.active : undefined}
            aria-pressed={playbackState === "track2"}
          >
            Track 2
          </button>
          <button
            type="button"
            onClick={playCombine}
            className={playbackState === "combine" ? styles.active : undefined}
            aria-pressed={playbackState === "combine"}
          >
            Combine
          </button>
          <button type="button" onClick={stopAll} className={styles.stop}>
            Stop
          </button>
        </div>
        {playbackState !== "idle" && (
          <p className={styles.nowPlaying}>
            Now playing:{" "}
            {playbackState === "track1"
              ? "Track 1"
              : playbackState === "track2"
                ? "Track 2"
                : "Track 1 + Track 2"}
          </p>
        )}
        {audioError && <p className={styles.audioError}>{audioError}</p>}
      </header>

      <section className={styles.chatSection}>
        <div className={`chat-messages ${styles.messages}`}>
          {messages.length === 0 && (
            <div className={styles.placeholder}>
              <p>
                Say &quot;track 1&quot; or &quot;track 2&quot; to play audio.
              </p>
              <p>Say &quot;combine&quot; to play both at once.</p>
              <p>Or chat with the assistant about anything.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user" ? styles.messageUser : styles.messageBot
              }
            >
              <span className={styles.messageRole}>
                {m.role === "user" ? "You" : "Bot"}
              </span>
              <div className={styles.messageContent}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div className={styles.messageBot}>
              <span className={styles.messageRole}>Bot</span>
              <div className={styles.messageContent}>
                <span className={styles.typing}>...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className={styles.input}
            disabled={loading}
            autoComplete="off"
          />
          <button type="submit" className={styles.send} disabled={loading}>
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
