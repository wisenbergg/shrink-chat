// File: app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ShrinkChat from "@/components/ShrinkChat";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { SessionDebugger } from "@/components/SessionDebugger";
import StackedLogoLockup from "./components/StackedLogoLockup";
import { isValidAuthState, clearAuthState } from "@/lib/authUtils";

export default function HomePage() {
  const router = useRouter();
  const { profile, loading: onboardingLoading } = useOnboardingStatus();
  const [isAuth, setIsAuth] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);

  // 1) Check authentication
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if authentication state is valid
    if (!isValidAuthState()) {
      // Clear any stale/incomplete auth state
      clearAuthState();
      console.log("🔄 Redirecting to login - invalid auth state");
      router.replace("/login");
    } else {
      console.log("✅ Valid authentication state found");
      setIsAuth(true);
    }
  }, [router]);

  // 2) Check if onboarding is complete
  useEffect(() => {
    if (!onboardingLoading && isAuth && profile) {
      // If onboarding is not complete, redirect to the first step
      if (!profile.onboarding_completed) {
        router.replace("/onboarding/welcome");
      }
    }
  }, [onboardingLoading, isAuth, profile, router]);

  // Debug helper - press Alt+D to toggle debugger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+D to toggle session debugger
      if (e.altKey && e.key === "d") {
        setShowDebugger((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 3) Wait for onboarding guard to finish
  if (onboardingLoading) return null;

  // 4) Don't render until auth is confirmed
  if (!isAuth) return null;

  // 5) All checks passed — show the chat!
  return (
    <div className="relative flex flex-col h-screen">
      <div className="logo-position logo-container">
        <StackedLogoLockup />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ShrinkChat />
      </div>
      {showDebugger && <SessionDebugger />}
    </div>
  );
}
