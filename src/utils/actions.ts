// File: src/utils/actions.ts
"use server";

import { createServerClient } from "./supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// 1) Initialize a new user, thread, profile & progress (no cookie write)
export async function initializeUser() {
  try {
    const supabase = createServerClient();
    const userId = uuidv4();
    const threadId = uuidv4();

    await supabase.from("users").insert({ id: userId });
    await supabase.from("threads").insert({ id: threadId });
    await supabase.from("profiles").insert({
      thread_id: threadId,
      onboarding_complete: false,
      name: null,
      concerns: [],
      emotional_tone: [],
    });
    await supabase.from("onboarding_progress").insert({
      user_id: userId,
      current_step: 1,
    });

    return { userId, threadId };
  } catch (err) {
    console.error("initializeUser error:", err);
    return null;
  }
}

// 2) Get or create userId/threadId (no cookie)
export async function getUserId() {
  // Just always generate fresh for server logic; client tracks via sessionStorage
  const result = await initializeUser();
  return result?.userId ?? null;
}

// 3) Advance the onboarding step (and save an optional response)
export async function updateOnboardingProgress(
  step: number,
  response?: string
): Promise<boolean> {
  try {
    const userId = await getUserId();
    if (!userId) throw new Error("Missing userId");

    const supabase = createServerClient();
    await supabase
      .from("onboarding_progress")
      .update({
        current_step: step + 1,
        [`step${step}_completed_at`]: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (response) {
      await supabase.from("onboarding_responses").insert({
        user_id: userId,
        step_number: step,
        response,
      });
    }

    revalidatePath("/onboarding/welcome");
    revalidatePath("/onboarding/privacy");
    revalidatePath("/onboarding/choose-mode");

    return true;
  } catch (err) {
    console.error("updateOnboardingProgress error:", err);
    return false;
  }
}

// 4) Fetch current onboarding progress
export async function getOnboardingProgress(): Promise<any> {
  try {
    const userId = await getUserId();
    if (!userId) return null;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("onboarding_progress")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("getOnboardingProgress error:", err);
    return null;
  }
}

// 5) Finalize onboarding & redirect to the chat home
export async function completeOnboarding(): Promise<void> {
  const ok = await updateOnboardingProgress(3);
  if (ok) redirect("/");
}
