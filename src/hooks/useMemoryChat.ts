"use client";

import { useState, useCallback } from "react";
import { useMemorySystem } from "./useMemorySystem";
import type { ThreadId } from "@/lib/types";

interface MemoryChatOptions {
  threadId: ThreadId;
  onError?: (error: Error | unknown) => void;
}

export function useMemoryChat({ threadId, onError }: MemoryChatOptions) {
  const {
    relevantMemories,
    isLoadingMemories,
    memoryEnabled,
    setMemoryEnabled,
    fetchRelevantMemories,
    formatMemoryContext,
    storeMemory,
    error: memoryError,
  } = useMemorySystem(threadId);

  const [chatHistory, setChatHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);

  // Function to memorize a message and update chat history
  const memorizeMessage = useCallback(
    async (content: string, role: "user" | "assistant") => {
      try {
        console.log(
          `Memorizing ${role} message: ${content.substring(0, 50)}...`
        );

        // Store in memory system
        const result = await storeMemory(
          content,
          role === "assistant" ? "engine" : "user"
        );

        if (!result) {
          console.warn("Failed to store memory, but continuing with chat");
        }

        // Update chat history
        setChatHistory((prev) => [...prev, { role, content }]);

        return true;
      } catch (error) {
        console.error("Error memorizing message:", error);
        if (onError) onError(error);
        return false;
      }
    },
    [storeMemory, onError]
  );

  // Function to retrieve relevant memories
  const retrieveMemories = useCallback(
    async (message: string) => {
      try {
        console.log(`Retrieving memories for: ${message.substring(0, 50)}...`);
        return await fetchRelevantMemories(message);
      } catch (error) {
        console.error("Error retrieving memories:", error);
        if (onError) onError(error);
        return [];
      }
    },
    [fetchRelevantMemories, onError]
  );

  // Function to get memory context formatted for the AI
  const getMemoryContext = useCallback(() => {
    return formatMemoryContext(relevantMemories);
  }, [formatMemoryContext, relevantMemories]);

  // Report any memory errors to the parent component
  if (memoryError && onError) {
    onError(memoryError);
  }

  return {
    chatHistory,
    relevantMemories,
    isLoadingMemories,
    memoryEnabled,
    setMemoryEnabled,
    retrieveMemories,
    memorizeMessage,
    getMemoryContext,
  };
}
