// File: src/app/onboarding/choose-mode/page.tsx
"use client";

import Link from "next/link";

export default function ChooseModePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-2xl p-8 flex flex-col h-[24rem]">
        <div className="flex-1 flex items-center justify-center">
          <h3 className="text-xl font-medium text-gray-900 text-center animate-fade-in font-freight">
            Let’s start in a way that feels right for you
          </h3>
        </div>
        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/onboarding/talk"
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect w-64 h-10"
          >
            💬 I just want to talk
          </Link>
          <Link
            href="/onboarding/talk"
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect w-64 h-10"
          >
            🧠 I need to sort through some feelings
          </Link>
          <Link
            href="/onboarding/talk"
            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 btn-hover-effect w-64 h-10"
          >
            👀 I’m just checking this out
          </Link>
        </div>
      </div>
    </div>
  );
}
