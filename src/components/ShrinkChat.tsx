// src/components/ShrinkChat.tsx (remove emojis)

"use client";

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

// Define Message shapes
interface UserMessage {
  sender: "user";
  text: string;
  time: string;
}
interface EngineMessage {
  sender: "engine";
  text: string;
  time: string;
  meta: { signal: string; tone_tags: string[]; recallUsed: boolean };
}
export type Message = UserMessage | EngineMessage;

enum Role {
  User = "user",
  Assistant = "assistant",
}
// Define payload shape for API
interface PriorMessagePayload {
  sender: Role;
  text: string;
  time: string;
}

function now(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ShrinkChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "engine",
      text: "Welcome. Whenever you're ready, I'm here.",
      time: now(),
      meta: { signal: "medium", tone_tags: ["warm"], recallUsed: false },
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const correctPassword = process.env.NEXT_PUBLIC_SHRINK_PASS ?? "stillwater";

  const handlePasswordSubmit = () => {
    if (passwordInput.trim() === correctPassword) {
      setIsUnlocked(true);
    } else {
      alert("Incorrect password.");
    }
  };

  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    // 1. Add the user message
    const userMessage: UserMessage = { sender: "user", text: prompt, time: now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // 2. Map to API payload (convert 'engine' to 'assistant')
      const priorMessages: PriorMessagePayload[] = newMessages.map((msg) => ({
        sender: msg.sender === "user" ? Role.User : Role.Assistant,
        text: msg.text,
        time: msg.time,
      }));

      // 3. Call backend with full context
      const res = await fetch("/api/shrink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, priorMessages }),
      });
      if (!res.ok) {
        console.error("API error:", await res.text());
        return;
      }
      const { response_text, signal, tone_tags, recallUsed } = await res.json();

      // 4. Append engine response
      const engineMessage: EngineMessage = {
        sender: "engine",
        text: response_text,
        time: now(),
        meta: { signal, tone_tags, recallUsed },
      };
      setMessages((m) => [...m, engineMessage]);
    } catch (err) {
      console.error("Network error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl mb-4 font-semibold">Enter Passcode to Begin</h1>
        <input
          type="password"
          placeholder="Enter password..."
          value={passwordInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPasswordInput(e.target.value)}
          className="border rounded p-2 mb-4"
        />
        <Button onClick={handlePasswordSubmit}>Unlock</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col h-screen">
      <Card className="flex-1 flex overflow-hidden">
        <CardContent
          ref={scrollRef}
          className="space-y-4 p-6 flex flex-col flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className="flex items-end gap-2">
              {/* Avatar removed */}
              <div
                className={`whitespace-pre-wrap break-words p-3 rounded-xl max-w-[80%] text-sm leading-relaxed ${
                  msg.sender === "user" ? "bg-blue-100 self-end ml-auto" : "bg-gray-100 self-start"
                }`}
              >
                {msg.text}
              </div>
              <div className="text-xs text-gray-500">{msg.time}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2 mt-4">
        <textarea
          rows={1}
          className="flex-1 resize-none border rounded p-2 focus:outline-none focus:ring focus:border-blue-300"
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
