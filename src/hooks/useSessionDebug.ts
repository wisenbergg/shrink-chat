"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/context/SessionContext";

/**
 * Hook for debugging session state and troubleshooting threadId issues.
 * This can be temporarily added to components for diagnosing session problems.
 */
export function useSessionDebug() {
  const { threadId: contextThreadId } = useSession();
  const [sessionData, setSessionData] = useState<{
    contextThreadId: string | null;
    localStorageThreadId: string | null;
    sessionStorageThreadId: string | null;
    cookieThreadId: string | null;
    urlThreadId: string | null;
    consistent: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const getCookieValue = (name: string): string | null => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? match[2] : null;
    };

    const getUrlThreadId = (): string | null => {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("threadId");
    };

    const localThreadId = localStorage.getItem("threadId");
    const sessionThreadId = sessionStorage.getItem("threadId");
    const cookieThreadId = getCookieValue("sw_uid");
    const urlThreadId = getUrlThreadId();

    // Check if all non-null values are consistent
    const threadIds = [
      contextThreadId,
      localThreadId,
      sessionThreadId,
      cookieThreadId,
    ].filter(Boolean);
    const isConsistent =
      threadIds.length === 0 || threadIds.every((id) => id === threadIds[0]);

    setSessionData({
      contextThreadId,
      localStorageThreadId: localThreadId,
      sessionStorageThreadId: sessionThreadId,
      cookieThreadId,
      urlThreadId,
      consistent: isConsistent,
    });
  }, [contextThreadId]);

  const logSessionState = () => {
    if (!sessionData) return;

    console.group("Session Debug Info");
    console.log("Context threadId:", sessionData.contextThreadId);
    console.log("localStorage threadId:", sessionData.localStorageThreadId);
    console.log("sessionStorage threadId:", sessionData.sessionStorageThreadId);
    console.log("Cookie threadId:", sessionData.cookieThreadId);
    console.log("URL threadId:", sessionData.urlThreadId);
    console.log("Consistent:", sessionData.consistent);
    console.groupEnd();

    return sessionData;
  };

  const syncAllStorage = (preferredId?: string) => {
    if (typeof window === "undefined") return;

    const {
      contextThreadId,
      localStorageThreadId,
      sessionStorageThreadId,
      cookieThreadId,
    } = sessionData || {};

    // Use preferred ID or find the first available one
    const id =
      preferredId ||
      contextThreadId ||
      localStorageThreadId ||
      sessionStorageThreadId ||
      cookieThreadId;

    if (!id) {
      console.error("No threadId available to sync");
      return false;
    }

    // Update all storage
    localStorage.setItem("threadId", id);
    sessionStorage.setItem("threadId", id);
    document.cookie = `sw_uid=${id}; path=/; SameSite=Lax`;

    // This will update the context threadId through useSession's reactivity
    console.log("Synchronized all storage with threadId:", id);
    return true;
  };

  return {
    sessionData,
    logSessionState,
    syncAllStorage,
  };
}
