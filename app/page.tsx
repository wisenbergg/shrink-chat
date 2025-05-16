// File: src/app/page.tsx
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ShrinkChat from "@/components/ShrinkChat";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

export default function HomePage() {
  const router = useRouter();
  const { profile, loading: onboardingLoading } = useOnboardingStatus();
  const [isAuth, setIsAuth] = useState(false);

  // 1) Check authentication
  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = localStorage.getItem("authenticated");
    if (!auth) {
      router.replace("/login");
    } else {
      setIsAuth(true);
    }
  }, [router]);

  // 2) Wait for onboarding guard to finish
  if (onboardingLoading) return null;

  // 3) Don’t render until auth is confirmed
  if (!isAuth) return null;

  // 4) All checks passed — show the chat!
  return (
    <div className="flex flex-col h-screen relative">
      <div className="absolute top-4 left-4">
        <Image src="/logo.svg" alt="Logo" width={64} height={64} />
      </div>
      <div className="flex-1 flex overflow-hidden">
        <ShrinkChat />
      </div>
    </div>
  );
}
