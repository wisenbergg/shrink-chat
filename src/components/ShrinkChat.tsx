"use client";

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function ShrinkChat() {
  const [messages, setMessages] = useState<
    { sender: "user" | "engine"; text: string; time: string; meta?: any }[]
  >([{ sender: "engine", text: "Welcome. Whenever you're ready, I'm here.", time: now() }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showDebug, setShowDebug] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  function now() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const correctPassword = process.env.NEXT_PUBLIC_SHRINK_PASS || "stillwater";
  const handlePasswordSubmit = () => {
    passwordInput.trim() === correctPassword ? setIsUnlocked(true) : alert("Incorrect password.");
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const t = now();
    setMessages((m) => [...m, { sender: "user", text: input.trim(), time: t }]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/shrink", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: input.trim() }) });
      if (!res.ok) throw new Error(await res.text());
      const { response_text, signal, tone_tags, recallUsed } = await res.json();
      setMessages((m) => [...m, { sender: "engine", text: response_text, time: now(), meta: { signal, tone_tags, recallUsed } }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl mb-4 font-semibold">Enter Passcode to Begin</h1>
        <Input placeholder="Enter password..." value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="max-w-sm" />
        <Button onClick={handlePasswordSubmit} className="mt-4">Unlock</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col h-screen">
      <Card className="flex-1 flex overflow-hidden">
        <CardContent ref={scrollRef} className="space-y-4 p-6 flex flex-col flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300">
          {messages.map((msg, idx) => (
            <div key={idx} className="flex items-end gap-2">
              {/* Avatar */}
              <div className={msg.sender === "user" ? "order-2" : "order-1"}>
                {msg.sender === "user" ? "🧑" : "🤖"}
              </div>
              {/* Message bubble */}
              <div className={`whitespace-pre-wrap break-words p-3 rounded-xl max-w-[80%] text-sm leading-relaxed
                ${msg.sender === "user" ? "bg-blue-100 self-end ml-auto" : "bg-gray-100 self-start"}`}>
                {msg.text}
              </div>
              {/* Timestamp */}
              <div className="text-xs text-gray-500">{msg.time}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Input area */}
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
        <Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? "…" : "Send"}</Button>
      </div>
    </div>
  );
}
