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

type OnboardingStep = 'intro1' | 'intro2' | 'intro3' | 'intro4' | 'invite' | 'done';

export default function ShrinkChat() {
  const [threadId] = useState(() => uuid());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('intro1');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const userScrolledUpRef = useRef(false);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const scheduleSilenceHandler = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "engine", text: "I’m here whenever you’re ready to continue." },
      ]);
      setReminderSent(true);
      silenceTimerRef.current = null;
    }, 120_000);
  }, [clearSilenceTimer]);

  const scrollToBottom = () => {
    if (scrollRef.current && !userScrolledUpRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  const checkUserScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      userScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 100;
    }
  };

  useEffect(() => {
    if (onboardingStep === 'intro1') showMessageWithDelay("Hey, I’m really glad you’re here.", 'intro2');
    if (onboardingStep === 'intro2') showMessageWithDelay("This space is now yours — A private place to share what’s on your mind, reflect, or blow off some steam. No pressure, no rush.", 'intro3');
    if (onboardingStep === 'intro3') showMessageWithDelay("Whenever you're ready, I’d love to get to know you little better — we can start with your name or if you're comfortable, we can talk more about how you’re feeling today and what brought you here. Whatever you share stays here, just between us.", 'intro4');
    if (onboardingStep === 'intro4') showMessageWithDelay("So, feel free to take a beat. You're in control", 'invite');
    if (onboardingStep === 'invite') showMessageWithDelay("As soon as you're ready to talk, I'll be here to listen", 'done');
  }, [onboardingStep]);

  const showMessageWithDelay = (text: string, nextStep: OnboardingStep) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: 'engine', text }]);
      setOnboardingStep(nextStep);
      setIsTyping(false);
    }, 2500);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => clearSilenceTimer();
  }, [clearSilenceTimer]);

  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    clearSilenceTimer();
    setReminderSent(false);
    setMessages((prev) => [...prev, { sender: 'user', text: prompt }]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      if (onboardingStep !== 'done') {
        setTimeout(async () => {
          if (prompt.toLowerCase() === 'skip') {
            setOnboardingStep('done');
            setMessages((prev) => [...prev, { sender: 'engine', text: 'Thank you. We can start wherever you like.' }]);
          } else {
            await fetch('/api/onboarding', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ threadId, name: prompt }),
            });
            setOnboardingStep('done');
            setMessages((prev) => [...prev, { sender: 'engine', text: 'Thank you. We can start wherever you like.' }]);
          }
          setIsTyping(false);
        }, 1500);
      } else {
        setTimeout(async () => {
          const res = await fetch('/api/shrink', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, threadId }),
          });
          const data = await res.json();
          setMessages((prev) => [...prev, { sender: 'engine', text: data.response_text }]);
          if (!reminderSent) scheduleSilenceHandler();
          setIsTyping(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setIsTyping(false);
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
    <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col h-screen">
      <Card className="flex-1 flex overflow-hidden">
        <CardContent
          ref={scrollRef}
          onScroll={checkUserScroll}
          className="space-y-4 p-6 flex flex-col flex-1 overflow-y-auto"
          style={{ wordBreak: 'break-word' }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`relative group p-3 rounded-xl animate-fadein ${
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
          {isTyping && (
            <div className="typing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 mt-4">
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
          style={{ minHeight: "2.5rem", maxHeight: "10rem", overflowY: "auto" }}
        />
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-primary text-primary-foreground"
        >
          {isLoading ? "…" : "Send"}
        </Button>
      </div>
    </div>
  );
}