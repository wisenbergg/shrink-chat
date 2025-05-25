"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient/browser";

export default function ChooseModePage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem("authenticated");
      if (!auth) {
        router.replace("/login");
      } else {
        // Record choose-mode visit (simplified - just ensure profile exists)
        try {
          console.log("Choose-mode page visited");
        } catch (error) {
          console.error("Error in onboarding choose-mode:", error);
        }
      }
    };

    checkAuth();
  }, [router, supabase]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-2xl flex flex-col">
        <div className="flex items-center justify-center flex-1 mb-8">
          <h3 className="text-2xl font-medium text-center animate-fade-in text-foreground">
            Let&apos;s start in a way that feels right for you
          </h3>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/onboarding/talk"
            className="inline-flex items-center justify-center w-64 h-10 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect"
          >
            Let&apos;s see where it goes
          </Link>
          <Link
            href="/onboarding/talk"
            className="inline-flex items-center justify-center w-64 h-10 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect"
          >
            I&apos;m going through it
          </Link>
          <Link
            href="/onboarding/talk"
            className="inline-flex items-center justify-center w-64 h-10 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect"
          >
            I&apos;m poking around
          </Link>
        </div>
      </div>
    </div>
  );
}
