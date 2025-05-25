#!/usr/bin/env tsx

/**
 * Test script to verify that memory records can be inserted without user_id foreign key constraint errors
 */

import { insertMemoryForThread } from "./src/lib/sessionMemory";

async function testMemoryFix() {
  console.log("🧪 Testing memory insertion fix...\n");

  const testThreadId = "test-thread-" + Date.now();
  const testSummary =
    "Test memory entry to verify foreign key constraint issue is resolved";

  try {
    console.log(`📝 Creating memory record for thread: ${testThreadId}`);
    console.log(`💭 Summary: ${testSummary}`);

    const result = await insertMemoryForThread({
      threadId: testThreadId,
      author_role: "user",
      summary: testSummary,
    });

    if (result) {
      console.log("✅ Memory record created successfully!");
      console.log("📊 Record details:", {
        id: result.id,
        thread_id: result.thread_id,
        author_role: result.author_role,
        summary: result.summary,
        created_at: result.created_at,
      });

      console.log(
        "\n🎉 SUCCESS: Memory insertion completed without foreign key constraint error!"
      );
      console.log(
        "🔧 The user_id field has been successfully removed from memory payloads"
      );
    } else {
      console.log("❌ Failed to create memory record");
    }
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.includes("foreign key constraint")
    ) {
      console.error(
        "❌ FAILED: Foreign key constraint error still exists:",
        error.message
      );
    } else {
      const errorMessage =
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : String(error);
      console.error(
        "❌ Error testing memory (not foreign key related):",
        errorMessage
      );
    }
  }
}

// Run the test
testMemoryFix().catch(console.error);
