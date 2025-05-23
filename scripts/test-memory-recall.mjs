#!/usr/bin/env node
// Diagnostic script for memory recall testing

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';

// Load environment from .env.local
config({ path: '.env.local' });bin/env node
// Diagnostic script for memory recall testing

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { OpenAI } from "openai";

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Helper function to generate embeddings
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// Test memory recall function
async function testMemoryRecall(threadId) {
  console.log(`\n🧪 Testing memory recall for thread: ${threadId}`);

  // Step 1: Create sample memory entries
  console.log("\n1️⃣ Creating sample memory entries...");
  const memorySamples = [
    { text: "My name is Greg and I live in New York", author_role: "user" },
    {
      text: "I'm feeling stressed about my upcoming job interview",
      author_role: "user",
    },
    { text: "I enjoy playing tennis on weekends", author_role: "user" },
    {
      text: "I'm considering adopting a dog from the shelter",
      author_role: "user",
    },
  ];

  // First ensure thread exists
  console.log("Ensuring thread exists...");
  const { error: threadError } = await supabase
    .from("threads")
    .upsert([{ id: threadId }]);

  if (threadError) {
    console.error("Error creating thread:", threadError);
    return;
  }

  // Create profile
  console.log("Ensuring profile exists...");
  const { error: profileError } = await supabase.from("profiles").upsert([
    {
      thread_id: threadId,
      name: "Test User",
      emotional_tone: [],
      concerns: [],
    },
  ]);

  if (profileError) {
    console.error("Error creating profile:", profileError);
    return;
  }

  // Insert memory entries
  for (const sample of memorySamples) {
    console.log(`Creating memory entry: "${sample.text}"`);
    const embedding = await generateEmbedding(sample.text);
    const { error } = await supabase.from("memory").insert({
      thread_id: threadId,
      author_role: sample.author_role,
      summary: sample.text,
      embedding: JSON.stringify(embedding),
      salience: 50,
    });

    if (error) {
      console.error(`Error creating memory: ${error.message}`);
    }
  }

  // Step 2: Test different memory recall queries
  console.log("\n2️⃣ Testing memory recall with different queries...");
  const queries = [
    "What is my name?",
    "Where do I live?",
    "What am I stressed about?",
    "What sport do I play?",
    "Do I like animals?",
  ];

  for (const query of queries) {
    console.log(`\n📝 Query: "${query}"`);
    try {
      // Generate embedding for the query
      const embedding = await generateEmbedding(query);

      // Query the database
      const { data, error } = await supabase.rpc("get_relevant_memories", {
        p_embedding: JSON.stringify(embedding),
        p_threshold: 0.5,
        p_limit: 3,
        p_user_id: threadId,
      });

      if (error) {
        console.error(`Error querying memories: ${error.message}`);
        continue;
      }

      console.log(`Found ${data.length} relevant memories:`);
      data.forEach((item, i) => {
        console.log(
          `  ${i + 1}. [Score: ${item.similarity_score.toFixed(4)}] "${
            item.summary
          }"`
        );
      });
    } catch (err) {
      console.error(`Error processing query "${query}":`, err);
    }
  }
}

// Main function
async function main() {
  try {
    // Generate a unique thread ID for testing
    const threadId = uuidv4();
    console.log(`\n✨ Starting memory recall test with thread ID: ${threadId}`);

    await testMemoryRecall(threadId);

    console.log("\n✅ Memory recall test completed.");
  } catch (error) {
    console.error("\n❌ Memory recall test failed:", error);
  }
}

// Run the test
main().catch(console.error);
