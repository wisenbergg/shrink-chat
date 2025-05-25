#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

console.log("🔍 Starting Simple Debug...");
console.log(
  "NEXT_PUBLIC_SUPABASE_URL:",
  process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"
);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing"
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabase() {
  try {
    console.log("\n📊 Testing database connection...");

    // Test profiles table
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("thread_id, name, onboarding_completed")
      .limit(3);

    if (profileError) {
      console.log("❌ Profiles query error:", profileError.message);
      return;
    }

    console.log("✅ Profiles table accessible");
    console.log(`📋 Found ${profiles.length} profiles:`);
    profiles.forEach((profile, i) => {
      console.log(
        `  ${i + 1}. ${profile.name || "No name"} - Onboarding: ${
          profile.onboarding_completed ? "✅" : "❌"
        }`
      );
    });

    // Test creating a simple profile
    console.log("\n🧪 Testing profile creation...");
    const testThreadId = crypto.randomUUID();

    const { error: insertError } = await supabase.from("profiles").insert({
      thread_id: testThreadId,
      name: "Debug Test User",
      onboarding_completed: false,
    });

    if (insertError) {
      console.log("❌ Insert failed:", insertError.message);
      return;
    }

    console.log("✅ Profile created successfully");

    // Test updating onboarding status
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("thread_id", testThreadId);

    if (updateError) {
      console.log("❌ Update failed:", updateError.message);
      return;
    }

    console.log("✅ Onboarding completion update successful");

    // Clean up
    await supabase.from("profiles").delete().eq("thread_id", testThreadId);
    console.log("✅ Test data cleaned up");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

testDatabase();
