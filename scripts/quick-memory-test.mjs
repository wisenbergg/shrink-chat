// Quick test script for memory functionality

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

console.log("Environment variables:");
console.log("- SUPABASE_URL:", SUPABASE_URL ? "✅ (Set)" : "❌ (Missing)");
console.log("- SUPABASE_KEY:", SUPABASE_KEY ? "✅ (Set)" : "❌ (Missing)");
console.log("- OPENAI_KEY:", OPENAI_KEY ? "✅ (Set)" : "❌ (Missing)");

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });

// Create a simple test memory
async function testMemory() {
  console.log("\nRunning memory test...");

  // Generate a test thread ID
  const threadId = "test-memory-recall";

  try {
    // Ensure thread exists
    console.log("Creating test thread...");
    await supabase.from("threads").upsert([{ id: threadId }]);

    // Create profile
    console.log("Creating test profile...");
    await supabase.from("profiles").upsert([
      {
        thread_id: threadId,
        name: "Test User",
        emotional_tone: [],
        concerns: [],
      },
    ]);

    // Generate test embedding
    console.log("Generating embedding...");
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "My name is Greg and I live in New York",
    });
    const embedding = embeddingResponse.data[0].embedding;

    // Create test memory
    console.log("Inserting test memory...");
    const { error } = await supabase.from("memory").insert({
      thread_id: threadId,
      author_role: "user",
      summary: "My name is Greg and I live in New York",
      embedding: embedding,
      salience: 50,
    });

    if (error) {
      console.error("Error inserting memory:", error);
      return;
    }

    // Test memory recall
    console.log("Testing memory recall...");
    const searchEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "What's my name?",
    });

    const { data, error: searchError } = await supabase.rpc(
      "get_relevant_memories",
      {
        p_embedding: searchEmbedding.data[0].embedding,
        p_threshold: 0.5,
        p_limit: 5,
        p_user_id: threadId,
      }
    );

    if (searchError) {
      console.error("Error searching memories:", searchError);
      return;
    }

    console.log("Search results:", data);
    console.log("\n✅ Memory test completed successfully!");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testMemory().catch(console.error);
