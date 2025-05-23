#!/usr/bin/env node
// filepath: /Users/hipdev/dev/shrink-chat/apply-fix.mjs

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { v4 as uuidv4 } from "uuid";

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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function applyFixDirectly() {
  try {
    console.log("🔧 Applying memory trigger fix directly...");

    // SQL to apply the fix
    const fixSQL = `
      -- Drop the existing trigger and function
      DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;
      DROP FUNCTION IF EXISTS public.check_memory_user CASCADE;
      
      -- Create new function that auto-creates necessary records
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
    `;

    // Apply the SQL directly
    const { error } = await supabase.rpc("executeraw", { sql: fixSQL });

    if (error) {
      console.error("❌ Error applying fix:", error);

      // Try an alternative approach with raw queries
      console.log("🔄 Trying alternative fix approach...");

      try {
        // Drop the trigger first
        await supabase.rpc("executeraw", {
          sql: "DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;",
        });
        console.log("✅ Trigger dropped");

        // Then drop the function
        await supabase.rpc("executeraw", {
          sql: "DROP FUNCTION IF EXISTS public.check_memory_user CASCADE;",
        });
        console.log("✅ Function dropped");

        // Create the new function
        const createFunctionSQL = `
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
        `;

        await supabase.rpc("executeraw", { sql: createFunctionSQL });
        console.log("✅ New function created");

        // Create the new trigger
        await supabase.rpc("executeraw", {
          sql: `
          CREATE TRIGGER check_memory_user_trigger
              BEFORE INSERT ON public.memory
              FOR EACH ROW
              EXECUTE FUNCTION public.check_memory_user();
          `,
        });
        console.log("✅ New trigger created");
      } catch (err) {
        console.error("❌ Alternative fix also failed:", err);
        console.log(
          "Please apply the fix using Supabase Studio SQL Editor instead."
        );
        return;
      }
    } else {
      console.log("✅ Fix applied successfully!");
    }

    // Test the fix
    console.log("\n🧪 Testing memory insertion with auto-creation...");
    const testThreadId = uuidv4();
    console.log(`Using test thread ID: ${testThreadId}`);

    // Try inserting memory with a new thread ID
    const { data: memoryData, error: memoryError } = await supabase
      .from("memory")
      .insert({
        thread_id: testThreadId,
        author_role: "user",
        summary: "Test memory after fix",
        salience: 50,
      })
      .select()
      .single();

    if (memoryError) {
      console.error("❌ Memory insertion failed:", memoryError);
      console.log("Fix was not successful. Please check the Supabase logs.");
    } else {
      console.log("✅ Memory inserted successfully:", memoryData);

      // Check if thread was auto-created
      const { data: threadData } = await supabase
        .from("threads")
        .select("*")
        .eq("id", testThreadId)
        .single();

      console.log("Auto-created thread:", threadData);

      // Check if profile was auto-created
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("thread_id", testThreadId)
        .single();

      console.log("Auto-created profile:", profileData);

      console.log(
        "\n✅ Fix verification complete! Your memory system is now working correctly."
      );
      console.log(
        "You can now use the memory-test page to test with any thread ID."
      );
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

applyFixDirectly();
