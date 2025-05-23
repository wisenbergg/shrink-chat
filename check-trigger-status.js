#!/usr/bin/env node

// Script to check the current memory trigger function
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTrigger() {
  try {
    console.log("📋 Checking memory trigger function...");

    // Query to get the trigger function definition
    const { data, error } = await supabase.rpc("exec_sql", {
      query:
        "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'check_memory_user';",
    });

    if (error) {
      console.error("Error querying function:", error);

      // Alternative approach using direct queries to check if the trigger exists
      console.log("Checking if trigger exists...");
      const { data: triggerData, error: triggerError } = await supabase.rpc(
        "exec_sql",
        {
          query:
            "SELECT * FROM pg_trigger WHERE tgname = 'check_memory_user_trigger';",
        }
      );

      if (triggerError) {
        console.error("Error checking trigger:", triggerError);
      } else {
        console.log("Trigger exists:", !!triggerData && triggerData.length > 0);
      }

      return;
    }

    console.log("Function definition:", data);

    // Check if a memory can be inserted
    console.log("\n⚙️ Testing memory insertion...");

    // Generate a UUID for testing
    const { v4: uuidv4 } = require("uuid");
    const testId = uuidv4();

    // Try direct insertion
    const { data: memoryData, error: memoryError } = await supabase
      .from("memory")
      .insert({
        thread_id: testId,
        author_role: "user",
        summary: "Testing if memory trigger works",
        salience: 50,
      })
      .select();

    if (memoryError) {
      console.error("❌ Memory insertion failed:", memoryError);
    } else {
      console.log("✅ Memory inserted successfully!", memoryData);

      // Verify that thread and profile were auto-created
      const { data: threadData } = await supabase
        .from("threads")
        .select()
        .eq("id", testId);

      const { data: profileData } = await supabase
        .from("profiles")
        .select()
        .eq("thread_id", testId);

      console.log("Thread created:", !!threadData && threadData.length > 0);
      console.log("Profile created:", !!profileData && profileData.length > 0);
    }
  } catch (err) {
    console.error("Error checking trigger:", err);
  }
}

checkTrigger();
