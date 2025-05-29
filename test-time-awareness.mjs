/**
 * Test time-aware AI responses
 * This test sends requests during different simulated times to verify contextual responses
 */

import fetch from "node-fetch";

const API_URL = "http://localhost:3000/api/shrink";

// Simulate different times of day
const testScenarios = [
  {
    name: "Morning Test",
    timeOverride: {
      userTime: "8:30 AM",
      userTimezone: "America/New_York",
      timeOfDay: "morning",
      localDateTime: new Date("2025-05-28T08:30:00-05:00").toISOString(),
    },
    prompt: "I'm feeling a bit anxious about starting my day.",
  },
  {
    name: "Evening Test",
    timeOverride: {
      userTime: "9:15 PM",
      userTimezone: "America/New_York",
      timeOfDay: "evening",
      localDateTime: new Date("2025-05-28T21:15:00-05:00").toISOString(),
    },
    prompt: "I'm feeling stressed and need to unwind.",
  },
  {
    name: "Late Night Test",
    timeOverride: {
      userTime: "11:45 PM",
      userTimezone: "America/New_York",
      timeOfDay: "night",
      localDateTime: new Date("2025-05-28T23:45:00-05:00").toISOString(),
    },
    prompt: "I can't sleep and my mind is racing.",
  },
];

async function testTimeAwareness() {
  console.log("🤖 Testing Time-Aware AI Responses\n");

  for (const scenario of testScenarios) {
    console.log(`🕐 ${scenario.name}`);
    console.log(
      `⏰ Simulated time: ${scenario.timeOverride.userTime} (${scenario.timeOverride.timeOfDay})`
    );
    console.log(`💭 User prompt: "${scenario.prompt}"\n`);

    const enhancedContext = {
      userName: "Test User",
      userEmotions: ["anxious"],
      conversationTopics: ["stress-management"],
      userPreferences: {},
      conversationLength: 1,
      isReturningUser: true,
      ...scenario.timeOverride,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: scenario.prompt,
          threadId: `test-thread-${Date.now()}`,
          memoryContext: "",
          enhancedContext,
        }),
      });

      if (!response.ok) {
        console.log(
          `❌ API Error: ${response.status} ${response.statusText}\n`
        );
        continue;
      }

      const data = await response.json();
      console.log(`🤖 AI Response: "${data.response_text}"`);

      // Check for time-contextual keywords
      const responseText = data.response_text.toLowerCase();
      const timeKeywords = {
        morning: ["morning", "start", "beginning", "fresh", "day ahead"],
        evening: ["evening", "unwind", "wind down", "relax", "end of day"],
        night: ["sleep", "rest", "nighttime", "bedtime", "quiet"],
      };

      const relevantKeywords =
        timeKeywords[scenario.timeOverride.timeOfDay] || [];
      const foundKeywords = relevantKeywords.filter((keyword) =>
        responseText.includes(keyword)
      );

      if (foundKeywords.length > 0) {
        console.log(
          `✅ Time-contextual response detected! Keywords found: ${foundKeywords.join(
            ", "
          )}`
        );
      } else {
        console.log(`⚠️  No obvious time-contextual keywords detected`);
      }
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }

    console.log("\n" + "─".repeat(80) + "\n");
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch("http://localhost:3000/api/health");
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log("❌ Development server is not running!");
    console.log("📝 Please start the server with: npm run dev");
    console.log("⏳ Then run this test again");
    return;
  }

  console.log("✅ Server is running, starting tests...\n");
  await testTimeAwareness();
  console.log("🎉 Time awareness testing complete!");
}

main().catch(console.error);
