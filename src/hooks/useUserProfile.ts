"use client";

import { useState, useEffect } from "react";

export type UserProfile = {
  thread_id?: string;
  name?: string;
  emotional_tone?: string[];
  concerns?: string[];
  onboarding_completed?: boolean;
};

/**
 * Fetches the user profile (including onboarding_completed flag) for a threadId.
 * Includes localStorage fallback for onboarding status.
 */
export function useUserProfile(threadId: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchedOnce, setFetchedOnce] = useState(false);

  useEffect(() => {
    if (!threadId) {
      setLoading(false);
      return;
    }

    // Check localStorage first for onboarding status
    const localOnboardingComplete =
      localStorage.getItem("onboarding_complete") === "true";

    // If we have a local flag, use it to create an initial profile
    if (localOnboardingComplete && !profile) {
      setProfile({
        thread_id: threadId,
        onboarding_completed: true,
      });
    }

    // Only fetch from API if we haven't already fetched
    if (!fetchedOnce) {
      setLoading(true);
      fetch(`/api/profile/${threadId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(
              `Failed to fetch profile: ${res.status} ${res.statusText}`
            );
          }
          return res.json();
        })
        .then((json) => {
          // Update profile from API
          if (json.profile) {
            setProfile(json.profile);

            // If API says onboarding is complete, update localStorage
            if (json.profile?.onboarding_completed) {
              localStorage.setItem("onboarding_complete", "true");
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);

          // If API fails but we have local flag, ensure profile has onboarding_completed
          if (
            localOnboardingComplete &&
            profile &&
            !profile.onboarding_completed
          ) {
            setProfile((prev) => ({
              ...prev,
              thread_id: threadId,
              onboarding_completed: true,
            }));
          }
        })
        .finally(() => {
          setLoading(false);
          setFetchedOnce(true);
        });
    }
  }, [threadId, fetchedOnce, profile]);

  return { profile, loading };
}
