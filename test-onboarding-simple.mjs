#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOnboardingFix() {
  try {
    console.log("=== Testing Onboarding Database Fix ===");

    // Create a test threadId using proper UUID format
    const threadId = randomUUID();
    console.log("Test threadId:", threadId);

    // 1. Create thread and profile (simulate login)
    console.log("\n1. Creating thread and profile...");
    const { error: threadError } = await supabase
      .from("threads")
      .insert({ id: threadId });

    if (threadError) {
      console.log("❌ Thread creation failed:", threadError);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      thread_id: threadId,
      onboarding_completed: false,
    });

    if (profileError) {
      console.log("❌ Profile creation failed:", profileError);
      return;
    }

    console.log("✅ Thread and profile created successfully");

    // 2. Test onboarding completion (like the talk page does)
    console.log("\n2. Testing onboarding completion...");
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("thread_id", threadId);

    if (updateError) {
      console.log("❌ Onboarding completion failed:", updateError);
      return;
    }

    console.log("✅ Onboarding completion successful");

    // 3. Verify the profile was updated correctly
    console.log("\n3. Verifying profile update...");
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("thread_id", threadId)
      .single();

    if (fetchError) {
      console.log("❌ Profile fetch failed:", fetchError);
      return;
    }

    if (profile.onboarding_completed) {
      console.log("✅ Profile correctly shows onboarding_completed: true");
    } else {
      console.log("❌ Profile still shows onboarding_completed: false");
      return;
    }

    // 4. Clean up test data
    console.log("\n4. Cleaning up test data...");
    await supabase.from("profiles").delete().eq("thread_id", threadId);
    await supabase.from("threads").delete().eq("id", threadId);

    console.log("✅ All tests passed! The onboarding fix works correctly.");
    console.log("\n🎉 The issues should be resolved:");
    console.log("  • No more 400 Bad Request errors");
    console.log("  • No more 'completed' column not found errors");
    console.log(
      "  • Onboarding completion uses the correct profiles.onboarding_completed field"
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testOnboardingFix().catch(console.error);
