/**
 * Comprehensive test for time context integration
 * Tests the complete flow from time utilities to AI response
 */

import { getTimeContext } from "./src/lib/timeUtils.js";

// Test time context generation
console.log("🕐 Testing Time Context Generation...");
const timeContext = getTimeContext();

console.log("📅 Time Context Results:");
console.log(`  User Time: ${timeContext.userTime}`);
console.log(`  Timezone: ${timeContext.userTimezone}`);
console.log(`  Time of Day: ${timeContext.timeOfDay}`);
console.log(`  Local DateTime: ${timeContext.localDateTime}`);

// Validate the time context structure
const requiredFields = [
  "userTime",
  "userTimezone",
  "timeOfDay",
  "localDateTime",
];
const missingFields = requiredFields.filter((field) => !timeContext[field]);

if (missingFields.length > 0) {
  console.log("❌ Missing required fields:", missingFields);
  process.exit(1);
}

console.log("✅ Time context structure is valid");

// Test time of day classification
const hour = new Date().getHours();
let expectedTimeOfDay;

if (hour >= 5 && hour < 12) {
  expectedTimeOfDay = "morning";
} else if (hour >= 12 && hour < 17) {
  expectedTimeOfDay = "afternoon";
} else if (hour >= 17 && hour < 22) {
  expectedTimeOfDay = "evening";
} else {
  expectedTimeOfDay = "night";
}

if (timeContext.timeOfDay === expectedTimeOfDay) {
  console.log("✅ Time of day classification is correct");
} else {
  console.log(
    `❌ Time of day mismatch. Expected: ${expectedTimeOfDay}, Got: ${timeContext.timeOfDay}`
  );
  process.exit(1);
}

// Test enhanced context format for API
const enhancedContext = {
  userName: "Test User",
  userEmotions: ["curious"],
  conversationTopics: ["time-awareness"],
  userPreferences: {},
  conversationLength: 1,
  isReturningUser: true,
  userTime: timeContext.userTime,
  userTimezone: timeContext.userTimezone,
  timeOfDay: timeContext.timeOfDay,
  localDateTime: timeContext.localDateTime,
};

console.log("📊 Enhanced Context for API:");
console.log(JSON.stringify(enhancedContext, null, 2));

console.log("🎉 All time context tests passed!");
