"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { fixThreadIdIssues } from "@/lib/fixThreadIds";
import { useSession } from "@/context/SessionContext";

/**
 * A utility component that can be added to admin pages to check for and fix
 * thread ID issues directly from the UI.
 */
export function ThreadIdFixer() {
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<{
    threadsCreated: number;
    profilesCreated: number;
    errorsFixed: number;
    errors: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { threadId } = useSession();

  const handleFix = async () => {
    try {
      setIsFixing(true);
      setError(null);

      const fixResults = await fixThreadIdIssues();
      setResults(fixResults);

      // If the current thread ID needs attention, ensure it's fixed
      if (threadId) {
        await ensureCurrentThreadIsFixed(threadId);
      }
    } catch (err) {
      console.error("Error fixing thread IDs:", err);
      setError(
        err instanceof Error ? err.message : "Unknown error fixing thread IDs"
      );
    } finally {
      setIsFixing(false);
    }
  };

  // Make sure the current session's thread ID is properly set up
  const ensureCurrentThreadIsFixed = async (id: string) => {
    try {
      // Use the supabase client directly to ensure thread and profile exist
      const { supabase } = await import("@/lib/sessionMemory");

      // First ensure thread exists
      await supabase.from("threads").upsert({ id }, { onConflict: "id" });

      // Then ensure profile exists
      await supabase.from("profiles").upsert(
        {
          thread_id: id,
          name: "Anonymous",
          emotional_tone: [],
          concerns: [],
        },
        { onConflict: "thread_id" }
      );
    } catch (err) {
      console.error("Error ensuring current thread:", err);
    }
  };

  return (
    <div className="border p-4 rounded-md bg-gray-50 my-4">
      <h3 className="text-lg font-medium mb-2">Thread ID Fixer Utility</h3>
      <p className="text-sm text-gray-600 mb-3">
        This utility will scan the database for thread ID inconsistencies and
        fix them. Use this if you see &quot;No associated user found&quot;
        errors.
      </p>

      <Button onClick={handleFix} disabled={isFixing} variant="default">
        {isFixing ? "Fixing..." : "Fix Thread ID Issues"}
      </Button>

      {error && (
        <div className="mt-3 p-2 bg-red-100 text-red-800 rounded-md text-sm">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-3 p-2 bg-green-100 text-green-800 rounded-md text-sm">
          <p>✅ Fix completed!</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Threads created: {results.threadsCreated}</li>
            <li>Profiles created: {results.profilesCreated}</li>
            <li>Errors fixed: {results.errorsFixed}</li>
            <li>Errors encountered: {results.errors}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
