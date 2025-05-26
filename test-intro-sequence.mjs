#!/usr/bin/env node

/**
 * Test to verify the exact ShrinkChat.tsx logic by setting up the right conditions
 */

console.log("🧪 Testing ShrinkChat Logic Conditions");
console.log("====================================\n");

console.log("The ShrinkChat.tsx logic for new users requires:");
console.log('1. onboardingStep === "intro1" (default initial state)');
console.log('2. localStorage.getItem("onboarding_complete") === "true"');
console.log('3. localStorage.getItem(`intro_shown_${threadId}`) !== "true"');
console.log("");

console.log("Test scenario:");
console.log("1. Complete onboarding via API to create profile");
console.log("2. Open browser with threadId param");
console.log("3. ShrinkChat should:");
console.log("   - Load user profile");
console.log('   - Set localStorage "onboarding_complete" = "true"');
console.log("   - Check conditions and show intro sequence");
console.log("");

const TEST_THREAD_ID = "test-new-intro-" + Date.now();
console.log(`🎯 Test Thread ID: ${TEST_THREAD_ID}`);

// Simulate the onboarding completion
async function simulateOnboardingCompletion() {
  console.log("\n1. Simulating onboarding completion...");

  try {
    const response = await fetch("http://127.0.0.1:3000/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: TEST_THREAD_ID,
        name: "New Test User",
        emotionalTone: ["excited"],
        concerns: ["general"],
        completeOnboarding: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Onboarding completed:", result);

    // Verify profile exists
    const profileResponse = await fetch(
      `http://127.0.0.1:3000/api/profile/${TEST_THREAD_ID}`
    );
    const profileData = await profileResponse.json();

    if (profileData.profile && profileData.profile.onboarding_completed) {
      console.log("✅ Profile created with onboarding_completed: true");
      return true;
    } else {
      console.log("❌ Profile not created correctly");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error);
    return false;
  }
}

async function runTest() {
  const success = await simulateOnboardingCompletion();

  if (success) {
    console.log("\n🎯 Manual Test Instructions:");
    console.log("============================");
    console.log(`1. Open: http://127.0.0.1:3000/?threadId=${TEST_THREAD_ID}`);
    console.log("2. Open browser dev tools and check console for:");
    console.log('   - "=== MAIN USER FLOW LOGIC ===" debug messages');
    console.log('   - "🎯 NEW USER: Starting intro sequence!" message');
    console.log("3. You should see the 5-message intro sequence appear");
    console.log("4. Messages should be:");
    console.log('   - "Before we get started I just want you to know…"');
    console.log(
      '   - "Your thoughts, feelings, experiences, words, and emotions are all valid..."'
    );
    console.log('   - "I am not here to fix, I am here to listen."');
    console.log('   - "Sometimes, that\'s really all you need."');
    console.log(
      '   - "With that said, I\'m ready when you are. Anything specific on your mind?"'
    );
  }
}

// Use built-in fetch (available in Node 18+)
const fetch = globalThis.fetch;

runTest().catch(console.error);
