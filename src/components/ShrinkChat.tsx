"use client";

import { useState, ChangeEvent, KeyboardEvent } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function ShrinkChat() {
  // NOTE: `meta` is optional for now to support both engine and user messages.
  // Later, consider replacing this with a discriminated union type like:
  //
  // type Message =
  //   | { sender: "user"; text: string }
  //   | { sender: "engine"; text: string; meta: { signal: string; tone_tags: string[]; recallUsed: boolean } }

  const [messages, setMessages] = useState<
    { sender: string; text: string; meta?: { signal: string; tone_tags: string[]; recallUsed: boolean } }[]
  >([
    {
      sender: "engine",
      text: "Welcome. Whenever you're ready, I'm here.",
      meta: { signal: "medium", tone_tags: ["warm"], recallUsed: false }
    }
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showDebug, setShowDebug] = useState<Record<number, boolean>>({});

  const correctPassword = process.env.NEXT_PUBLIC_SHRINK_PASS || "stillwater";

  const handlePasswordSubmit = () => {
    if (passwordInput.trim() === correctPassword) {
      setIsUnlocked(true);
    } else {
      alert("Incorrect password.");
    }
  };

  const sendFeedback = async (msgId: number, liked: boolean) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msgId, liked })
    });
  };

  const promptFeedbackForm = async (msgId: number) => {
    const comment = prompt("What didn’t feel right?");
    if (!comment) return;
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msgId, liked: false, comment })
    });
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const userMessage = {
      sender: "user",
      text: input.trim(),
      meta: undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/shrink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.text })
      });

      if (!res.ok) {
        console.error("API error:", await res.text());
        return;
      }

      const { response_text, signal, tone_tags, recallUsed } = await res.json();
      const engineMessage = {
        sender: "engine",
        text: response_text,
        meta: { signal, tone_tags, recallUsed }
      };
      setMessages((prev) => [...prev, engineMessage]);
    } catch (networkError) {
      console.error("Network error:", networkError);
    } finally {
      setIsLoading(false);
    }
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
    <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col">
      <Card>
        <CardContent className="space-y-4 p-6 flex flex-col">
          {messages.map((msg, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div
                className={`whitespace-pre-wrap p-3 rounded-xl max-w-[90%] text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-100 self-end ml-auto"
                    : "bg-gray-100 self-start"
                }`}
              >
                {msg.text}
              </div>

              {msg.sender === "engine" && msg.meta && (
                <div className="self-start ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setShowDebug((prev) => ({
                        ...prev,
                        [idx]: !prev[idx]
                      }))
                    }
                  >
                    ⚙️ Details
                  </Button>
                  {showDebug[idx] && (
                    <div className="bg-gray-50 p-2 mt-1 rounded text-xs w-full whitespace-pre-wrap">
                      <pre className="mb-2">
                        {JSON.stringify(msg.meta, null, 2)}
                      </pre>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => sendFeedback(idx, true)}
                        >
                          👍
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => promptFeedbackForm(idx)}
                        >
                          👎
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
