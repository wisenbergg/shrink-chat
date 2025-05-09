"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FeedbackForm } from "../components/FeedbackForm";

interface Message {
  sender: "user" | "engine";
  text: string;
}

export default function ShrinkChat() {
  const [threadId] = useState(() => uuid());
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "engine",
      text: "Whenever you’re ready, I’m here. What’s on your mind today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ref to hold our silence‐timer id
  const silenceTimerRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear any existing silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Schedule the nudge after 30s of silence
  const scheduleSilenceHandler = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "engine", text: "I’m here whenever you’re ready to continue." },
      ]);
      silenceTimerRef.current = null;
    }, 30_000);
  }, [clearSilenceTimer]);

  // When the engine replies, scroll and schedule the silence handler
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.sender === "engine") {
      // auto‑scroll
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }
      scheduleSilenceHandler();
    }
  }, [messages, scheduleSilenceHandler]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearSilenceTimer();
  }, [clearSilenceTimer]);

  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    // user is active → clear nudge
    clearSilenceTimer();

    setMessages((prev) => [...prev, { sender: "user", text: prompt }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/shrink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, threadId }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "engine", text: data.response_text }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col h-screen">
      <Card className="flex-1 flex overflow-hidden">
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="space-y-4 p-6 flex flex-col flex-1 overflow-y-auto"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`relative group p-3 rounded-xl ${
                  msg.sender === "user" ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                {msg.text}
                {msg.sender === "engine" && (
                  <FeedbackForm sessionId={threadId} responseId={`response-${idx}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 mt-4">
        <textarea
          rows={1}
          className="flex-1 resize-none border rounded p-2"
          placeholder="Type something…"
          value={input}
          onChange={(e) => {
            clearSilenceTimer();
            setInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
