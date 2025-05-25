#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("🔍 CHECKING TABLE SCHEMAS");
console.log("========================");

async function checkSchemas() {
  try {
    // Check profiles table structure
    console.log("\n📋 PROFILES TABLE:");
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);

    if (profileError) {
      console.log("❌ Error:", profileError.message);
    } else if (profiles.length > 0) {
      console.log("✅ Columns:", Object.keys(profiles[0]).join(", "));
      console.log("📊 Sample data:", profiles[0]);
    } else {
      console.log("📭 Table exists but empty");
    }

    // Check onboarding_progress table
    console.log("\n📋 ONBOARDING_PROGRESS TABLE:");
    const { data: progress, error: progressError } = await supabase
      .from("onboarding_progress")
      .select("*")
      .limit(1);

    if (progressError) {
      console.log("❌ Error:", progressError.message);
    } else if (progress.length > 0) {
      console.log("✅ Columns:", Object.keys(progress[0]).join(", "));
      console.log("📊 Sample data:", progress[0]);
    } else {
      console.log("📭 Table exists but empty");
    }

    // Check threads table
    console.log("\n📋 THREADS TABLE:");
    const { data: threads, error: threadError } = await supabase
      .from("threads")
      .select("*")
      .limit(1);

    if (threadError) {
      console.log("❌ Error:", threadError.message);
    } else if (threads.length > 0) {
      console.log("✅ Columns:", Object.keys(threads[0]).join(", "));
    } else {
      console.log("📭 Table exists but empty");
    }

    // Test the current onboarding flow
    console.log("\n🧪 TESTING CURRENT FLOW:");

    // Get all profiles with their onboarding status
    const { data: allProfiles, error: allError } = await supabase
      .from("profiles")
      .select("thread_id, name, onboarding_completed")
      .limit(5);

    if (allError) {
      console.log("❌ Cannot fetch profiles:", allError.message);
    } else {
      console.log(`📊 Found ${allProfiles.length} profiles:`);
      allProfiles.forEach((p, i) => {
        console.log(
          `  ${i + 1}. ${p.thread_id?.substring(0, 8)}... - ${
            p.name || "No name"
          } - ${p.onboarding_completed ? "✅" : "❌"}`
        );
      });
    }
  } catch (error) {
    console.error("❌ Schema check failed:", error);
  }
}

checkSchemas();
