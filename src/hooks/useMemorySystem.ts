"use client";

import { useState, useCallback, useEffect } from "react";
import type { ThreadId } from "@/lib/types";

interface Memory {
  id: string;
  summary: string;
  similarity_score: number;
  thread_id?: string;
}

export function useMemorySystem(threadId: ThreadId | null) {
  const [relevantMemories, setRelevantMemories] = useState<Memory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize memory enabled state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("memoryEnabled");
      if (savedState !== null) {
        setMemoryEnabled(savedState === "true");
      }
    }
  }, []);

  // Save memory enabled state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("memoryEnabled", memoryEnabled.toString());
    }
  }, [memoryEnabled]);

  // Store a memory
  const storeMemory = useCallback(
    async (content: string, role: "user" | "engine") => {
      if (!memoryEnabled || !threadId) {
        console.log(
          "Memory storage skipped: ",
          !memoryEnabled ? "memory disabled" : "no threadId"
        );
        return null;
      }

      setError(null);
      console.log(`Storing memory for ${role}: ${content.substring(0, 50)}...`);

      try {
        const response = await fetch(`/api/memory/${threadId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authorRole: role,
            content,
            summary: content,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Failed to store memory: ${response.status} ${response.statusText}`,
            errorText
          );
          setError(`Failed to store memory: ${response.statusText}`);
          return null;
        }

        const result = await response.json();
        console.log("Memory stored successfully:", result);
        return result;
      } catch (error) {
        console.error("Error storing memory:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Unknown error storing memory"
        );
        return null;
      }
    },
    [threadId, memoryEnabled]
  );

  // Fetch relevant memories
  const fetchRelevantMemories = useCallback(
    async (query: string): Promise<Memory[]> => {
      if (!memoryEnabled || !threadId || !query.trim()) {
        console.log(
          "Memory fetch skipped: ",
          !memoryEnabled
            ? "memory disabled"
            : !threadId
            ? "no threadId"
            : "empty query"
        );
        setRelevantMemories([]);
        return [];
      }

      setIsLoadingMemories(true);
      setError(null);
      console.log(`Fetching memories for query: ${query.substring(0, 50)}...`);

      try {
        const response = await fetch("/api/memory/relevant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threadId,
            query,
            threshold: 0.6,
            limit: 5,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Failed to fetch memories: ${response.status} ${response.statusText}`,
            errorText
          );
          setError(`Failed to fetch memories: ${response.statusText}`);
          setRelevantMemories([]);
          return [];
        }

        const data = await response.json();
        console.log("Memories retrieved:", data.memories);
        const memories = data.memories || [];
        setRelevantMemories(memories);
        return memories;
      } catch (error) {
        console.error("Error fetching relevant memories:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Unknown error fetching memories"
        );
        setRelevantMemories([]);
        return [];
      } finally {
        setIsLoadingMemories(false);
      }
    },
    [threadId, memoryEnabled]
  );

  // Format memory context for the AI
  const formatMemoryContext = useCallback(
    (memories: Memory[] = relevantMemories): string => {
      if (!memoryEnabled || memories.length === 0) return "";

      return `
Relevant context from previous conversations:
${memories.map((memory, i) => `${i + 1}. ${memory.summary}`).join("\n")}

Please consider this context when responding.
`;
    },
    [memoryEnabled, relevantMemories]
  );

  // Clear all memories for a thread
  const clearMemories = useCallback(async () => {
    if (!threadId) return;

    setError(null);
    try {
      const response = await fetch(`/api/memory/${threadId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to clear memories: ${response.status} ${response.statusText}`,
          errorText
        );
        setError(`Failed to clear memories: ${response.statusText}`);
        return;
      }

      console.log("Memories cleared successfully");
      setRelevantMemories([]);
    } catch (error) {
      console.error("Error clearing memories:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Unknown error clearing memories"
      );
    }
  }, [threadId]);

  return {
    relevantMemories,
    isLoadingMemories,
    memoryEnabled,
    setMemoryEnabled,
    fetchRelevantMemories,
    formatMemoryContext,
    storeMemory,
    clearMemories,
    error,
  };
}
