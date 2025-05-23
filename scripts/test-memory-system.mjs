// Add dotenv at the top to load environment variables
import * as dotenv from "dotenv";
// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Check environment variables
console.log("Checking environment variables...");

const requiredVars = [
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missingVars.join(", ")
  );
  process.exit(1);
}

// Print API key info (safely)
const apiKey = process.env.OPENAI_API_KEY || "";
console.log("API Key length:", apiKey.length);
console.log("API Key prefix:", apiKey.substring(0, 8) + "...");

console.log("✅ All required environment variables are set");

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test embedding generation
async function testEmbeddingGeneration() {
  console.log("\nTesting embedding generation...");
  try {
    const response = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
      input: "This is a test message to check if embeddings are working.",
    });

    const embedding = response.data[0].embedding;
    console.log(
      `✅ Successfully generated embedding with ${embedding.length} dimensions`
    );
    return embedding;
  } catch (error) {
    console.error("❌ Error generating embedding:", error);
    return null;
  }
}

// Get a valid user ID
async function getValidUserId() {
  console.log("\nFinding a valid user ID...");
  try {
    // Try to get a user from the users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .limit(1)
      .single();

    if (!userError && user) {
      console.log(`✅ Found user ID from users table: ${user.id}`);
      return user.id;
    }

    // If we couldn't find a user, use a default UUID
    const defaultUserId = "00000000-0000-0000-0000-000000000000";
    console.log(
      `⚠️ Could not find a valid user ID, using default: ${defaultUserId}`
    );
    return defaultUserId;
  } catch (error) {
    console.error("❌ Error finding valid user ID:", error);
    const defaultUserId = "00000000-0000-0000-0000-000000000000";
    console.log(`⚠️ Using default user ID: ${defaultUserId}`);
    return defaultUserId;
  }
}

// Create a test thread and session
async function createTestThreadAndSession() {
  console.log("\nCreating test thread and session...");

  // Get a valid user ID
  const userId = await getValidUserId();

  // Generate a UUID for the thread
  const threadId = randomUUID();
  console.log(`Using thread UUID: ${threadId}`);

  try {
    // Step 1: Create a thread
    console.log("Creating thread...");
    const { data: threadData, error: threadError } = await supabase
      .from("threads")
      .insert({
        id: threadId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (threadError) {
      console.error("❌ Error creating thread:", threadError);
      return null;
    }

    console.log("✅ Successfully created thread:", threadData.id);

    // Step 2: Create a session linking the user to the thread
    console.log("Creating session...");
    const sessionId = randomUUID();
    const now = new Date().toISOString();

    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        id: sessionId,
        user_id: userId,
        thread_id: threadId,
        started_at: now,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (sessionError) {
      console.error("❌ Error creating session:", sessionError);
      return null;
    }

    console.log("✅ Successfully created session:", sessionData.id);

    return { threadId, userId, sessionId };
  } catch (error) {
    console.error("❌ Error in thread/session creation process:", error);
    return null;
  }
}

// Test storing memory with embedding
async function testStoreMemory(embedding) {
  console.log("\nTesting memory storage with embedding...");

  // Create a test thread and session first
  const threadSession = await createTestThreadAndSession();
  if (!threadSession) {
    console.error(
      "❌ Failed to create thread and session, cannot continue with memory test"
    );
    return null;
  }

  const { threadId, userId } = threadSession;

  try {
    // Create memory entry
    const memoryData = {
      thread_id: threadId,
      author_role: "user",
      summary: "This is a test memory entry.",
      embedding: embedding,
      salience: 50,
      tags: ["test"],
    };

    const { data, error } = await supabase
      .from("memory")
      .insert(memoryData)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Successfully stored memory with embedding");
    console.log("Memory ID:", data.id);
    return {
      threadId,
      memoryId: data.id,
      userId,
      sessionId: threadSession.sessionId,
    };
  } catch (error) {
    console.error("❌ Error storing memory:", error);
    return null;
  }
}

// Test vector similarity search
async function testVectorSimilarity(threadId, embedding, userId) {
  console.log("\nTesting vector similarity search...");

  try {
    // Use userId instead of threadId for the function call
    const { data: functionExists, error: functionError } = await supabase.rpc(
      "get_relevant_memories",
      {
        p_embedding: embedding,
        p_threshold: 0.5,
        p_limit: 5,
        p_user_id: userId,
      }
    );

    if (functionError) {
      if (
        functionError.message.includes(
          "function get_relevant_memories() does not exist"
        )
      ) {
        console.error(
          "❌ The get_relevant_memories SQL function is not installed in your database"
        );
        console.log(
          "Please run the SQL function creation script we provided earlier"
        );
        return false;
      }
      throw functionError;
    }

    console.log("✅ Vector similarity search is working");
    console.log("Search results:", functionExists);
    return true;
  } catch (error) {
    console.error("❌ Error testing vector similarity:", error);
    return false;
  }
}

// Clean up test data
async function cleanupTestData(threadId, sessionId) {
  console.log("\nCleaning up test data...");

  try {
    // Delete from memory table
    console.log("Deleting memory entries...");
    const { error: memoryError } = await supabase
      .from("memory")
      .delete()
      .eq("thread_id", threadId);

    if (memoryError) {
      console.error("❌ Error deleting from memory table:", memoryError);
    } else {
      console.log("✅ Successfully deleted test memory data");
    }

    // Delete from sessions table
    if (sessionId) {
      console.log("Deleting session...");
      const { error: sessionError } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);

      if (sessionError) {
        console.error("❌ Error deleting from sessions table:", sessionError);
      } else {
        console.log("✅ Successfully deleted test session data");
      }
    }

    // Delete from threads table
    console.log("Deleting thread...");
    const { error: threadError } = await supabase
      .from("threads")
      .delete()
      .eq("id", threadId);

    if (threadError) {
      console.error("❌ Error deleting from threads table:", threadError);
    } else {
      console.log("✅ Successfully deleted test thread data");
    }
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
  }
}

// Run all tests - KEEP THIS VERSION that passes userId
async function runTests() {
  // Test embedding generation
  const embedding = await testEmbeddingGeneration();
  if (!embedding) return;

  // Test storing memory
  const memoryData = await testStoreMemory(embedding);
  if (!memoryData) return;

  // Test vector similarity with userId
  await testVectorSimilarity(memoryData.threadId, embedding, memoryData.userId);

  // Clean up
  await cleanupTestData(memoryData.threadId, memoryData.sessionId);

  console.log("\n🎉 All tests completed!");
}

// Run the tests
runTests();
