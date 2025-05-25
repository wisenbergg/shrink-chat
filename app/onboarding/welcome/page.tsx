"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient/browser";
import { useSession } from "@/context/SessionContext";
import { v4 as uuidv4 } from "uuid";

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
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col w-full max-w-2xl">
        <div className="flex items-center justify-center flex-1 mb-8">
          <h2 className="text-2xl font-medium text-center animate-fade-in text-foreground">
            Hey. I&apos;m really glad you&apos;re here.
          </h2>
        </div>
        <div className="flex items-center justify-center">
          <Link
            href="/onboarding/privacy"
            className="inline-flex items-center justify-center w-32 h-10 px-6 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect"
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
