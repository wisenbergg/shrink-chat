"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FeedbackForm } from "../components/FeedbackForm";
import JournalResetButton from "../components/JournalResetButton";
import { useMemoryChat } from "@/hooks/useMemoryChat";
import { useToast } from "@/hooks/use-toast";
import type { ThreadId } from "@/lib/types";
import { useSession } from "@/context/SessionContext";
import { useThreadProfile } from "@/hooks/useThreadProfile";
import {
  handleNameQuery,
  storeConversationMessage,
  extractAndStoreUserName,
  storeInShortTermMemory,
} from "@/lib/shortTermMemory";

// Set this to a new value whenever you want to reset all users
const APP_VERSION = "2.0.0";

interface Message {
  sender: "user" | "engine";
  text: string;
}
interface MemoryEntry {
  role: "assistant" | "user" | string;
  content: string;
}
type OnboardingStep = "intro1" | "intro2" | "intro3" | "invite" | "done";

export default function ShrinkChat() {
  // Get threadId from URL parameters
  const searchParams = useSearchParams();
  const urlThreadId = searchParams.get("threadId");
  const { toast } = useToast();
  const { threadId: sessionThreadId, setThreadId } = useSession();
  // Use the thread profile hook to ensure profile exists
  const { error: profileError } = useThreadProfile();

  // Show error toast if profile creation fails
  useEffect(() => {
    if (profileError) {
      toast({
        title: "Profile Error",
        description: `Failed to ensure profile exists: ${profileError}. Memory features may not work correctly.`,
        variant: "destructive",
      });
    }
  }, [profileError, toast]);

  /* ──────────────  threadId in sessionStorage + cookie  ───────────── */
  const [threadId] = useState<ThreadId>(() => {
    if (typeof window !== "undefined") {
      // Check if we need to reset due to version change
      const storedVersion = localStorage.getItem("app_version");
      const needsReset = storedVersion !== APP_VERSION;

      if (needsReset) {
        console.log("App version changed, resetting user data");
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        // Store new version
        localStorage.setItem("app_version", APP_VERSION);

        // Generate new UUID
        const newId = uuid();
        sessionStorage.setItem("threadId", newId);
        document.cookie = `sw_uid=${newId}; path=/; SameSite=Lax`;
        return newId;
      }

      // If no reset needed, use normal flow
      // First check URL params (from onboarding)
      if (urlThreadId) {
        sessionStorage.setItem("threadId", urlThreadId);
        document.cookie = `sw_uid=${urlThreadId}; path=/; SameSite=Lax`;
        return urlThreadId;
      }

      // Use sessionThreadId from context if available
      if (sessionThreadId) {
        return sessionThreadId;
      }

      // Then check sessionStorage
      const stored = sessionStorage.getItem("threadId");
      const id = stored || uuid();
      sessionStorage.setItem("threadId", id);
      document.cookie = `sw_uid=${id}; path=/; SameSite=Lax`;
      return id;
    }
    return uuid();
  });

  // Update context with threadId in useEffect to avoid setState during render
  useEffect(() => {
    if (threadId && threadId !== sessionThreadId) {
      setThreadId(threadId);
    }
  }, [threadId, sessionThreadId, setThreadId]);

  // Store version in localStorage after component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("app_version", APP_VERSION);
    }
  }, []);

  // Initialize memory hook - using only threadId now
  const {
    retrieveMemories,
    memorizeMessage,
    getMemoryContext,
    relevantMemories,
    isLoadingMemories,
  } = useMemoryChat({
    threadId,
    onError: (error) => {
      console.error("Memory error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Memory Error",
        description: `Failed to process memories: ${errorMessage}. Chat will continue without memory context.`,
        variant: "destructive",
      });
    },
  });

  /* ──────────────  state & refs  ───────────── */
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [onboardingStep, setOnboardingStep] =
    useState<OnboardingStep>("intro1");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const userScrolledUpRef = useRef(false);

  /* ──────────────  helpers  ───────────── */
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
        {
          sender: "engine",
          text: "I'm here whenever you're ready to continue.",
        },
      ]);
      setReminderSent(true);
      silenceTimerRef.current = null;
    }, 120_000);
  }, [clearSilenceTimer]);

  const scrollToBottom = () => {
    if (scrollRef.current && !userScrolledUpRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const checkUserScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      userScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 100;
    }
  };

  /* ──────────────  intro script  ───────────── */
  useEffect(() => {
    if (onboardingStep === "intro1")
      showMessageWithDelay("Hey, I'm really glad you're here.", "intro2");
    if (onboardingStep === "intro2")
      showMessageWithDelay(
        "This space is just for you — to say what you're feeling, without pressure or judgment. I'm here to listen, no matter what's on your mind.",
        "intro3"
      );
    if (onboardingStep === "intro3")
      showMessageWithDelay(
        "Everything you say stays 100% confidential. I don't share anything. Ever.",
        "invite"
      );
    if (onboardingStep === "invite")
      showMessageWithDelay(
        "It's a space to be real — even if that means confused, angry, numb, or all of the above. I'll never judge or rush you.",
        "done"
      );
  }, [onboardingStep]);

  const showMessageWithDelay = (text: string, nextStep: OnboardingStep) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "engine", text }]);
      setOnboardingStep(nextStep);
      setIsTyping(false);
    }, 2500);
  };

  /* ──────────────  autoscroll  ───────────── */
  useEffect(scrollToBottom, [messages]);
  useEffect(() => clearSilenceTimer, [clearSilenceTimer]);

  /* ──────────────  load history + profile  ───────────── */
  useEffect(() => {
    async function loadThreadHistory() {
      try {
        // Use the new endpoint
        const res = await fetch(`/api/memory/${threadId}`);
        if (!res.ok) {
          console.error("Failed to load thread history:", res.statusText);
          return;
        }
        const data = await res.json();
        const parsed = (data.memory || []).map((m: MemoryEntry) => ({
          sender: m.role === "assistant" ? "engine" : "user",
          text: m.content,
        }));
        setMessages(parsed);

        // Also store recent messages in short-term memory
        // Only process the last 5 messages to avoid overloading short-term memory
        const recentMessages = data.memory?.slice(-5) || [];
        for (const msg of recentMessages) {
          storeConversationMessage(
            threadId,
            msg.role as "user" | "assistant",
            msg.content
          );

          // Extract names from user messages
          if (msg.role === "user") {
            extractAndStoreUserName(threadId, msg.content);
          }
        }
      } catch (error) {
        console.error("Error loading thread history:", error);
      }
    }
    if (threadId) loadThreadHistory();
  }, [threadId]);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const res = await fetch(`/api/profile/${threadId}`);
        if (!res.ok) {
          console.error("Failed to load user profile:", res.statusText);
          return;
        }
        const { profile } = await res.json();
        if (profile?.name) {
          // Store the name in short-term memory
          storeInShortTermMemory(threadId, "userName", profile.name);
        }

        // If onboarding is already complete, skip the intro
        if (profile?.onboarding_completed) {
          setOnboardingStep("done");
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    }
    if (threadId) loadUserProfile();
  }, [threadId]);

  /* ──────────────  send  ───────────── */
  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt) return;
    clearSilenceTimer();
    setReminderSent(false);
    setMessages((prev) => [...prev, { sender: "user", text: prompt }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);
    setIsTyping(true);

    try {
      if (onboardingStep !== "done") {
        setTimeout(async () => {
          if (prompt.toLowerCase() === "skip") {
            setOnboardingStep("done");
            setMessages((prev) => [
              ...prev,
              {
                sender: "engine",
                text: "Thank you. We can start wherever you like.",
              },
            ]);
          } else {
            await fetch("/api/onboarding", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                threadId,
                name: prompt,
                completeOnboarding: true, // Mark onboarding as complete
              }),
            });
            setOnboardingStep("done");
            setMessages((prev) => [
              ...prev,
              {
                sender: "engine",
                text: "Thank you. We can start wherever you like.",
              },
            ]);
          }
          setIsTyping(false);
        }, 1500);
      } else {
        // Store the user's message in short-term memory first
        storeConversationMessage(threadId, "user", prompt);

        // Check if user is asking about their name
        const { isNameQuery, name } = handleNameQuery(threadId, prompt);

        if (isNameQuery && name) {
          // If the user is asking about their name and we have it in short-term memory,
          // respond immediately without calling the API
          setTimeout(() => {
            const response = `Your name is ${name}.`;
            setMessages((prev) => [
              ...prev,
              { sender: "engine", text: response },
            ]);

            // Also store the assistant's response in short-term memory
            storeConversationMessage(threadId, "assistant", response);

            if (!reminderSent) scheduleSilenceHandler();
            setIsTyping(false);
            setIsLoading(false);
          }, 1000);
          return;
        }

        // For other queries, proceed with normal memory pipeline

        // Store the user's message in memory
        console.log("Storing user message in memory");
        await memorizeMessage(prompt, "user");

        // Retrieve relevant memories based on the user's message
        console.log("Retrieving relevant memories");
        const memories = await retrieveMemories(prompt);
        console.log(`Retrieved ${memories.length} relevant memories`);

        // Get memory context formatted for the AI
        const memoryContext = getMemoryContext();
        console.log("Memory context:", memoryContext ? "Present" : "None");

        // Call the API with memory context
        console.log("Sending request to /api/shrink with memory context");
        const res = await fetch("/api/shrink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            threadId,
            memoryContext,
          }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { sender: "engine", text: data.response_text },
        ]);

        // Store the assistant's response in both memory systems
        await memorizeMessage(data.response_text, "assistant");
        storeConversationMessage(threadId, "assistant", data.response_text);

        if (!reminderSent) scheduleSilenceHandler();
        setIsTyping(false);
      }
    } catch (err) {
      console.error("Error in chat submission:", err);
      setIsTyping(false);
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        variant: "destructive",
      });
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

  /* ──────────────  render  ───────────── */
  return (
    <div className="w-full max-w-[42rem] mx-auto py-12 px-4 flex flex-col h-screen">
      <Card className="flex-1 flex overflow-hidden">
        <CardContent
          ref={scrollRef}
          onScroll={checkUserScroll}
          className="space-y-4 p-6 flex flex-col flex-1 overflow-y-auto min-h-0"
          style={{ wordBreak: "break-word" }}
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
                <FeedbackForm
                  sessionId={threadId}
                  responseId={`response-${idx}`}
                />
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
          {isLoadingMemories && (
            <div className="text-xs text-muted-foreground italic">
              Retrieving relevant context...
            </div>
          )}
          {relevantMemories.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <details>
                <summary className="cursor-pointer">
                  Using {relevantMemories.length} memories
                </summary>
                <ul className="mt-1 pl-4 list-disc">
                  {relevantMemories.map((memory, i) => (
                    <li key={i} className="mb-1">
                      {memory.summary}
                      <span className="text-gray-400 ml-1">
                        (Similarity:{" "}
                        {(memory.similarity_score * 100).toFixed(1)}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
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
              setOnboardingStep("intro1");
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
