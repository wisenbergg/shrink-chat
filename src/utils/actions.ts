// File: src/utils/actions.ts
"use server";

import { createServerClient } from "@/lib/supabaseClient/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const UID_COOKIE = "sw_uid";
const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/*──────────────── helper ────────────────*/
async function ensureRows(id: string) {
  const supabase = createServerClient();
  await supabase.from("users").upsert({ id }, { onConflict: "id" });
  await supabase.from("threads").upsert({ id }, { onConflict: "id" });
  await supabase
    .from("profiles")
    .upsert(
      { thread_id: id, onboarding_completed: false },
      { onConflict: "thread_id" }
    );
  // Note: Removed onboarding_progress upsert - using profiles.onboarding_completed instead
}

/*──────────────── getUserId ──────────────*/
export async function getUserId(): Promise<string> {
  // `cookies()` typing is flaky across Next versions – use proper interface
  const store = cookies() as {
    get?: (name: string) => { value: string } | undefined;
    set?: (name: string, value: string, options: typeof COOKIE_OPTS) => void;
  };
  let id = store.get?.(UID_COOKIE)?.value ?? null;

  if (!id) {
    id = uuidv4();
    store.set?.(UID_COOKIE, id, COOKIE_OPTS); // sets Set-Cookie header
    await ensureRows(id);
  }
  return id;
}

/*───────── onboarding helpers ─────────*/
// NOTE: These functions are deprecated in favor of the new thread-based system
// They remain for backward compatibility but are no longer used in the main flow

export async function updateOnboardingProgress(
  step: number,
  response?: string
): Promise<boolean> {
  console.warn(
    "updateOnboardingProgress is deprecated - use profiles.onboarding_completed instead"
  );
  // Suppress unused parameter warnings
  void step;
  void response;
  return true; // Always return true to avoid breaking existing code
}

export async function getOnboardingProgress() {
  console.warn(
    "getOnboardingProgress is deprecated - use profiles.onboarding_completed instead"
  );
  return null; // Return null to indicate no legacy progress
}

export async function completeOnboarding(): Promise<void> {
  console.warn(
    "completeOnboarding is deprecated - use markOnboardingComplete from sessionMemory instead"
  );
  // Don't redirect - let the new system handle it
}
