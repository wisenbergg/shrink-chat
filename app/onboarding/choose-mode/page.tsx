"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient/browser";
import "../onboarding-styles.css";

// Icons for the different modes
function ExploreIcon() {
  return (
    <svg
      className="w-6 h-6 mb-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg
      className="w-6 h-6 mb-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function CuriosityIcon() {
  return (
    <svg
      className="w-6 h-6 mb-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

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

export default function ChooseModePage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem("authenticated");
      if (!auth) {
        router.replace("/login");
      } else {
        try {
          console.log("Choose-mode page visited");
        } catch (error) {
          console.error("Error in onboarding choose-mode:", error);
        }
      }
    };

    checkAuth();
  }, [router, supabase]);

  const modes = [
    {
      id: "curious",
      title: "I'm poking around",
      description: "Just curious to see what this is",
      icon: <CuriosityIcon />,
      color:
        "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
    },
    {
      id: "explore",
      title: "Let's see where it goes",
      description: "Open to whatever comes up",
      icon: <ExploreIcon />,
      color:
        "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
    },
    {
      id: "support",
      title: "I'm going through it",
      description: "Looking for support and understanding",
      icon: <SupportIcon />,
      color:
        "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30",
    },
  ];

  return (
    <div className="onboarding-container">
      <ProgressIndicator currentStep={3} />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="onboarding-card p-12 w-full max-w-3xl">
          <div className="flex items-center justify-center flex-1 mb-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-medium gentle-fade-in text-foreground">
                Let&apos;s start in a way that feels right for you
              </h2>
              <p className="text-lg text-muted-foreground gentle-fade-in max-w-md mx-auto">
                There&apos;s no wrong choice here. Pick what resonates with
                where you are right now.
              </p>
            </div>
          </div>

          <div className="grid gap-4 max-w-lg mx-auto">
            {modes.map((mode, index) => (
              <Link
                key={mode.id}
                href="/onboarding/talk"
                className={`choice-button group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] ${
                  selectedMode === mode.id ? "ring-2 ring-primary" : ""
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setSelectedMode(mode.id)}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  <div className="flex items-start space-x-4">
                    <div className="text-primary group-hover:scale-110 transition-transform duration-300">
                      {mode.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-1 group-hover:text-primary transition-colors">
                        {mode.title}
                      </h3>
                      <p className="text-muted-foreground text-sm group-hover:text-primary/70 transition-colors">
                        {mode.description}
                      </p>
                    </div>
                    <div className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
