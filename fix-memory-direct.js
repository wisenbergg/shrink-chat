#!/usr/bin/env node
// filepath: /Users/hipdev/dev/shrink-chat/fix-memory-direct.js

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables");
  process.exit(1);
}

console.log("Supabase URL:", supabaseUrl);
console.log("API Key available:", !!supabaseKey);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function fixMemoryTrigger() {
  try {
    console.log("🔄 Applying fix to memory trigger...");

    // SQL statements to fix the trigger
    const sqlStatements = [
      // 1. Drop the existing trigger
      "DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;",

      // 2. Drop the existing function
      "DROP FUNCTION IF EXISTS public.check_memory_user CASCADE;",

      // 3. Create the new function with auto-creation logic
      `CREATE OR REPLACE FUNCTION public.check_memory_user()
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
      $$ LANGUAGE plpgsql;`,

      // 4. Create the new trigger
      `CREATE TRIGGER check_memory_user_trigger
          BEFORE INSERT ON public.memory
          FOR EACH ROW
          EXECUTE FUNCTION public.check_memory_user();`,
    ];

    // Execute each SQL statement
    for (const sql of sqlStatements) {
      console.log("Executing:", sql.substring(0, 60) + "...");

      // Using raw SQL execution - this requires appropriate permissions
      const { error } = await supabase.rpc("pgrest_exec", { query: sql });

      if (error) {
        console.error("Error executing SQL:", error);

        // Try an alternative approach if available
        console.log("Trying alternative execution method...");
        try {
          const result = await supabase.rpc("exec_sql", { sql });
          console.log("Alternative execution result:", result);
        } catch (err) {
          console.error("Alternative execution also failed:", err);
        }

        return false;
      }
    }

    console.log("✅ Memory trigger fix applied successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error applying fix:", error);
    return false;
  }
}

async function testMemoryInsertion() {
  try {
    console.log("\n🧪 Testing memory insertion...");

    // Generate a random thread ID
    const threadId = "test-" + Math.random().toString(36).substring(2, 10);
    console.log(`Using test thread ID: ${threadId}`);

    // Attempt direct memory insertion
    const { data, error } = await supabase
      .from("memory")
      .insert({
        thread_id: threadId,
        author_role: "user",
        summary: "Test memory with auto-creation",
        salience: 50,
      })
      .select();

    if (error) {
      console.error("❌ Memory insertion test failed:", error);
      return;
    }

    console.log("✅ Memory inserted successfully:", data);

    // Check if thread and profile were auto-created
    const { data: thread } = await supabase
      .from("threads")
      .select("*")
      .eq("id", threadId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("thread_id", threadId);

    console.log("Auto-created thread:", thread);
    console.log("Auto-created profile:", profile);

    console.log("\n✅ Memory system is now working correctly!");
    console.log(
      "You can use the /memory-test page to verify with any thread ID."
    );
  } catch (error) {
    console.error("❌ Error testing memory insertion:", error);
  }
}

// Run the fix and test
async function run() {
  const fixSucceeded = await fixMemoryTrigger();

  if (fixSucceeded) {
    await testMemoryInsertion();
  } else {
    console.log(
      "\n⚠️ Could not apply automatic fix. Please apply the SQL manually using Supabase Studio:"
    );
    console.log(`
-- Copy this SQL to Supabase Studio and run it

-- 1. Drop the existing trigger
DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;

-- 2. Drop the existing function
DROP FUNCTION IF EXISTS public.check_memory_user CASCADE;

-- 3. Create the new function with auto-creation logic
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

-- 4. Create the new trigger
CREATE TRIGGER check_memory_user_trigger
    BEFORE INSERT ON public.memory
    FOR EACH ROW
    EXECUTE FUNCTION public.check_memory_user();
    `);
  }
}

run();
