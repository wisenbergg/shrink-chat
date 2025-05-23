#!/usr/bin/env node

// direct-fix-memory.mjs - Directly fixes the memory functionality by applying SQL and code changes

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

// Read environment variables
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check for .env file if not in environment
if (!supabaseUrl || !supabaseKey) {
  try {
    const envFile = fs.readFileSync(".env.local", "utf8");
    const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/);
    const keyMatch =
      envFile.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\n]+)"?/) ||
      envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\n]+)"?/);

    if (urlMatch) supabaseUrl = urlMatch[1];
    if (keyMatch) supabaseKey = keyMatch[1];
  } catch (err) {
    console.log(
      "Could not read .env.local file, using provided environment variables"
    );
  }
}

// Final check before proceeding
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing Supabase URL or Key. Please provide them as environment variables."
  );
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// SQL statements to fix the memory functionality
const SQL_FIX = `
-- Make sure the pgvector extension is available
CREATE EXTENSION IF NOT EXISTS pgvector;

-- Create the jsonb_to_vector function to convert JSON arrays to vectors
CREATE OR REPLACE FUNCTION public.jsonb_to_vector(embedding_json jsonb)
RETURNS vector
LANGUAGE plpgsql
AS $$
DECLARE
    vector_array float[];
    vector_result vector;
BEGIN
    -- Convert the jsonb array to a float array
    SELECT array_agg(x::float) INTO vector_array
    FROM jsonb_array_elements_text(embedding_json) x;
    
    -- Convert float array to vector
    vector_result = vector_array::vector;
    
    RETURN vector_result;
END;
$$;

-- Update the get_relevant_memories function to properly handle JSON inputs
CREATE OR REPLACE FUNCTION public.get_relevant_memories(
    p_embedding jsonb,
    p_user_id uuid,
    p_threshold float DEFAULT 0.7,
    p_limit integer DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    thread_id uuid,
    summary text,
    similarity_score float
)
LANGUAGE plpgsql AS $$
DECLARE
    vector_embedding vector(1536);
BEGIN
    -- Check if thread_id exists
    IF NOT EXISTS (SELECT 1 FROM public.threads WHERE id = p_user_id) THEN
        RAISE WARNING 'No matching thread found for thread_id: %', p_user_id;
        RETURN;
    END IF;

    -- Convert JSON embedding to vector using our jsonb_to_vector function
    vector_embedding := jsonb_to_vector(p_embedding);
    
    RETURN QUERY
    SELECT 
        m.id,
        m.thread_id,
        m.summary,
        1 - (m.embedding <=> vector_embedding) as similarity_score
    FROM public.memory m
    WHERE 
        m.thread_id = p_user_id
        AND m.embedding IS NOT NULL
        AND 1 - (m.embedding <=> vector_embedding) >= p_threshold
    ORDER BY similarity_score DESC
    LIMIT p_limit;
END;
$$;
`;

// Main function to apply the fix
async function applyMemoryFix() {
  console.log("🔧 Applying memory functionality fix...\n");

  try {
    // 1. Apply SQL fix
    console.log("📊 Applying SQL fixes to the database...");
    const { error } = await supabase.rpc("exec_sql", { query: SQL_FIX });

    if (error) {
      console.error("❌ Error applying SQL fix:", error.message);
      console.log("⚠️ Attempting alternative method...");

      // Write SQL to a file
      const sqlFilePath = path.join(
        process.cwd(),
        "fix-memory-vector-conversion-temp.sql"
      );
      fs.writeFileSync(sqlFilePath, SQL_FIX);

      try {
        // Try using supabase CLI
        console.log("🔄 Trying with supabase CLI...");
        await execAsync(`supabase db execute --file "${sqlFilePath}"`);
        console.log("✅ SQL fix applied successfully using Supabase CLI");
      } catch (cliError) {
        console.error("❌ Supabase CLI failed:", cliError.message);
        console.log("❗ Please run the ./apply-vector-fix.sh script manually");
      } finally {
        // Clean up temporary file
        fs.unlinkSync(sqlFilePath);
      }
    } else {
      console.log("✅ SQL fix applied successfully through RPC");
    }

    // 2. Test the fix
    console.log("\n🧪 Testing memory functionality...");

    // Generate a unique test thread ID
    const testThreadId = `test-memory-${Date.now()}`;
    console.log(`📝 Using test thread ID: ${testThreadId}`);

    try {
      // Run the test with our test ID
      const testCommand = `NODE_OPTIONS="--experimental-specifier-resolution=node" node test-memory.mjs ${testThreadId}`;
      const { stdout, stderr } = await execAsync(testCommand);

      console.log("\n📋 Test Results:");
      console.log(stdout);

      if (stderr) {
        console.error("⚠️ Test Warnings/Errors:");
        console.error(stderr);
      }

      console.log("\n✅ Memory fix applied and tested successfully!");
      console.log(
        "📚 See docs/memory-fix.md for more information about the fix."
      );
    } catch (testError) {
      console.error("❌ Test failed:", testError.message);
      if (testError.stdout) console.log(testError.stdout);
      if (testError.stderr) console.error(testError.stderr);

      console.log("\n⚠️ The SQL fix was applied but the test failed.");
      console.log(
        "📚 Please see docs/memory-fix.md for manual troubleshooting steps."
      );
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

// Run the fix
applyMemoryFix();
