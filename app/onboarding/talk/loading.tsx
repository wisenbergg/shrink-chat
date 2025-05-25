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

  // Initialize authentication on page load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const auth = localStorage.getItem("authenticated");
        if (!auth) {
          localStorage.setItem("authenticated", "true");
          console.log("Initialized authentication for onboarding");
        }

        // Ensure we have a threadId for the onboarding process
        if (!sessionThreadId) {
          const newThreadId = uuidv4();
          setThreadId(newThreadId);
          console.log("Initialized threadId for onboarding:", newThreadId);
        }

        console.log("Talk loading page ready");
      } catch (error) {
        console.error("Error initializing onboarding:", error);
        // Ensure authentication is set even if there's an error
        localStorage.setItem("authenticated", "true");
      }
    };

    initializeAuth();
  }, [sessionThreadId, setThreadId]);

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Ensure we have a threadId
      let threadId = sessionThreadId;
      if (!threadId) {
        threadId = uuidv4();
        setThreadId(threadId);
        console.log("Created new threadId for completion:", threadId);
      }

      console.log("Completing onboarding for threadId:", threadId);

      // Create or update the user profile
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          thread_id: threadId,
          name: "Anonymous",
          emotional_tone: [],
          concerns: [],
          onboarding_completed: true, // Mark onboarding as complete
        },
        { onConflict: "thread_id" }
      );

      if (profileError) {
        console.warn("Profile upsert failed:", JSON.stringify(profileError));
        // Continue anyway - we'll try the API fallback
      } else {
        console.log(
          "Profile created/updated successfully with onboarding completed"
        );
      }

      // Try the onboarding API as a fallback/additional step
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

        if (response.ok) {
          console.log("Onboarding API call successful");
        } else {
          console.warn("Onboarding API failed with status:", response.status);
        }
      } catch (apiError) {
        console.warn("Onboarding API error:", apiError);
        // This is OK - we already updated the profile directly
      }

      // Store completion status in localStorage for immediate feedback
      localStorage.setItem("onboarding_complete", "true");
      localStorage.setItem("threadId", threadId);

      // Navigate to the main chat interface
      console.log("Redirecting to chat with threadId:", threadId);
      router.push(`/?threadId=${threadId}`);
    } catch (error) {
      console.error("Error completing onboarding:", error);

      // Even if there's an error, try to proceed with a fallback
      const fallbackThreadId = sessionThreadId || crypto.randomUUID();
      localStorage.setItem("threadId", fallbackThreadId);
      localStorage.setItem("onboarding_complete", "true");

      console.log("Using fallback redirect with threadId:", fallbackThreadId);
      router.push(`/?threadId=${fallbackThreadId}`);
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
