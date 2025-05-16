// File: src/hooks/useUserProfile.ts
import { useState, useEffect } from "react"

export type UserProfile = {
  thread_id?: string
  name?: string
  emotionalTone?: string[]
  concerns?: string[]
  onboarding_complete?: boolean
}

/**
 * Fetches the user profile (including onboarding_complete flag) for a threadId.
 */
export function useUserProfile(threadId: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!threadId) return
    setLoading(true)
    fetch(`/api/profile/${threadId}`)
      .then((res) => res.json())
      .then((json) => setProfile(json.profile))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [threadId])

  return { profile, loading }
}
