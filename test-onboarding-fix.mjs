#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOnboardingCompletion() {
  try {
    console.log("=== Testing Onboarding Completion Fix ===");

    // First, create a test login to get a threadId
    console.log("\n1. Creating test login...");
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "stillwater" }),
    });

    if (!response.ok) {
      throw new Error(
        `Login failed: ${response.status} ${await response.text()}`
      );
    }

    const { threadId } = await response.json();
    console.log("✅ Got threadId:", threadId);

    // 2. Test the onboarding API endpoint
    console.log("\n2. Testing onboarding completion API...");
    const onboardingResponse = await fetch(
      "http://localhost:3000/api/onboarding",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          completeOnboarding: true,
        }),
      }
    );

    if (onboardingResponse.ok) {
      const result = await onboardingResponse.json();
      console.log("✅ Onboarding API success:", result);
    } else {
      console.log("❌ Onboarding API failed:", await onboardingResponse.text());
    }

    // 3. Check if the profile was updated correctly
    console.log("\n3. Checking profile update...");
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("thread_id", threadId)
      .single();

    if (error) {
      console.log("❌ Profile query failed:", error);
    } else {
      console.log("✅ Profile found:", {
        thread_id: profile.thread_id,
        onboarding_completed: profile.onboarding_completed,
        name: profile.name,
      });
    }

    // 4. Test the direct Supabase update (like the fallback code)
    console.log("\n4. Testing direct profile update...");
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("thread_id", threadId);

    if (updateError) {
      console.log("❌ Direct update failed:", updateError);
    } else {
      console.log("✅ Direct update succeeded");
    }

    // 5. Cleanup - delete the test data
    console.log("\n5. Cleaning up test data...");
    await supabase.from("profiles").delete().eq("thread_id", threadId);
    await supabase.from("threads").delete().eq("id", threadId);
    console.log("✅ Cleanup complete");

    console.log("\n=== Test Complete ===");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testOnboardingCompletion().catch(console.error);
