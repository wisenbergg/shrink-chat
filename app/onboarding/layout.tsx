"use client";

import React from "react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col w-full max-w-2xl p-8 font-apfel min-h-[28rem]">
        {children}
      </div>
    </div>
  );
}
