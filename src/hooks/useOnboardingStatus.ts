"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useThreadId } from "./useThreadId";
import { useUserProfile } from "./useUserProfile";

/**
 * Guards your app so that:
 * - If no profile or onboarding not complete → redirect to /onboarding/welcome
 * - If profile exists and onboarding_complete → allow access to protected routes
 *
 * IMPORTANT: This hook no longer automatically redirects to home (/)
 */
export function useOnboardingStatus() {
  const router = useRouter();
  const pathname = usePathname();
  const threadId = useThreadId();
  const { profile, loading } = useUserProfile(threadId);

  useEffect(() => {
    // Skip if still loading or no threadId
    if (loading || !threadId) return;

    // Check localStorage first (fallback)
    const localOnboardingComplete =
      localStorage.getItem("onboarding_complete") === "true";

    // Only redirect if not already on an onboarding page
    const isOnOnboardingPage = pathname?.startsWith("/onboarding");

    // If onboarding is not complete and we're not already on an onboarding page, redirect
    if (
      !isOnOnboardingPage &&
      !profile?.onboarding_complete &&
      !localOnboardingComplete
    ) {
      router.replace("/onboarding/welcome");
    }

    // We no longer redirect to home if onboarding is complete
    // This prevents the redirect loop
  }, [threadId, profile, loading, router, pathname]);

  return { profile, loading };
}
