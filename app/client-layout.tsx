"use client";

import { Suspense } from "react";
import { SessionProvider } from "@/context/SessionContext";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SessionProvider>{children}</SessionProvider>
    </Suspense>
  );
}
