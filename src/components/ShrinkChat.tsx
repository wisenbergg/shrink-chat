// src/components/ShrinkChat.tsx

"use client";

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { v4 as uuid } from "uuid";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FeedbackForm } from './FeedbackForm';

interface Message {
  sender: "user" | "engine";
  text: string;
  responseId?: string; // added to link feedback
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

    const userMessage: Message = { sender: "user", text: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/shrink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, threadId }),
      });
      const data = await res.json();
      const engineMessage: Message = {
        sender: "engine",
        text: data.response_text,
        responseId: `response-${Date.now()}`,
      };
      setMessages((prev) => [...prev, engineMessage]);
    } catch (err) {
      console.error("Error sending prompt:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
            <div key={idx} className={`p-3 rounded-xl ${msg.sender === "user" ? "bg-blue-100" : "bg-gray-100"}`}>
              <p>{msg.text}</p>
              {msg.sender === "engine" && msg.responseId && (
                <FeedbackForm sessionId={threadId} responseId={msg.responseId} />
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
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
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
