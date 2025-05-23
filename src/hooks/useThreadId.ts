"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/context/SessionContext";

/**
 * Manages threadId using SessionContext.
 * Prioritizes threadId from URL parameters if available.
 */
export function useThreadId(): string | null {
  const [threadId, setThreadIdState] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const urlThreadId = searchParams?.get("threadId");
  const { threadId: sessionThreadId, setThreadId } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // First check URL params (from onboarding)
    if (urlThreadId) {
      setThreadId(urlThreadId);
      setThreadIdState(urlThreadId);
      return;
    }

    // Then use SessionContext
    if (sessionThreadId) {
      setThreadIdState(sessionThreadId);
      return;
    }

    // Then check sessionStorage as a fallback
    let id = sessionStorage.getItem("threadId");

    // Generate new ID if none found
    if (!id) {
      id = uuidv4();
      sessionStorage.setItem("threadId", id);
      setThreadId(id);
    } else {
      // Sync with SessionContext
      setThreadId(id);
    }

    setThreadIdState(id);
  }, [urlThreadId, sessionThreadId, setThreadId]);

  return threadId;
}
