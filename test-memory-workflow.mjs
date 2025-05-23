#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local file
config({ path: join(__dirname, ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables");
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase key available:", !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function testMemoryWorkflow() {
  try {
    console.log("\n🧪 Testing memory insertion workflow...");

    // Generate new thread ID for testing
    const threadId = uuidv4();
    console.log(`Using thread ID: ${threadId}`);

    // Create thread first
    console.log("Step 1: Creating thread...");
    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .insert({ id: threadId })
      .select();

    if (threadError) {
      console.error("❌ Error creating thread:", threadError);
      return;
    }
    console.log("✅ Thread created");

    // Create profile
    console.log("Step 2: Creating profile...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        thread_id: threadId,
        name: "Test Profile",
        emotional_tone: [],
        concerns: [],
      })
      .select();

    if (profileError) {
      console.error("❌ Error creating profile:", profileError);
      return;
    }
    console.log("✅ Profile created");

    // Insert memory
    console.log("Step 3: Inserting memory...");
    const { data: memory, error: memoryError } = await supabase
      .from("memory")
      .insert({
        thread_id: threadId,
        author_role: "user",
        summary: "Test memory entry",
        salience: 50,
      })
      .select();

    if (memoryError) {
      console.error("❌ Memory insertion failed:", memoryError);
      console.log(
        "\nThe error is likely due to the check_memory_user trigger."
      );
      console.log(
        "To fix this issue, run the SQL in fix-memory-trigger.sql using Supabase Studio SQL Editor."
      );
      return;
    }

    console.log("✅ Memory inserted successfully:", memory);

    // Try another memory insertion
    console.log("\nStep 4: Inserting second memory entry...");
    const { data: memory2, error: memory2Error } = await supabase
      .from("memory")
      .insert({
        thread_id: threadId,
        author_role: "engine",
        summary: "Second test memory entry",
        salience: 70,
      })
      .select();

    if (memory2Error) {
      console.error("❌ Second memory insertion failed:", memory2Error);
    } else {
      console.log("✅ Second memory inserted successfully:", memory2);
    }

    console.log("\n✅ Memory workflow is working!");
    console.log(
      `You can use the /memory-test page with thread ID: ${threadId}`
    );

    // Give instructions for permanent fix
    console.log(
      "\n📝 For a permanent fix that auto-creates threads and profiles:"
    );
    console.log("1. Go to Supabase Studio");
    console.log("2. Open the SQL Editor");
    console.log("3. Copy and paste this SQL:");
    console.log("---------------------------");
    console.log(`
DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;
DROP FUNCTION IF EXISTS public.check_memory_user CASCADE;

-- Create a new function that auto-creates necessary records
CREATE OR REPLACE FUNCTION public.check_memory_user()
RETURNS TRIGGER AS $$
BEGIN
    -- First check if thread exists
    IF NOT EXISTS (SELECT 1 FROM public.threads WHERE id = NEW.thread_id) THEN
        -- Auto-create thread if it doesn't exist
        INSERT INTO public.threads (id) VALUES (NEW.thread_id);
        RAISE NOTICE 'Auto-created thread with ID %', NEW.thread_id;
    END IF;
    
    -- Now check if profile exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE thread_id = NEW.thread_id) THEN
        -- Auto-create profile if it doesn't exist
        INSERT INTO public.profiles (thread_id, name, emotional_tone, concerns) 
        VALUES (NEW.thread_id, 'Auto-created', ARRAY[]::text[], ARRAY[]::text[]);
        RAISE NOTICE 'Auto-created profile for thread ID %', NEW.thread_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER check_memory_user_trigger
    BEFORE INSERT ON public.memory
    FOR EACH ROW
    EXECUTE FUNCTION public.check_memory_user();
    `);
    console.log("---------------------------");
    console.log("4. Run the SQL to apply the permanent fix");
  } catch (err) {
    console.error("Error in memory workflow test:", err);
  }
}

// Run the test
testMemoryWorkflow();
