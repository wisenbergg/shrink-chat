// File: src/hooks/useOnboardingStatus.ts
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useThreadId } from "./useThreadId"
import { useUserProfile } from "./useUserProfile"

/**
 * Guards your app so that:
 * - If no profile or onboarding not complete → redirect to /onboarding/welcome
 * - If profile exists and onboarding_complete → redirect to home (/)
 */
export function useOnboardingStatus() {
  const router = useRouter()
  const threadId = useThreadId()
  const { profile, loading } = useUserProfile(threadId)

  useEffect(() => {
    if (loading || !threadId) return

    if (!profile || !profile.onboarding_complete) {
      router.replace("/onboarding/welcome")
    } else {
      router.replace("/")
    }
  }, [threadId, profile, loading, router])

  return { threadId, profile, loading }
}
