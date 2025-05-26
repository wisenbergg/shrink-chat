/**
 * Debug script to check what's happening in the browser localStorage
 */

// Check the localStorage and debug the ShrinkChat flow
console.log("=== ShrinkChat Debug Information ===");

// Check localStorage
const onboardingComplete = localStorage.getItem("onboarding_complete");
const appVersion = localStorage.getItem("app_version");
const threadId =
  new URLSearchParams(window.location.search).get("threadId") ||
  sessionStorage.getItem("threadId");

console.log("localStorage flags:");
console.log("  onboarding_complete:", onboardingComplete);
console.log("  app_version:", appVersion);
console.log("  threadId from URL/session:", threadId);

if (threadId) {
  const introShownKey = `intro_shown_${threadId}`;
  const hasIntroBeenShown = localStorage.getItem(introShownKey);
  console.log(`  intro_shown_${threadId}:`, hasIntroBeenShown);
}

// Check if we can access the profile via API
if (threadId) {
  fetch(`/api/profile/${threadId}`)
    .then((response) => response.json())
    .then((data) => {
      console.log("Profile API response:", data);
      if (data.profile) {
        console.log(
          "Profile onboarding_completed:",
          data.profile.onboarding_completed
        );
      }
    })
    .catch((error) => {
      console.error("Error fetching profile:", error);
    });
}

// Monitor for ShrinkChat component debug logs
console.log("=== End Debug Info ===");
