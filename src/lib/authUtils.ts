// src/lib/authUtils.ts - Authentication utility functions

export function clearAuthState(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("authenticated");
    localStorage.removeItem("threadId");
    console.log("🔓 Authentication state cleared");
  }
}

export function getAuthState(): {
  isAuthenticated: boolean;
  threadId: string | null;
} {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, threadId: null };
  }

  const auth = localStorage.getItem("authenticated");
  const threadId = localStorage.getItem("threadId");

  return {
    isAuthenticated: auth === "true",
    threadId: threadId,
  };
}

export function setAuthState(threadId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("authenticated", "true");
    localStorage.setItem("threadId", threadId);
    console.log("🔐 Authentication state set with threadId:", threadId);
  }
}

export function isValidAuthState(): boolean {
  const { isAuthenticated, threadId } = getAuthState();
  return isAuthenticated && !!threadId;
}
