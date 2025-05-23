"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabaseClient/browser";
import { useSession } from "@/context/SessionContext";

export default function TalkPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();
  const { threadId: sessionThreadId, setThreadId } = useSession();

  // Check authentication and record talk page visit
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = localStorage.getItem("authenticated");
        if (!auth) {
          // Create fallback authentication if not found
          localStorage.setItem("authenticated", "true");
          console.log("Created fallback authentication");
        }

        // Record talk visit in onboarding_progress
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          // If user exists, update onboarding progress
          if (user) {
            const { error } = await supabase.from("onboarding_progress").upsert(
              {
                user_id: user.id,
                current_step: 4,
                step4_completed_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );

            if (error)
              console.error("Error updating onboarding progress:", error);
          }
        } catch (error) {
          console.error("Error in onboarding talk:", error);
          // Continue even if there's an error
        }
      } catch (error) {
        console.error("Error in authentication check:", error);
        // Create fallback authentication
        localStorage.setItem("authenticated", "true");
      }
    };

    checkAuth();
  }, [router, supabase]);

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Get threadId from session context or create a new one
      const threadId = sessionThreadId || crypto.randomUUID();

      // Update the session context if needed
      if (!sessionThreadId) {
        setThreadId(threadId);
        console.log("Created and stored new threadId:", threadId);
      }

      // Try to update onboarding status via API
      try {
        const response = await fetch("/api/onboarding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            threadId,
            completeOnboarding: true,
          }),
        });

        if (!response.ok) {
          console.warn("Failed to complete onboarding via API, using fallback");
        }
      } catch (error) {
        console.warn("Error calling onboarding API:", error);
      }

      // Try to update Supabase directly as a fallback
      try {
        // First check if the user exists
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // If authenticated user exists, use their ID
          const { error } = await supabase.from("onboarding_progress").upsert(
            {
              user_id: user.id,
              completed: true,
              completed_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          if (error) {
            console.warn("Fallback update failed:", error);
          }
        } else {
          // If no authenticated user, use threadId as user_id
          const { error } = await supabase.from("onboarding_progress").upsert(
            {
              user_id: threadId,
              completed: true,
              completed_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          if (error) {
            console.warn("Fallback update with threadId failed:", error);
          }
        }
      } catch (err) {
        console.warn("Fallback update error:", err);
        // Continue despite the error
      }

      // No need to store in localStorage, the session context handles that
      // Add a delay to ensure the database update completes
      setTimeout(() => {
        // Redirect to root with threadId
        router.push(`/?threadId=${threadId}`);
      }, 1000);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Even if there's an error, redirect to root with a new threadId
      const threadId = sessionThreadId || crypto.randomUUID();
      if (!sessionThreadId) setThreadId(threadId);
      router.push(`/?threadId=${threadId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="space-y-4">
          <p className="text-2xl font-medium text-foreground text-center animate-fade-in">
            I&apos;m here to listen, no matter what&apos;s on your mind.
          </p>
          <div className="pt-6 flex justify-center">
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="inline-flex items-center justify-center w-32 h-10 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect"
            >
              {isLoading ? "..." : "Thanks"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
