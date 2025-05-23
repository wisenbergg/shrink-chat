"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/context/SessionContext";
import { ensureProfileExists, getUserProfile } from "@/lib/sessionMemory";
import { supabase } from "@/lib/sessionMemory"; // Import supabase client directly
import {
  insertMemoryAction,
  getRelevantMemoriesAction,
} from "../actions/memory-actions";
import type { MemoryEntry, UserProfile } from "@/lib/sessionMemory";

// Database schema types
interface ThreadData {
  id: string;
  created_at: string;
}

interface MemoryData {
  id: string;
  thread_id: string;
  created_at: string;
  summary: string;
}

// Extended interface for memory entries with similarity score
interface MemorySearchResult extends Omit<MemoryEntry, "embedding"> {
  similarity_score?: number;
}

// Debug info type to ensure type safety
interface DebugInfo {
  thread?: ThreadData | null;
  threadError?: string | null;
  profile?: UserProfile | null;
  memory?: MemoryData[] | null;
  memoryError?: string | null;
  error?: string;
  currentStep?: string;
  profileExists?: boolean;
  searchResults?: MemorySearchResult[];
}

export default function TestMemoryPage() {
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState<MemoryEntry | string | null>(null);
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const { threadId } = useSession();

  // Check database status on component mount
  useEffect(() => {
    async function checkDatabaseStatus() {
      if (!threadId) return;

      try {
        // Check if thread exists
        const { data: thread, error: threadError } = await supabase
          .from("threads")
          .select("id, created_at")
          .eq("id", threadId)
          .single();

        // Check if profile exists
        const profile = await getUserProfile(threadId);

        // Check for any memory entries
        const { data: memoryEntries, error: memoryError } = await supabase
          .from("memory")
          .select("id, thread_id, created_at, summary")
          .eq("thread_id", threadId)
          .limit(5);

        setDebugInfo({
          thread: thread || null,
          threadError: threadError?.message || null,
          profile: profile || null,
          memory: memoryEntries || [],
          memoryError: memoryError?.message || null,
        });
      } catch (err) {
        console.error("Error checking database status:", err);
        setDebugInfo({
          error:
            err instanceof Error
              ? err.message
              : "Unknown error checking database status",
        });
      }
    }

    checkDatabaseStatus();
  }, [threadId, result]);

  const handleInsertMemory = async () => {
    if (!message) {
      setError("Please enter a message");
      return;
    }

    if (!threadId) {
      setError("No thread ID available");
      return;
    }

    try {
      setError(null);
      setDebugInfo((prev) => ({
        ...prev,
        currentStep: "Starting memory insertion",
      }));

      // First ensure thread and profile exist
      setDebugInfo((prev) => ({
        ...prev,
        currentStep: "Ensuring profile exists",
      }));
      const profileExists = await ensureProfileExists(threadId);
      setDebugInfo((prev) => ({ ...prev, profileExists }));

      if (!profileExists) {
        throw new Error("Failed to ensure profile exists");
      }

      // Insert memory using server action
      setDebugInfo((prev) => ({ ...prev, currentStep: "Inserting memory" }));
      const response = await insertMemoryAction({
        threadId,
        author_role: "user",
        summary: message,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to insert memory");
      }

      setDebugInfo((prev) => ({
        ...prev,
        currentStep: "Memory insertion complete",
        memory: response.data,
      }));
      setResult(response.data);
      setMessage("");
    } catch (err) {
      console.error("Error inserting memory:", err);
      setDebugInfo((prev) => ({
        ...prev,
        currentStep: "Error during memory insertion",
        error: err instanceof Error ? err.message : "Unknown error",
      }));
      setError(err instanceof Error ? err.message : "Failed to insert memory");
    }
  };

  const handleSearchMemories = async () => {
    if (!searchQuery) {
      setError("Please enter a search query");
      return;
    }

    if (!threadId) {
      setError("No thread ID available");
      return;
    }

    try {
      setError(null);
      setDebugInfo((prev) => ({
        ...prev,
        currentStep: "Searching for memories",
      }));

      // Search for memories by semantic similarity using server action
      const response = await getRelevantMemoriesAction({
        threadId,
        inputText: searchQuery,
        threshold: 0.5, // Lower threshold for testing
        limit: 10,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to search memories");
      }

      setSearchResults(response.data || []);
      setDebugInfo((prev) => ({
        ...prev,
        currentStep: "Memory search complete",
        searchResults: response.data || [],
      }));
    } catch (err) {
      console.error("Error searching memories:", err);
      setDebugInfo((prev) => ({
        ...prev,
        currentStep: "Error during memory search",
        error: err instanceof Error ? err.message : "Unknown error",
      }));
      setError(
        err instanceof Error ? err.message : "Failed to search memories"
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Memory Test</h1>

      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          This page lets you test inserting memory entries into the database.
        </p>

        <div className="space-y-4">
          <div>
            <p className="font-medium mb-1">Current Thread ID:</p>
            <code className="block p-2 bg-gray-100 rounded">
              {threadId || "No thread ID"}
            </code>
          </div>

          <div>
            <p className="font-medium mb-1">Test Message:</p>
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter a test message"
              />
              <Button onClick={handleInsertMemory}>Insert Memory</Button>
            </div>
          </div>

          <div>
            <p className="font-medium mb-1">Search Memories:</p>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter a search query"
              />
              <Button onClick={handleSearchMemories}>Search</Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md my-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md my-4">
          <p className="font-medium">Memory inserted successfully!</p>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
            {typeof result === "string"
              ? result
              : JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md my-4">
          <p className="font-medium">Search Results:</p>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-auto">
            {JSON.stringify(searchResults, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 border-t pt-4">
        <h2 className="text-xl font-semibold mb-3">Debug Information</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Thread Info:</h3>
            <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
              {debugInfo.thread
                ? JSON.stringify(debugInfo.thread, null, 2)
                : "No thread data"}
            </pre>
            {debugInfo.threadError && (
              <p className="text-red-600 text-sm mt-1">
                {debugInfo.threadError}
              </p>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-1">Profile Info:</h3>
            <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
              {debugInfo.profile
                ? JSON.stringify(debugInfo.profile, null, 2)
                : "No profile data"}
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-1">Memory Entries (last 5):</h3>
            <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
              {debugInfo.memory
                ? JSON.stringify(debugInfo.memory, null, 2)
                : "No memory entries"}
            </pre>
            {debugInfo.memoryError && (
              <p className="text-red-600 text-sm mt-1">
                {debugInfo.memoryError}
              </p>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-1">Current Action / Last Result:</h3>
            <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
              {debugInfo.currentStep ? `Step: ${debugInfo.currentStep}` : ""}
              {debugInfo.currentStep &&
              (debugInfo.memory || debugInfo.searchResults || debugInfo.error)
                ? "\n---\n"
                : ""}
              {debugInfo.memory && !debugInfo.searchResults
                ? `Memory Result: ${JSON.stringify(debugInfo.memory, null, 2)}`
                : ""}
              {debugInfo.searchResults
                ? `Search Results: ${JSON.stringify(
                    debugInfo.searchResults,
                    null,
                    2
                  )}`
                : ""}
              {debugInfo.error ? `Error: ${debugInfo.error}` : ""}
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-1">Full Debug State:</h3>
            <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
