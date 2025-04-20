"use client";

import { useState, ChangeEvent, KeyboardEvent } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function ShrinkChat() {
  const [messages, setMessages] = useState([
    {
      sender: "engine",
      text: "Welcome. Whenever you're ready, I'm here."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const correctPassword = process.env.NEXT_PUBLIC_SHRINK_PASS || "stillwater";

  const handlePasswordSubmit = () => {
    if (passwordInput.trim() === correctPassword) {
      setIsUnlocked(true);
    } else {
      alert("Incorrect password.");
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/shrink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMessage.text })
    });

    const data = await res.json();
    const engineMessage = {
      sender: "engine",
      text: data.response_text
    };
    setMessages((prev) => [...prev, engineMessage]);
    setIsLoading(false);
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl mb-4 font-semibold">Enter Passcode to Begin</h1>
        <Input
          placeholder="Enter password..."
          value={passwordInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPasswordInput(e.target.value)
          }
          className="max-w-sm"
        />
        <Button onClick={handlePasswordSubmit} className="mt-4">
          Unlock
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardContent className="space-y-4 p-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`whitespace-pre-wrap p-3 rounded-xl max-w-[90%] text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-100 self-end ml-auto"
                  : "bg-gray-100 self-start"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2 mt-4">
        <Input
          placeholder="Type something..."
          value={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
