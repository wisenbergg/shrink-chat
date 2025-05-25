#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugOnboardingSystem() {
  console.log("🔍 DEBUGGING ONBOARDING SYSTEM");
  console.log("=====================================");

  try {
    // 1. Check if profiles table has onboarding_completed field
    console.log("\n1. Checking profiles table schema...");
    const { data: profilesSchema, error: schemaError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1);

    if (schemaError) {
      console.log("❌ Error querying profiles:", schemaError);
      return;
    }

    console.log("✅ Profiles table accessible");
    if (profilesSchema.length > 0) {
      console.log(
        "📋 Sample profile structure:",
        Object.keys(profilesSchema[0])
      );
      console.log(
        "🎯 Has onboarding_completed?",
        "onboarding_completed" in profilesSchema[0]
      );
    }

    // 2. Check if onboarding_progress table exists (should not be used)
    console.log("\n2. Checking onboarding_progress table...");
    const { data: progressData, error: progressError } = await supabase
      .from("onboarding_progress")
      .select("*")
      .limit(1);

    if (progressError) {
      console.log(
        "⚠️  onboarding_progress table error:",
        progressError.message
      );
      console.log("✅ This is expected - we don't use this table anymore");
    } else {
      console.log(
        "📊 onboarding_progress table exists with",
        progressData.length,
        "records"
      );
      console.log(
        "⚠️  WARNING: This table should not be used in the new system"
      );
    }

    // 3. Check current profiles with onboarding status
    console.log("\n3. Checking current user profiles...");
    const { data: allProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("thread_id, name, onboarding_completed, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (profileError) {
      console.log("❌ Error fetching profiles:", profileError);
      return;
    }

    console.log(`📊 Found ${allProfiles.length} recent profiles:`);
    allProfiles.forEach((profile, index) => {
      console.log(
        `  ${index + 1}. Thread: ${profile.thread_id?.substring(0, 8)}...`
      );
      console.log(`     Name: ${profile.name || "No name"}`);
      console.log(
        `     Onboarding: ${
          profile.onboarding_completed ? "✅ Complete" : "❌ Incomplete"
        }`
      );
      console.log(
        `     Created: ${new Date(profile.created_at).toLocaleString()}`
      );
      console.log("");
    });

    // 4. Test creating a new profile and completing onboarding
    console.log("\n4. Testing onboarding completion flow...");
    const testThreadId = crypto.randomUUID();
    console.log(
      "🧪 Creating test profile:",
      testThreadId.substring(0, 8) + "..."
    );

    // Create thread
    const { error: threadError } = await supabase
      .from("threads")
      .insert({ id: testThreadId });

    if (threadError) {
      console.log("❌ Thread creation failed:", threadError);
      return;
    }

    // Create profile
    const { error: createError } = await supabase.from("profiles").insert({
      thread_id: testThreadId,
      name: "Test User",
      onboarding_completed: false,
    });

    if (createError) {
      console.log("❌ Profile creation failed:", createError);
      return;
    }

    console.log("✅ Test profile created");

    // Complete onboarding
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("thread_id", testThreadId);

    if (updateError) {
      console.log("❌ Onboarding completion failed:", updateError);
    } else {
      console.log("✅ Onboarding completion successful");
    }

    // Verify the update worked
    const { data: verifyProfile, error: verifyError } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("thread_id", testThreadId)
      .single();

    if (verifyError) {
      console.log("❌ Verification failed:", verifyError);
    } else {
      console.log(
        "🔍 Verification result:",
        verifyProfile.onboarding_completed ? "✅ Complete" : "❌ Not complete"
      );
    }

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await supabase.from("profiles").delete().eq("thread_id", testThreadId);
    await supabase.from("threads").delete().eq("id", testThreadId);
    console.log("✅ Cleanup complete");
  } catch (error) {
    console.error("❌ Debug script failed:", error);
  }

  console.log("\n🎯 NEXT STEPS:");
  console.log(
    "1. Ensure middleware is not interfering (check src/middleware.ts)"
  );
  console.log("2. Check browser console for any client-side errors");
  console.log("3. Verify localStorage is being set correctly");
  console.log("4. Test the actual onboarding flow in browser");
  console.log("\n📝 If issues persist:");
  console.log("- Clear browser localStorage and cookies");
  console.log("- Check network tab for failed API calls");
  console.log("- Look for conflicting authentication systems");
}

debugOnboardingSystem().catch(console.error);
