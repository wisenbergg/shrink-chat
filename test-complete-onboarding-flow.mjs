#!/usr/bin/env node

/**
 * Complete Onboarding Flow Test
 * Tests the full user journey: onboarding completion → chat → intro sequence
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteFlow() {
  console.log("🧪 Starting Complete Onboarding Flow Test");
  console.log("=".repeat(50));

  // Step 1: Clean up any existing test data
  console.log("\n1. Cleaning up existing test data...");
  try {
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .like("email", "test-flow-%");

    if (deleteError && !deleteError.message.includes("0 rows")) {
      console.log("   Note: No existing test data to clean");
    } else {
      console.log("   ✅ Test data cleaned");
    }
  } catch (error) {
    console.log("   Note: Cleanup completed");
  }

  // Step 2: Simulate onboarding completion via API
  console.log("\n2. Testing onboarding completion API...");
  const testEmail = `test-flow-${Date.now()}@example.com`;

  const onboardingData = {
    email: testEmail,
    name: "Test Flow User",
    age_range: "25-34",
    primary_concern: "Stress and Anxiety",
    therapy_experience: "never",
    communication_style: "direct",
    session_goals: "Better coping strategies",
    availability: "weekday_evenings",
  };

  const response = await fetch("http://localhost:3000/api/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(onboardingData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Onboarding API failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("   ✅ Onboarding completed via API");
  console.log(`   📧 Test user email: ${testEmail}`);
  console.log(`   🆔 Profile ID: ${result.profile?.id}`);

  // Step 3: Verify profile was created correctly
  console.log("\n3. Verifying profile creation...");
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", testEmail);

  if (profileError) {
    throw new Error(`Profile verification failed: ${profileError.message}`);
  }

  if (!profiles || profiles.length === 0) {
    throw new Error("Profile not found after onboarding completion");
  }

  const profile = profiles[0];
  console.log("   ✅ Profile found in database");
  console.log(`   📋 Onboarding completed: ${profile.onboarding_completed}`);
  console.log(`   📅 Created at: ${profile.created_at}`);

  if (!profile.onboarding_completed) {
    throw new Error("Profile onboarding_completed flag is false");
  }

  // Step 4: Test profile API endpoint
  console.log("\n4. Testing profile API endpoint...");
  const profileResponse = await fetch(
    `http://localhost:3000/api/profile?email=${encodeURIComponent(testEmail)}`
  );

  if (!profileResponse.ok) {
    throw new Error(`Profile API failed: ${profileResponse.status}`);
  }

  const profileData = await profileResponse.json();
  console.log("   ✅ Profile API working");
  console.log(
    `   📋 API shows onboarding completed: ${profileData.onboarding_completed}`
  );

  // Step 5: Simulate localStorage logic from ShrinkChat.tsx
  console.log("\n5. Simulating ShrinkChat localStorage logic...");

  // This simulates what happens in ShrinkChat.tsx when profile is loaded
  const shouldSetOnboardingComplete = profileData.onboarding_completed;
  console.log(
    `   📝 Would set localStorage "onboarding_complete": ${shouldSetOnboardingComplete}`
  );

  // These are the conditions for showing intro sequence
  const onboardingStep = "intro1"; // Default state
  const onboardingCompleteFlag = shouldSetOnboardingComplete; // From localStorage
  const introShownFlag = false; // Assuming first time for new user

  const shouldShowIntro =
    onboardingStep === "intro1" && onboardingCompleteFlag && !introShownFlag;
  console.log(`   🎯 Should show intro sequence: ${shouldShowIntro}`);

  if (shouldShowIntro) {
    console.log("   ✅ Logic indicates intro sequence should be shown");
  } else {
    console.log("   ❌ Logic indicates intro sequence would NOT be shown");
    console.log(
      `      - onboardingStep === "intro1": ${onboardingStep === "intro1"}`
    );
    console.log(`      - onboarding complete flag: ${onboardingCompleteFlag}`);
    console.log(`      - intro not shown yet: ${!introShownFlag}`);
  }

  // Step 6: Cleanup test data
  console.log("\n6. Cleaning up test data...");
  const { error: cleanupError } = await supabase
    .from("profiles")
    .delete()
    .eq("email", testEmail);

  if (cleanupError) {
    console.log(`   ⚠️  Cleanup warning: ${cleanupError.message}`);
  } else {
    console.log("   ✅ Test data cleaned up");
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 COMPLETE FLOW TEST SUMMARY");
  console.log("=".repeat(50));
  console.log("✅ Onboarding API: Working");
  console.log("✅ Profile Creation: Working");
  console.log("✅ Profile API: Working");
  console.log("✅ Database Storage: Working");
  console.log(
    `${shouldShowIntro ? "✅" : "❌"} Intro Logic: ${
      shouldShowIntro ? "Should work" : "Needs investigation"
    }`
  );

  if (shouldShowIntro) {
    console.log(
      "\n🎯 RESULT: The onboarding→intro flow should work correctly!"
    );
    console.log("📋 Next step: Test in browser to confirm");
  } else {
    console.log(
      "\n❌ RESULT: There may be an issue with the intro sequence logic"
    );
    console.log(
      "🔍 Need to investigate why intro sequence conditions are not met"
    );
  }
}

// Run the test
testCompleteFlow().catch((error) => {
  console.error("\n❌ Test failed:", error.message);
  process.exit(1);
});
