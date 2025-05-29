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
  getFromShortTermMemory,
} from "@/lib/shortTermMemory";
import { logChatClient } from "@/lib/chatLogger";
import { getTimeContext } from "@/lib/timeUtils";

// Set this to a new value whenever you want to reset all users
const APP_VERSION = "2.1.0";

interface Message {
  sender: "user" | "engine";
  text: string;
  id?: string; // Add optional ID for database reference
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
      // Only reset if there's an existing version that's different (not for new users)
      const needsReset = storedVersion && storedVersion !== APP_VERSION;

      if (needsReset) {
        console.log(
          `App version changed from ${storedVersion} to ${APP_VERSION}, resetting user data`
        );
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

      // If no stored version, this is likely a new user - store version without reset
      if (!storedVersion) {
        localStorage.setItem("app_version", APP_VERSION);
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
      if (stored) {
        return stored;
      }

      // Then check cookies
      const match = document.cookie.match(/sw_uid=([^;]+)/);
      if (match) {
        const id = match[1];
        sessionStorage.setItem("threadId", id);
        return id;
      }

      // If nothing found, generate new
      const id = uuid();
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
  const introStartedRef = useRef(false); // Add this ref
  const turnCountRef = useRef(0); // Track turn count for messages

  /* ──────────────  helpers  ───────────── */
  const logMessageWithTurn = useCallback(
    async (role: "user" | "assistant", content: string): Promise<string> => {
      turnCountRef.current += 1;
      return await logChatClient({
        threadId,
        turn: turnCountRef.current,
        role,
        content,
      });
    },
    [threadId]
  );
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const scheduleSilenceHandler = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(async () => {
      const reminderText = "I'm here whenever you're ready to continue.";
      const messageId = await logMessageWithTurn("assistant", reminderText);
      setMessages((prev) => [
        ...prev,
        {
          sender: "engine",
          text: reminderText,
          id: messageId,
        },
      ]);
      setReminderSent(true);
      silenceTimerRef.current = null;
    }, 120_000);
  }, [clearSilenceTimer, logMessageWithTurn]);

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
  const showIntroSequence = useCallback(
    (introMsgs: string[], introShownKey?: string) => {
      const addMessagesSequentially = async (index: number) => {
        if (index >= introMsgs.length) {
          setOnboardingStep("done");
          return;
        }

        // Show typing indicator before each message
        setIsTyping(true);

        setTimeout(async () => {
          // Store message in database and get ID
          const messageId = await logMessageWithTurn(
            "assistant",
            introMsgs[index]
          );

          // Add the message and hide typing indicator
          setMessages((prev) => [
            ...prev,
            { sender: "engine", text: introMsgs[index], id: messageId },
          ]);
          setIsTyping(false);

          if (index === introMsgs.length - 1) {
            // Last message - we're done, now safe to mark intro as shown
            if (introShownKey) {
              localStorage.setItem(introShownKey, "true");
              console.log(
                "✅ Intro sequence completed - localStorage flag set"
              );
            }
            setOnboardingStep("done");
          } else {
            // Wait a bit before starting the next message
            setTimeout(() => {
              addMessagesSequentially(index + 1);
            }, 1500); // 1.5 second pause between messages
          }
        }, 2000); // 2 seconds of typing indicator per message
      };

      addMessagesSequentially(0);
    },
    [setOnboardingStep, setIsTyping, setMessages, logMessageWithTurn]
  ); // Remove threadId dependency

  // Helper function to generate a personalized welcome back message
  const generateWelcomeBackMessage = useCallback(
    (messages: Message[]) => {
      // Get all context data from short-term memory
      const topicsString =
        getFromShortTermMemory(threadId, "conversationTopics") || "";
      const topics = topicsString ? topicsString.split(",") : [];
      const emotionsString =
        getFromShortTermMemory(threadId, "userEmotions") || "";
      const emotions = emotionsString ? emotionsString.split(",") : [];
      const rawUserName = getFromShortTermMemory(threadId, "userName");
      // Only use userName if it's meaningful (not empty, not "anonymous", and at least 2 characters)
      const userName =
        rawUserName &&
        rawUserName.toLowerCase() !== "anonymous" &&
        rawUserName.trim().length > 1
          ? rawUserName
          : null;
      const conversationLength = Number(
        getFromShortTermMemory(threadId, "conversationLength") || "0"
      );
      const lastDate = getFromShortTermMemory(threadId, "lastInteractionDate");

      // Determine how long it's been since the last interaction if available
      let timeSinceLastVisit = "";
      if (lastDate) {
        try {
          const lastVisit = new Date(lastDate);
          const now = new Date();
          const daysSince = Math.floor(
            (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSince === 0) {
            timeSinceLastVisit = "today";
          } else if (daysSince === 1) {
            timeSinceLastVisit = "yesterday";
          } else if (daysSince < 7) {
            timeSinceLastVisit = `${daysSince} days ago`;
          } else if (daysSince < 30) {
            const weeks = Math.floor(daysSince / 7);
            timeSinceLastVisit = `${weeks} ${
              weeks === 1 ? "week" : "weeks"
            } ago`;
          } else {
            const months = Math.floor(daysSince / 30);
            timeSinceLastVisit = `${months} ${
              months === 1 ? "month" : "months"
            } ago`;
          }
        } catch (e) {
          console.error("Error calculating time since last visit:", e);
        }
      }

      const userMessages = messages.filter((msg) => msg.sender === "user");

      // For brand new returning users with no messages but completed onboarding
      if (userMessages.length === 0) {
        if (userName) {
          if (timeSinceLastVisit) {
            return `Welcome back, ${userName}! It's been ${timeSinceLastVisit} since we last talked. How have you been?`;
          }
          return `Welcome back, ${userName}! It's great to see you again. What's been on your mind?`;
        }
        return "Welcome back! It's great to see you again. What's been on your mind?";
      }

      // Generate responses based on patterns, topics, and emotions
      // First check for topics in the conversation
      if (
        topics.some((topic) =>
          ["work", "job", "career", "boss", "coworker", "colleague"].includes(
            topic
          )
        )
      ) {
        return userName
          ? `Welcome back, ${userName}! How's work been treating you since we last talked${
              timeSinceLastVisit ? ` ${timeSinceLastVisit}` : ""
            }?`
          : `Welcome back! How's work been treating you since we last talked${
              timeSinceLastVisit ? ` ${timeSinceLastVisit}` : ""
            }?`;
      } else if (
        topics.some((topic) =>
          ["anxiety", "worry", "nervous", "fear", "panic", "stress"].includes(
            topic
          )
        )
      ) {
        return userName
          ? `Welcome back, ${userName}! I hope your anxiety levels have been lower since our last conversation${
              timeSinceLastVisit ? ` ${timeSinceLastVisit}` : ""
            }.`
          : `Welcome back! I hope your anxiety levels have been lower since our last conversation${
              timeSinceLastVisit ? ` ${timeSinceLastVisit}` : ""
            }.`;
      } else if (
        topics.some((topic) =>
          [
            "relationship",
            "partner",
            "dating",
            "girlfriend",
            "boyfriend",
            "spouse",
          ].includes(topic)
        )
      ) {
        return userName
          ? `Welcome back, ${userName}! How have things been with your relationship since we last spoke${
              timeSinceLastVisit ? ` ${timeSinceLastVisit}` : ""
            }?`
          : `Welcome back! How have things been with your relationship since we last spoke${
              timeSinceLastVisit ? ` ${timeSinceLastVisit}` : ""
            }?`;
      } else if (
        topics.some((topic) =>
          [
            "family",
            "mom",
            "dad",
            "parent",
            "sibling",
            "brother",
            "sister",
          ].includes(topic)
        )
      ) {
        return userName
          ? `Welcome back, ${userName}! How have things been with your family${
              timeSinceLastVisit
                ? ` since we chatted ${timeSinceLastVisit}`
                : ""
            }?`
          : `Welcome back! How have things been with your family${
              timeSinceLastVisit
                ? ` since we chatted ${timeSinceLastVisit}`
                : ""
            }?`;
      } else if (
        topics.some((topic) =>
          ["sleep", "tired", "exhausted", "insomnia", "rest"].includes(topic)
        )
      ) {
        return userName
          ? `Welcome back, ${userName}! Have you been sleeping any better since our last conversation?`
          : "Welcome back! Have you been sleeping any better since our last conversation?";
      } else if (
        topics.some((topic) =>
          ["health", "sick", "illness", "doctor", "symptom", "pain"].includes(
            topic
          )
        )
      ) {
        return userName
          ? `Welcome back, ${userName}! How has your health been${
              timeSinceLastVisit ? ` since we talked ${timeSinceLastVisit}` : ""
            }?`
          : `Welcome back! How has your health been${
              timeSinceLastVisit ? ` since we talked ${timeSinceLastVisit}` : ""
            }?`;
      }

      // Next check for emotions in conversation
      else if (
        emotions.some((emotion) =>
          ["happy", "joy", "excited", "delighted", "pleased"].includes(emotion)
        )
      ) {
        return userName
          ? `Welcome back, ${userName}! Has that positive energy been sticking with you${
              timeSinceLastVisit
                ? ` since we chatted ${timeSinceLastVisit}`
                : ""
            }?`
          : `Welcome back! Has that positive energy been sticking with you${
              timeSinceLastVisit
                ? ` since we chatted ${timeSinceLastVisit}`
                : ""
            }?`;
      } else if (
        emotions.some((emotion) =>
          ["sad", "unhappy", "depressed", "grief", "sorrow"].includes(emotion)
        )
      ) {
        return userName
          ? `Welcome back, ${userName}. I hope things have gotten a bit easier for you since our last conversation.`
          : "Welcome back. I hope things have gotten a bit easier for you since our last conversation.";
      } else if (
        emotions.some((emotion) =>
          ["angry", "mad", "frustrated", "irritated", "annoyed"].includes(
            emotion
          )
        )
      ) {
        return userName
          ? `Welcome back, ${userName}. I hope you're feeling less frustrated than when we last spoke.`
          : "Welcome back. I hope you're feeling less frustrated than when we last spoke.";
      }

      // If no specific topics or emotions, base on conversation length
      else if (conversationLength > 20) {
        return userName
          ? `Welcome back, ${userName}! It's great to continue our conversations. What's been on your mind${
              timeSinceLastVisit ? ` since we talked ${timeSinceLastVisit}` : ""
            }?`
          : `Welcome back! It's great to continue our conversations. What's been on your mind${
              timeSinceLastVisit ? ` since we talked ${timeSinceLastVisit}` : ""
            }?`;
      } else if (conversationLength > 10) {
        return userName
          ? `Welcome back, ${userName}! Looking forward to continuing our conversation. How have you been${
              timeSinceLastVisit
                ? ` since we chatted ${timeSinceLastVisit}`
                : ""
            }?`
          : `Welcome back! Looking forward to continuing our conversation. How have you been${
              timeSinceLastVisit
                ? ` since we chatted ${timeSinceLastVisit}`
                : ""
            }?`;
      } else if (conversationLength > 5) {
        return userName
          ? `Welcome back, ${userName}! How has life been treating you${
              timeSinceLastVisit
                ? ` since our conversation ${timeSinceLastVisit}`
                : ""
            }?`
          : `Welcome back! How has life been treating you${
              timeSinceLastVisit
                ? ` since our conversation ${timeSinceLastVisit}`
                : ""
            }?`;
      } else {
        // Default for returning users with limited history
        return userName
          ? `Welcome back, ${userName}! I'm here to continue our conversation whenever you're ready.`
          : "Welcome back! I'm here to continue our conversation whenever you're ready.";
      }
    },
    [threadId]
  );

  useEffect(() => {
    // Skip if no threadId or already started
    if (!threadId || introStartedRef.current) return;

    console.log(`=== MAIN USER FLOW LOGIC ===`);
    console.log(`onboardingStep: ${onboardingStep}`);

    // Check localStorage flags
    const introShownKey = `intro_shown_${threadId}`;
    const onboardingCompleteKey = `onboarding_complete`;
    const hasIntroBeenShown = localStorage.getItem(introShownKey) === "true";
    const isOnboardingComplete =
      localStorage.getItem(onboardingCompleteKey) === "true";
    const storedIsReturningUser =
      getFromShortTermMemory(threadId, "isReturningUser") === "true";

    console.log(
      `Flags - hasIntroBeenShown: ${hasIntroBeenShown}, isOnboardingComplete: ${isOnboardingComplete}, storedIsReturningUser: ${storedIsReturningUser}, messagesLength: ${messages.length}`
    );

    // RETURNING USER: Has seen intro before
    if (hasIntroBeenShown) {
      console.log("🔄 RETURNING USER: Has seen intro before");
      setOnboardingStep("done");
      introStartedRef.current = true;
      storeInShortTermMemory(threadId, "isReturningUser", "true");

      // Show welcome back message for returning users
      setTimeout(async () => {
        const welcomeBackMessage = generateWelcomeBackMessage(messages);
        const messageId = await logMessageWithTurn(
          "assistant",
          welcomeBackMessage
        );
        setMessages((prev) => [
          ...prev,
          { sender: "engine", text: welcomeBackMessage, id: messageId },
        ]);

        storeConversationMessage(threadId, "assistant", welcomeBackMessage);
        storeInShortTermMemory(
          threadId,
          "lastInteractionDate",
          new Date().toISOString()
        );
      }, 1000);
      return;
    }

    // NEW USER: Just completed onboarding, needs intro sequence
    if (
      onboardingStep === "intro1" &&
      isOnboardingComplete &&
      !hasIntroBeenShown
    ) {
      console.log("🎯 NEW USER: Starting intro sequence!");
      introStartedRef.current = true;
      // NOTE: localStorage flag is now set AFTER intro completes in showIntroSequence

      const introMessages = [
        "Before we get started I just want you to know…",
        "Your thoughts, feelings, experiences, words, and emotions are all valid and deserving of respect.",
        "I am not here to fix, I am here to listen.",
        "Sometimes, that's really all you need.",
        "With that said, I'm ready when you are. Anything specific on your mind?",
      ];
      showIntroSequence(introMessages, introShownKey);
      return;
    }

    console.log(
      "No action taken - waiting for onboarding completion or clear user state"
    );
  }, [
    onboardingStep,
    showIntroSequence,
    threadId,
    messages,
    generateWelcomeBackMessage,
    logMessageWithTurn,
  ]);

  /* ──────────────  autoscroll  ───────────── */
  useEffect(scrollToBottom, [messages]);
  useEffect(() => clearSilenceTimer, [clearSilenceTimer]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount if needed
    };
  }, []);

  /* ──────────────  load history + profile  ───────────── */
  useEffect(() => {
    async function loadThreadHistory() {
      try {
        // Use the memory endpoint to get chat history
        const res = await fetch(`/api/memory/${threadId}`);
        if (!res.ok) {
          console.error("Failed to load thread history:", res.statusText);
          return;
        }

        const data = await res.json();
        // Map the memory entries to message format
        const parsed = (data.memory || []).map(
          (m: MemoryEntry, index: number) => ({
            sender: m.role === "assistant" ? "engine" : "user",
            text: m.content,
            id: `historical-${index}`, // Temporary ID for historical messages
          })
        );
        setMessages(parsed);

        // Also store recent messages in short-term memory
        // Process the last 15 messages for better context, increased from 10
        const recentMessages = data.memory?.slice(-15) || [];

        // Track topics to improve personalized welcome messages with more categories
        const topics = new Set();
        // Track emotional states for better personalization
        const emotions = new Set();
        // Store last interaction date
        const lastDate = new Date().toISOString();
        storeInShortTermMemory(threadId, "lastInteractionDate", lastDate);

        for (const msg of recentMessages) {
          // Store in short-term conversation memory
          storeConversationMessage(
            threadId,
            msg.role as "user" | "assistant",
            msg.content
          );

          // Extract names from user messages
          if (msg.role === "user") {
            extractAndStoreUserName(threadId, msg.content);

            // Extract potential topics from user messages for better personalization
            const userText = msg.content.toLowerCase();

            // Enhanced topic detection - more comprehensive list
            [
              "work",
              "job",
              "career",
              "boss",
              "coworker",
              "colleague",
              "family",
              "mom",
              "dad",
              "parent",
              "sibling",
              "brother",
              "sister",
              "child",
              "kid",
              "anxiety",
              "worry",
              "nervous",
              "fear",
              "panic",
              "relationship",
              "partner",
              "dating",
              "girlfriend",
              "boyfriend",
              "spouse",
              "marriage",
              "health",
              "sick",
              "illness",
              "doctor",
              "symptom",
              "pain",
              "sleep",
              "tired",
              "exhausted",
              "insomnia",
              "rest",
              "stress",
              "overwhelm",
              "burden",
              "pressure",
              "depression",
              "sad",
              "down",
              "hopeless",
              "blue",
              "therapy",
              "counseling",
              "psychiatrist",
              "psychologist",
              "treatment",
              "goals",
              "achievement",
              "ambition",
              "future",
              "plan",
              "hobby",
              "interest",
              "passion",
              "free time",
              "fun",
              "exercise",
              "workout",
              "fitness",
              "gym",
              "running",
            ].forEach((topic) => {
              if (userText.includes(topic)) {
                topics.add(topic);
              }
            });

            // Extract emotions for better contextual understanding
            [
              "happy",
              "joy",
              "excited",
              "delighted",
              "pleased",
              "sad",
              "unhappy",
              "depressed",
              "grief",
              "sorrow",
              "angry",
              "mad",
              "frustrated",
              "irritated",
              "annoyed",
              "afraid",
              "scared",
              "fearful",
              "terrified",
              "anxious",
              "surprised",
              "shocked",
              "astonished",
              "amazed",
              "confused",
              "puzzled",
              "perplexed",
              "unsure",
              "hopeful",
              "optimistic",
              "looking forward",
            ].forEach((emotion) => {
              if (userText.includes(emotion)) {
                emotions.add(emotion);
              }
            });
          }
        }

        // Store discovered topics in short-term memory
        if (topics.size > 0) {
          storeInShortTermMemory(
            threadId,
            "conversationTopics",
            Array.from(topics).join(",")
          );
        }

        // Store detected emotions in short-term memory
        if (emotions.size > 0) {
          storeInShortTermMemory(
            threadId,
            "userEmotions",
            Array.from(emotions).join(",")
          );
        }

        // Store conversation length for personalization
        storeInShortTermMemory(
          threadId,
          "conversationLength",
          String(parsed.length)
        );

        console.log(
          `Loaded ${
            parsed.length
          } messages from thread history, identified topics: ${Array.from(
            topics
          ).join(", ")}`
        );
        if (emotions.size > 0) {
          console.log(`Detected emotions: ${Array.from(emotions).join(", ")}`);
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
        console.log(`Loading user profile for threadId: ${threadId}`);
        const res = await fetch(`/api/profile/${threadId}`);
        if (!res.ok) {
          console.error("Failed to load user profile:", res.statusText);
          return;
        }

        const { profile } = await res.json();

        if (profile) {
          console.log(
            `Profile loaded successfully. Onboarding status: ${
              profile.onboarding_completed ? "completed" : "not completed"
            }`
          );

          // Enhanced profile data handling
          const isReturningUser = !!profile.onboarding_completed;
          console.log(
            `User identified as: ${isReturningUser ? "returning" : "new"} user`
          );

          // Store name in short-term memory if available
          if (
            profile.name &&
            profile.name !== "Anonymous" &&
            profile.name !== "New User"
          ) {
            storeInShortTermMemory(threadId, "userName", profile.name);
            console.log(
              `Stored user name in short-term memory: ${profile.name}`
            );
          }

          // Store emotional tone and concerns in short-term memory if available
          if (profile.emotional_tone && profile.emotional_tone.length > 0) {
            storeInShortTermMemory(
              threadId,
              "emotionalTone",
              profile.emotional_tone.join(",")
            );
          }

          if (profile.concerns && profile.concerns.length > 0) {
            storeInShortTermMemory(
              threadId,
              "concerns",
              profile.concerns.join(",")
            );
          }

          // Store returning user status in short-term memory
          storeInShortTermMemory(
            threadId,
            "isReturningUser",
            String(isReturningUser)
          );

          // Store completion status in localStorage for redundancy if onboarding is complete
          if (profile.onboarding_completed) {
            localStorage.setItem("onboarding_complete", "true");
            // DON'T automatically set onboardingStep to "done" here
            // Let the main useEffect determine if this is a new user needing intro or returning user
          }
        } else {
          console.log("No profile found, user may be new");
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

    // Store user message in database and get ID
    const userMessageId = await logMessageWithTurn("user", prompt);

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: prompt, id: userMessageId },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);
    setIsTyping(true);

    try {
      if (onboardingStep !== "done") {
        setTimeout(async () => {
          if (prompt.toLowerCase() === "skip") {
            setOnboardingStep("done");
            const messageId = await logMessageWithTurn(
              "assistant",
              "Thank you. We can start wherever you like."
            );
            setMessages((prev) => [
              ...prev,
              {
                sender: "engine",
                text: "Thank you. We can start wherever you like.",
                id: messageId,
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
            const messageId = await logMessageWithTurn(
              "assistant",
              "Thank you. We can start wherever you like."
            );
            setMessages((prev) => [
              ...prev,
              {
                sender: "engine",
                text: "Thank you. We can start wherever you like.",
                id: messageId,
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
          setTimeout(async () => {
            const response = `Your name is ${name}.`;
            const messageId = await logMessageWithTurn("assistant", response);
            setMessages((prev) => [
              ...prev,
              { sender: "engine", text: response, id: messageId },
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

        // Gather additional context from short-term memory
        const rawUserName = getFromShortTermMemory(threadId, "userName");
        // Only use userName if it's meaningful (not empty, not "anonymous", and at least 2 characters)
        const userName =
          rawUserName &&
          rawUserName.toLowerCase() !== "anonymous" &&
          rawUserName.trim().length > 1
            ? rawUserName
            : null;
        const userEmotions =
          getFromShortTermMemory(threadId, "userEmotions") || null;
        const conversationTopics =
          getFromShortTermMemory(threadId, "conversationTopics") || null;
        const userPreferences =
          getFromShortTermMemory(threadId, "userPreferences") || null;
        const conversationLength =
          getFromShortTermMemory(threadId, "conversationLength") || "0";

        // Get time context
        const timeContext = getTimeContext();

        // Enhanced context object
        const enhancedContext = {
          userName,
          userEmotions,
          conversationTopics,
          userPreferences,
          conversationLength: parseInt(conversationLength, 10),
          isReturningUser: true,
          userTime: timeContext.userTime,
          userTimezone: timeContext.userTimezone,
          timeOfDay: timeContext.timeOfDay,
          localDateTime: timeContext.localDateTime,
        };

        console.log("Enhanced context:", enhancedContext);

        const res = await fetch("/api/shrink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            threadId,
            memoryContext,
            enhancedContext, // Add the enhanced context
          }),
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();

        // Store assistant response in database and get ID
        const assistantMessageId = await logMessageWithTurn(
          "assistant",
          data.response_text
        );

        setMessages((prev) => [
          ...prev,
          {
            sender: "engine",
            text: data.response_text,
            id: assistantMessageId,
          },
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
              {msg.sender === "engine" && msg.id && (
                <FeedbackForm sessionId={threadId} responseId={msg.id} />
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
              // Reset both the ref and localStorage flag
              introStartedRef.current = false;
              localStorage.removeItem(`intro_shown_${threadId}`);
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
