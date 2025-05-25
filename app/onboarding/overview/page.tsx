"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient/browser";
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

export default function OverviewPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem("authenticated");
      if (!auth) {
        router.replace("/login");
      } else {
        try {
          console.log("Overview page visited");
        } catch (error) {
          console.error("Error in onboarding overview:", error);
        }
      }
    };

    checkAuth();
  }, [router, supabase]);

  return (
    <div className="onboarding-container">
      <ProgressIndicator currentStep={1} />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="onboarding-card p-12 w-full max-w-2xl">
          <div className="flex items-center justify-center flex-1 mb-12">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-medium text-center gentle-fade-in text-foreground">
                This space is just for you…
              </h2>
              <p className="text-lg text-muted-foreground gentle-fade-in max-w-lg mx-auto leading-relaxed">
                Share what you&apos;re feeling, without pressure or judgment.
                I&apos;m here to listen, no matter what&apos;s on your mind.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Link
              href="/onboarding/privacy"
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
