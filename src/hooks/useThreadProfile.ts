"use client";
import { ensureProfileExists } from "@/lib/sessionMemory";
import { useSession } from "@/context/SessionContext";
import { supabase } from "@/lib/sessionMemory";
import { useEffect, useState } from "react";

/**
 * A hook that ensures a profile exists for the current thread ID.
 * This should be used in key components like ShrinkChat to prevent
 * "No associated user found" errors.
 */
export function useThreadProfile() {
  const { threadId } = useSession();
  const [isEnsuring, setIsEnsuring] = useState(false);
  const [ensured, setEnsured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (!threadId || ensured || isEnsuring) return;

    async function ensureProfile() {
      if (retryCount >= MAX_RETRIES) {
        setError(`Failed after ${MAX_RETRIES} attempts`);
        return;
      }

      try {
        setIsEnsuring(true);

        // First ensure the thread exists in threads table
        const { error: threadError } = await supabase
          .from("threads")
          .upsert({ id: threadId }, { onConflict: "id" });

        if (threadError) {
          console.error(
            "Error ensuring thread exists (raw):",
            threadError,
            JSON.stringify(threadError)
          );
          setError("Failed to create thread record");
          setRetryCount((prev) => prev + 1);
          return;
        }

        // Then ensure the profile exists
        if (!threadId) {
          console.error("ThreadId is null, cannot ensure profile");
          setError("No thread ID available");
          setRetryCount((prev) => prev + 1);
          setIsEnsuring(false);
          return;
        }

        const success = await ensureProfileExists(threadId);

        if (!success) {
          console.error("Failed to ensure profile exists, retrying...");
          setError("Failed to ensure profile exists");
          setRetryCount((prev) => prev + 1);
          setIsEnsuring(false);
          return;
        }

        // Success - we've ensured both thread and profile exist
        setEnsured(true);
        setError(null);
      } catch (err) {
        console.error("Error in useThreadProfile:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setRetryCount((prev) => prev + 1);
      } finally {
        setIsEnsuring(false);
      }
    }

    ensureProfile();
  }, [threadId, ensured, isEnsuring, retryCount]);

  return { ensured, isEnsuring, error, retryCount };
}
