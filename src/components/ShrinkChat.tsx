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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const silenceTimerRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const scheduleSilenceHandler = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "engine", text: "I’m here whenever you’re ready to continue." }]);
      setReminderSent(true);
      silenceTimerRef.current = null;
    }, 120_000);
  }, [clearSilenceTimer]);

  useEffect(() => {
    if (!onboardingComplete) {
      setMessages([
        { sender: "engine", text: "Before we begin, would you like to tell me your name — or stay anonymous? It’s totally up to you." },
      ]);
    } else {
      setMessages((prev) =>
        prev.length === 0 ? [{ sender: "engine", text: "Whenever you’re ready, I’m here. What’s on your mind today?" }] : prev
      );
    }
  }, [onboardingComplete]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.sender === "engine" && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    return () => clearSilenceTimer();
  }, [clearSilenceTimer]);

  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    clearSilenceTimer();
    setReminderSent(false);
    setMessages((prev) => [...prev, { sender: "user", text: prompt }]);
    setInput("");
    setIsLoading(true);

    try {
      if (!onboardingComplete) {
        let nextMessage = "";
        if (prompt.toLowerCase().includes("anonymous")) {
          await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ threadId }),
          });
          nextMessage = "Thanks. Is there anything you’d like me to know about how you’re feeling today?";
        } else if (prompt.split(" ").length < 5) {
          await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ threadId, name: prompt }),
          });
          nextMessage = "Thanks. Is there anything you’d like me to know about how you’re feeling today?";
        } else {
          await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ threadId, concerns: [prompt] }),
          });
          nextMessage = "Thank you. We can start wherever you like — you’re not alone here.";
          setOnboardingComplete(true);
        }
        setMessages((prev) => [...prev, { sender: "engine", text: nextMessage }]);
      } else {
        const res = await fetch("/api/shrink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, threadId }),
        });
        const data = await res.json();
        setMessages((prev) => [...prev, { sender: "engine", text: data.response_text }]);
        if (!reminderSent) {
          scheduleSilenceHandler();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    clearSilenceTimer();
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col h-full w-full">
      <Card className="flex-1 flex flex-col bg-card rounded-xl shadow-lg">
        <CardContent className="flex-1 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`relative group p-3 rounded-xl ${
                  msg.sender === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
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
        <div className="flex gap-2 p-4 border-t border-border">
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 resize-none border rounded p-2 bg-input text-foreground overflow-hidden"
            placeholder="Type something…"
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            style={{ minHeight: "2.5rem", maxHeight: "10rem" }}
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary text-primary-foreground"
          >
            {isLoading ? "…" : "Send"}
          </Button>
        </div>
      </Card>
    </div>
  );
}