"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabaseClient/browser";
import { useSession } from "@/context/SessionContext";
import { v4 as uuidv4 } from "uuid";

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
          // Create a fallback authentication if not found
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
              console.error(
                "Error updating onboarding progress:",
                JSON.stringify(error)
              );
          }
        } catch (error) {
          console.error(
            "Error in onboarding talk:",
            error instanceof Error ? error.message : JSON.stringify(error)
          );
          // Continue even if there's an error
        }
      } catch (error) {
        console.error(
          "Error in authentication check:",
          error instanceof Error ? error.message : JSON.stringify(error)
        );
        // Create fallback authentication
        localStorage.setItem("authenticated", "true");
      }
    };

    checkAuth();
  }, [supabase]);

  useEffect(() => {
    const createProfile = async () => {
      setIsLoading(true);
      try {
        // Get threadId from session context or create a new one
        const storedThreadId = sessionThreadId;
        let threadId = storedThreadId;

        if (!threadId) {
          const newThreadId = uuidv4();
          setThreadId(newThreadId);
          threadId = newThreadId;
          console.log("Created new threadId in loading:", newThreadId);
        }

        console.log("Attempting to create profile for threadId:", threadId);

        // Create user profile
        const { error } = await supabase.from("profiles").upsert(
          {
            thread_id: threadId,
            name: "Anonymous",
            emotional_tone: [],
            concerns: [],
          },
          { onConflict: "thread_id" }
        );

        if (error) {
          console.error("Error creating profile:", JSON.stringify(error));
          throw error;
        }

        console.log("Profile created successfully for threadId:", threadId);

        // Store onboarding completion in localStorage as a fallback
        localStorage.setItem("onboarding_complete", "true");
        localStorage.setItem("threadId", threadId);

        // Redirect to chat page
        router.push(`/?threadId=${threadId}`);
      } catch (error) {
        console.error(
          "Error in onboarding completion:",
          error instanceof Error ? error.message : JSON.stringify(error)
        );

        // If profile creation fails, create a new threadId and try again
        const threadId = sessionThreadId || uuidv4();
        if (!sessionThreadId) {
          setThreadId(threadId);
          console.log("Created fallback threadId:", threadId);
        }

        // Redirect to chat page anyway, the profile will be created later if needed
        localStorage.setItem("threadId", threadId);
        router.push(`/?threadId=${threadId}`);
      } finally {
        setIsLoading(false);
      }
    };

    createProfile();
  }, [router, sessionThreadId, setThreadId, supabase]);

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Get threadId from session context or create a new one
      const storedThreadId = sessionThreadId;
      let threadId = storedThreadId;

      if (!threadId) {
        const newThreadId = uuidv4();
        setThreadId(newThreadId);
        threadId = newThreadId;
        console.log("Created new threadId in handleComplete:", newThreadId);
      }

      // Call the onboarding API endpoint
      try {
        console.log("Calling onboarding API with threadId:", threadId);
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
          const errorData = await response.json().catch(() => ({}));
          console.warn(
            "Failed to complete onboarding via API, using fallback. Status:",
            response.status,
            "Error:",
            JSON.stringify(errorData)
          );
        } else {
          console.log("Successfully completed onboarding via API");
        }
      } catch (error) {
        console.warn(
          "Error calling onboarding API:",
          error instanceof Error ? error.message : JSON.stringify(error)
        );
      }

      // Try to update Supabase directly as a fallback
      try {
        console.log("Using fallback - updating onboarding_progress directly");
        const { error } = await supabase.from("onboarding_progress").upsert(
          {
            user_id: threadId, // Use threadId as user_id
            completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (error) {
          console.warn("Fallback update failed:", JSON.stringify(error));
        } else {
          console.log("Successfully updated onboarding_progress via fallback");
        }
      } catch (err) {
        console.warn(
          "Fallback update error:",
          err instanceof Error ? err.message : JSON.stringify(err)
        );
      }

      // Store onboarding completion in localStorage as a fallback
      localStorage.setItem("onboarding_complete", "true");
      localStorage.setItem("threadId", threadId);
      sessionStorage.setItem("threadId", threadId);

      // Add a delay to ensure the database update completes
      setTimeout(() => {
        // Redirect to root with threadId
        router.push(`/?threadId=${threadId}`);
      }, 1000);
    } catch (error) {
      console.error(
        "Error completing onboarding:",
        error instanceof Error ? error.message : JSON.stringify(error)
      );
      // Even if there's an error, redirect to root
      const threadId = sessionThreadId || crypto.randomUUID();
      localStorage.setItem("threadId", threadId);
      router.push(`/?threadId=${threadId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-2xl p-8">
        <div className="space-y-4">
          <p className="text-xl font-medium text-foreground text-center animate-fade-in font-playfair">
            I&apos;m here to listen, no matter what&apos;s on your mind.
          </p>
          <div className="pt-4 flex justify-center">
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect w-24 h-10"
            >
              {isLoading ? "..." : "Thanks"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
