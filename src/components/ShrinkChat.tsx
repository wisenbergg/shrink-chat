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
    { sender: "engine", text: "Whenever you’re ready, I’m here. What’s on your mind today?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt) return;

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
        rows={1}
        className="flex-1 resize-none border rounded p-2 bg-input text-foreground"
        placeholder="Type something…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
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
