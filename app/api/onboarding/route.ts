import { NextRequest, NextResponse } from "next/server";
import {
  updateUserProfile,
  markOnboardingComplete,
  ensureProfileExists,
} from "@/lib/sessionMemory";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const body = await request.json();
  let { threadId } = body;
  const name = body.name;
  const emotionalTone = body.emotionalTone ?? [];
  const concerns = body.concerns ?? [];
  const completeOnboarding = body.completeOnboarding ?? false;

  // If no threadId is provided, generate a new one and create a profile
  if (!threadId) {
    threadId = uuidv4();
    // Insert into threads table before creating profile
    const { error: threadError } = await (
      await import("@/lib/sessionMemory")
    ).supabase
      .from("threads")
      .insert({ id: threadId });
    if (threadError) {
      return NextResponse.json(
        { message: "Failed to create thread", details: threadError.message },
        { status: 500 }
      );
    }
    await ensureProfileExists(threadId);
  }

  try {
    await updateUserProfile(threadId, {
      name: name?.trim(),
      emotional_tone: emotionalTone, // Changed from camelCase to snake_case
      concerns,
    });

    if (completeOnboarding) {
      await markOnboardingComplete(threadId);
    }

    return NextResponse.json({
      message: "Profile updated",
      threadId, // Always return the threadId
      onboarding_complete: completeOnboarding,
    });
  } catch (error) {
    console.error("[onboarding] error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
