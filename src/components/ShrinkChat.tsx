"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FeedbackForm } from "../components/FeedbackForm";
import JournalResetButton from '../components/JournalResetButton';


interface Message {
  sender: "user" | "engine";
  text: string;
}

interface MemoryEntry {
  role: 'assistant' | 'user' | string;
  content: string;
}

type OnboardingStep = 'intro1' | 'intro2' | 'intro3' | 'invite' | 'done';

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
  const [userName, setUserName] = useState<string | null>(null);


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
    if (onboardingStep === 'intro2') showMessageWithDelay("This space is now yours — A safe place to share your thoughts, feelings, and experiences in total privacy.", 'intro3');
    if (onboardingStep === 'intro3') showMessageWithDelay("If you're feeling up to it, I’d love to start by getting to know you — It can be something small like your name or if there's anything top of mind, we can jump ahead and tackle it together. Remember, it's just us. nothing you say will ever leave your computer.", 'invite');
    if (onboardingStep === 'invite') showMessageWithDelay("As soon as you're ready to share just drop your thoughts in down below, I'll be here to help when you do.", 'done');
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

  useEffect(() => {
    async function loadThreadHistory() {
       const res = await fetch(`/api/memory/${threadId}`);
       const data = await res.json();
       const parsedMessages = (data.memory ?? []).map((m: MemoryEntry) => ({

         sender: m.role === 'assistant' ? 'engine' : 'user',
         text: m.content,
    }));
    setMessages(parsedMessages);
  }
  
    if (threadId) loadThreadHistory();
  }, [threadId]);
  
  useEffect(() => {
    async function loadUserProfile() {
      const res = await fetch(`/api/profile/${threadId}`);
      const { profile } = await res.json();
      if (profile?.name) {
        setUserName(profile.name);
      }
    }
  
    if (threadId) loadUserProfile();
  }, [threadId]);
  

  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    clearSilenceTimer();
    setReminderSent(false);
    setMessages((prev) => [...prev, { sender: 'user', text: prompt }]);
    setInput('');

    // ✅ Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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
    <div className="w-full max-w-[42rem] mx-auto py-12 px-4 flex flex-col h-screen">
      {userName && (
        <div className="text-sm text-muted-foreground text-right mb-2">
          Welcome back, {userName}.
        </div>
      )}
      <Card className="flex-1 flex overflow-hidden">
        <CardContent
          ref={scrollRef}
          onScroll={checkUserScroll}
          className="space-y-4 p-6 flex flex-col flex-1 overflow-y-auto min-h-0"
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
    {messages.length > 0 && (
      <div className="mt-4 flex justify-end">
      <JournalResetButton
        threadId={threadId}
        onReset={() => {
          setMessages([]);
          setOnboardingStep('intro1'); // restart onboarding
       }}    
     />
    </div>
  )}
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
