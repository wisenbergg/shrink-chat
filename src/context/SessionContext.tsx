"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/sessionMemory";

type SessionContextType = {
  threadId: string | null;
  setThreadId: (id: string) => void;
  clearThreadId: () => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [threadId, setThreadIdState] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const urlThreadId = searchParams?.get("threadId");

  // Ensure both threads and profiles exist for a threadId
  const ensureThreadAndProfile = async (id: string) => {
    if (!id) return;

    try {
      // First ensure the thread exists
      const { error: threadError } = await supabase
        .from("threads")
        .upsert({ id }, { onConflict: "id" });

      if (threadError) {
        console.error(
          "Error ensuring thread exists (raw):",
          threadError,
          JSON.stringify(threadError)
        );
        return false;
      }

      // Then ensure the profile exists
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          thread_id: id,
          name: "Anonymous",
          emotional_tone: [],
          concerns: [],
        },
        { onConflict: "thread_id" }
      );

      if (profileError) {
        console.error("Error ensuring profile exists:", profileError);
        return false;
      } else {
        console.log("Thread and profile existence confirmed for:", id);
        return true;
      }
    } catch (error) {
      console.error("Error in ensureThreadAndProfile:", error);
      return false;
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return; // Skip on server

    // First check URL params (highest priority)
    if (urlThreadId) {
      console.log("Setting threadId from URL:", urlThreadId);
      persistThreadId(urlThreadId);
      setThreadIdState(urlThreadId);
      // Ensure profile exists for URL threadId
      ensureThreadAndProfile(urlThreadId);
      return;
    }

    // Then try to load from storage sources in order of preference
    const fromSession = sessionStorage.getItem("threadId");
    const fromLocal = localStorage.getItem("threadId");
    const fromCookie = getCookieValue("sw_uid");

    let id = fromSession || fromLocal || fromCookie;

    // If no ID found, generate a new one
    if (!id) {
      id = uuidv4();
      console.log("Generated new threadId:", id);
    } else {
      console.log("Loaded existing threadId:", id);
    }

    // Store and set the threadId
    persistThreadId(id);
    setThreadIdState(id);
    // Ensure profile exists
    ensureThreadAndProfile(id);
  }, [urlThreadId]);

  const persistThreadId = (id: string) => {
    // Store in multiple places for redundancy
    localStorage.setItem("threadId", id);
    sessionStorage.setItem("threadId", id);
    document.cookie = `sw_uid=${id}; path=/; SameSite=Lax`;
  };

  const getCookieValue = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? match[2] : null;
  };

  const setThreadId = (id: string) => {
    if (!id) return;

    setThreadIdState(id);
    if (typeof window !== "undefined") {
      persistThreadId(id);
      console.log(`ThreadId set and stored: ${id}`);

      // Ensure thread and profile exist in the database
      ensureThreadAndProfile(id);
    }
  };

  const clearThreadId = () => {
    setThreadIdState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("threadId");
      sessionStorage.removeItem("threadId");
      document.cookie =
        "sw_uid=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      console.log("ThreadId cleared from all storage");
    }
  };

  return (
    <SessionContext.Provider value={{ threadId, setThreadId, clearThreadId }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
};
