#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Note: Must use service role key for SQL

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables");
  process.exit(1);
}

console.log("🔄 Connecting to Supabase at", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTrigger() {
  try {
    console.log("🔧 Fixing memory trigger using Supabase SQL...");

    // First check what's the current definition of the trigger function
    console.log("\nChecking current trigger function...");
    const { data: currentTrigger, error: checkError } = await supabase.rpc(
      "pg_get_functiondef",
      { func_name: "public.check_memory_user()" }
    );

    if (checkError) {
      console.log("Could not check trigger function:", checkError.message);
      console.log("Proceeding with fix anyway...");
    } else {
      console.log("Current trigger function:\n", currentTrigger);
    }

    // SQL to fix the trigger
    // We'll use individual SQL statements
    const statements = [
      // Drop the trigger
      `DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;`,

      // Drop the function
      `DROP FUNCTION IF EXISTS public.check_memory_user();`,

      // Create the new function
      `CREATE OR REPLACE FUNCTION public.check_memory_user()
       RETURNS TRIGGER AS $$
       BEGIN
           -- First check if thread exists
           IF NOT EXISTS (SELECT 1 FROM public.threads WHERE id = NEW.thread_id) THEN
               -- Auto-create thread if it doesn't exist
               INSERT INTO public.threads (id) VALUES (NEW.thread_id);
           END IF;
           
           -- Now check if profile exists
           IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE thread_id = NEW.thread_id) THEN
               -- Auto-create profile if it doesn't exist
               INSERT INTO public.profiles (thread_id, name, emotional_tone, concerns) 
               VALUES (NEW.thread_id, 'Auto-created', ARRAY[]::text[], ARRAY[]::text[]);
           END IF;
           
           RETURN NEW;
       END;
       $$ LANGUAGE plpgsql;`,

      // Create the new trigger
      `CREATE TRIGGER check_memory_user_trigger
       BEFORE INSERT ON public.memory
       FOR EACH ROW
       EXECUTE FUNCTION public.check_memory_user();`,

      // Add missing foreign keys
      `DO $$ 
       BEGIN
           -- Add foreign key from profiles to threads if it doesn't exist
           IF NOT EXISTS (
               SELECT 1 
               FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_profiles_thread_id' 
               AND table_name = 'profiles'
           ) THEN
               ALTER TABLE public.profiles 
               ADD CONSTRAINT fk_profiles_thread_id 
               FOREIGN KEY (thread_id) 
               REFERENCES public.threads(id) 
               ON DELETE CASCADE;
           END IF;
           
           -- Add foreign key from memory to threads if it doesn't exist
           IF NOT EXISTS (
               SELECT 1 
               FROM information_schema.table_constraints 
               WHERE constraint_name = 'fk_memory_thread_id' 
               AND table_name = 'memory'
           ) THEN
               ALTER TABLE public.memory 
               ADD CONSTRAINT fk_memory_thread_id 
               FOREIGN KEY (thread_id) 
               REFERENCES public.threads(id) 
               ON DELETE CASCADE;
           END IF;
       END $$;`,
    ];

    // Execute each SQL statement
    for (const sql of statements) {
      console.log("\nExecuting SQL:\n", sql.substring(0, 60) + "...");

      const { data, error } = await supabase
        .from("_sqlapi")
        .rpc("raw_sql", { query: sql });

      if (error) {
        console.error("SQL Error:", error);
        console.log("Continuing with next statement...");
      } else {
        console.log("SQL executed successfully:", data);
      }
    }

    console.log("\n✅ Trigger update completed. Testing memory insertion...");
    await testMemoryInsertion();
  } catch (err) {
    console.error("Error:", err);
  }
}

async function testMemoryInsertion() {
  try {
    // Generate a test thread ID
    const { v4: uuidv4 } = require("uuid");
    const threadId = uuidv4();
    console.log(`\nTest thread ID: ${threadId}`);

    // Insert memory directly (this should trigger the auto-creation)
    console.log("Inserting test memory record...");
    const { data: memory, error: memoryError } = await supabase
      .from("memory")
      .insert({
        thread_id: threadId,
        author_role: "user",
        summary: "Test memory insertion after trigger fix",
        salience: 50,
      })
      .select();

    if (memoryError) {
      console.error("❌ Memory insertion failed:", memoryError);
    } else {
      console.log("✅ Memory inserted successfully:", memory);

      // Verify that thread and profile were auto-created
      console.log("\nVerifying thread was auto-created...");
      const { data: thread } = await supabase
        .from("threads")
        .select("*")
        .eq("id", threadId)
        .single();

      console.log("Thread:", thread ? "✅ Created" : "❌ Missing");

      console.log("\nVerifying profile was auto-created...");
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("thread_id", threadId)
        .single();

      console.log("Profile:", profile ? "✅ Created" : "❌ Missing");

      if (thread && profile && memory) {
        console.log("\n✅ SUCCESS! The fix is working correctly.");
        console.log(
          `You can now use the /memory-test page with thread ID: ${threadId}`
        );
      }
    }
  } catch (err) {
    console.error("Error testing memory insertion:", err);
  }
}

// Run the fix
fixTrigger();
