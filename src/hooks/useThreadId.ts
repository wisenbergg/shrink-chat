// File: src/hooks/useThreadId.ts
import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"

/**
 * Manages a per-session threadId in sessionStorage.
 */
export function useThreadId(): string | null {
  const [threadId, setThreadId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    let id = sessionStorage.getItem("threadId")
    if (!id) {
      id = uuidv4()
      sessionStorage.setItem("threadId", id)
    }
    setThreadId(id)
  }, [])

  return threadId
}
