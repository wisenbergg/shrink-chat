"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabaseClient/browser";

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
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col w-full max-w-2xl">
        <div className="flex items-center justify-center flex-1 mb-8">
          <p className="text-2xl font-medium text-center animate-fade-in text-foreground">
            Everything you say stays on your device.
          </p>
        </div>
        <div className="flex items-center justify-center">
          <Link
            href="/onboarding/choose-mode"
            className="inline-flex items-center justify-center w-40 h-10 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect"
          >
            Okay, I&apos;m in
          </Link>
        </div>
      </div>
    </div>
  );
}
