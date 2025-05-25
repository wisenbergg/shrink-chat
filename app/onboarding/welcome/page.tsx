"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient/browser";
import { useSession } from "@/context/SessionContext";
import { v4 as uuidv4 } from "uuid";
import "../onboarding-styles.css";

// Progress indicator component
function ProgressIndicator({ currentStep }: { currentStep: number }) {
  const steps = 5; // welcome, overview, privacy, choose-mode, talk

  return (
    <div className="onboarding-progress">
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          className={`progress-dot ${
            i < currentStep ? "completed" : i === currentStep ? "active" : ""
          }`}
        />
      ))}
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const { threadId: sessionThreadId, setThreadId } = useSession();

  // Check authentication and initialize threadId if needed
  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem("authenticated");
      if (!auth) {
        router.replace("/login");
      } else {
        // Initialize threadId if not already set
        if (!sessionThreadId) {
          const newThreadId = uuidv4();
          setThreadId(newThreadId);
          console.log("Initialized new threadId:", newThreadId);
        }

        // Record welcome visit (simplified - just ensure profile exists)
        try {
          // The SessionContext already ensures profile exists, so no additional tracking needed
          console.log(
            "Welcome page visited for thread:",
            sessionThreadId || "new thread"
          );
        } catch (error) {
          console.error("Error in onboarding welcome:", error);
        }
      }
    };

    checkAuth();
  }, [router, supabase, sessionThreadId, setThreadId]);

  return (
    <div className="onboarding-container">
      <ProgressIndicator currentStep={0} />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="onboarding-card p-12 w-full max-w-2xl">
          <div className="flex items-center justify-center flex-1 mb-12">
            {/* Enhanced welcome message with breathing animation */}
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-medium breathing-text text-foreground">
                Hey, I&apos;m really happy you&apos;re here.
              </h2>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Link
              href="/onboarding/overview"
              className="onboarding-button inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary-hover transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-w-[140px]"
            >
              Continue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
