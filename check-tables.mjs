#!/usr/bin/env node

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTable(tableName) {
  console.log(`\n=== Checking ${tableName} table ===`);
  try {
    const { data, error } = await supabase.from(tableName).select("*").limit(1);

    if (error) {
      console.log(`❌ Table '${tableName}' does not exist or is inaccessible`);
      console.log("Error:", error.message);
      return false;
    }

    console.log(`✅ Table '${tableName}' exists`);
    if (data && data.length > 0) {
      console.log("Sample columns:", Object.keys(data[0]));
    } else {
      console.log("Table is empty, trying to get column info...");
      // Try to insert a dummy record to see required fields
      try {
        const { error: insertError } = await supabase
          .from(tableName)
          .insert({});
        if (insertError) {
          console.log("Required fields might include:", insertError.message);
        }
      } catch {
        console.log("Could not determine required fields");
      }
    }
    return true;
  } catch (error) {
    console.log(`❌ Error checking table '${tableName}':`, error.message);
    return false;
  }
}

async function main() {
  console.log("Checking database tables...");

  const tables = ["profiles", "onboarding_progress", "threads", "memory"];

  for (const table of tables) {
    await checkTable(table);
  }

  console.log("\n=== Summary ===");
  console.log("Based on the error logs, the issue is:");
  console.log("1. onboarding_progress table doesn't exist");
  console.log(
    "2. Code is trying to update 'completed' column which doesn't exist"
  );
  console.log(
    "3. The actual onboarding completion should use the 'profiles.onboarding_completed' field"
  );
}

main().catch(console.error);
