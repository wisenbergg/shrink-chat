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

export default function PrivacyPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem("authenticated");
      if (!auth) {
        router.replace("/login");
      } else {
        // Record privacy visit (simplified - just ensure profile exists)
        try {
          console.log("Privacy page visited");
        } catch (error) {
          console.error("Error in onboarding privacy:", error);
        }
      }
    };

    checkAuth();
  }, [router, supabase]);

  return (
    <div className="onboarding-container">
      <ProgressIndicator currentStep={2} />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="onboarding-card p-12 w-full max-w-2xl">
          <div className="flex items-center justify-center flex-1 mb-12">
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-medium text-center gentle-fade-in text-foreground">
                A safe space…
              </h2>
              <p className="text-lg text-muted-foreground gentle-fade-in max-w-lg mx-auto leading-relaxed">
                No names, no profile, no tracking - everything stays 100%
                confidential so you can feel comfortable being vulnerable.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Link
              href="/onboarding/choose-mode"
              className="onboarding-button inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary-hover transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-w-[180px]"
            >
              I understand
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
