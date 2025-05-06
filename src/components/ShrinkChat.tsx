"use client";

import { useState, useRef, useEffect } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Seed opening message on first load
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: "engine",
          text: "Whenever you’re ready, I’m here. What’s on your mind today?",
        },
      ]);
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col h-screen">
      <Card className="flex-1 flex overflow-hidden">
        <CardContent ref={scrollRef} className="space-y-4 p-6 flex flex-col flex-1 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`relative p-3 rounded-xl ${
                msg.sender === "user" ? "bg-blue-100" : "bg-gray-100"
              }`}
            >
              {msg.text}
              {msg.sender === "engine" && (
                <FeedbackForm sessionId={threadId} responseId={`response-${idx}`} />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2 mt-4">
        <textarea
          rows={1}
          className="flex-1 resize-none border rounded p-2"
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
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
