#!/usr/bin/env node

/**
 * Test script to verify the onboarding flow in browser
 * This script simulates a user completing onboarding and verifies the intro sequence
 */

// Use built-in fetch (available in Node 18+)
const fetch = globalThis.fetch;

const BASE_URL = "http://127.0.0.1:3000";
const API_BASE = "http://127.0.0.1:3000/api";
const TEST_THREAD_ID = "0038d235-f0dd-4abf-a014-a3a6ffad7b76";

console.log("🧪 Testing Onboarding Flow Fix");
console.log("================================\n");

async function testOnboardingCompletion() {
  console.log("1. Creating test user profile with completed onboarding...");

  try {
    const response = await fetch(`${API_BASE}/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        threadId: TEST_THREAD_ID,
        name: "Test User",
        emotionalTone: ["curious", "hopeful"],
        concerns: ["stress", "anxiety"],
        completeOnboarding: true,
      }),
    });

    const result = await response.json();
    console.log("✅ Onboarding API response:", result);

    if (result.onboarding_complete) {
      console.log("✅ Onboarding marked as complete");
    } else {
      console.log("❌ Onboarding not marked as complete");
      return false;
    }
  } catch (error) {
    console.error("❌ Error calling onboarding API:", error);
    return false;
  }

  return true;
}

async function testProfileRetrieval() {
  console.log("\n2. Testing profile retrieval...");

  try {
    const response = await fetch(`${API_BASE}/profile/${TEST_THREAD_ID}`);
    const result = await response.json();

    console.log("✅ Profile API response:", JSON.stringify(result, null, 2));

    if (result.profile && result.profile.onboarding_completed) {
      console.log("✅ Profile shows onboarding completed");
      return true;
    } else {
      console.log("❌ Profile does not show onboarding completed");
      return false;
    }
  } catch (error) {
    console.error("❌ Error retrieving profile:", error);
    return false;
  }
}

async function testChatInitialization() {
  console.log("\n3. Testing what happens when ShrinkChat loads...");

  // This simulates what ShrinkChat.tsx would do when it loads
  console.log(`🔗 Expected URL: ${BASE_URL}/?threadId=${TEST_THREAD_ID}`);
  console.log("📋 Expected behavior:");
  console.log('   - localStorage should have "onboarding_complete" = "true"');
  console.log("   - User should see 5-message intro sequence");
  console.log("   - Should NOT be redirected back to welcome page");

  return true;
}

async function runTests() {
  console.log(`🎯 Test Thread ID: ${TEST_THREAD_ID}\n`);

  const step1 = await testOnboardingCompletion();
  if (!step1) return;

  const step2 = await testProfileRetrieval();
  if (!step2) return;

  await testChatInitialization();

  console.log("\n✅ All tests completed! Now check the browser:");
  console.log(`   Open: ${BASE_URL}/?threadId=${TEST_THREAD_ID}`);
  console.log("   Expected: 5-message intro sequence should appear");
}

runTests().catch(console.error);
