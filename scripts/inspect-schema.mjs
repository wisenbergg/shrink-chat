import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectMemoryTable() {
  console.log("Inspecting memory table...");

  try {
    // Try to get one row from the memory table
    const { data, error } = await supabase.from("memory").select("*").limit(1);

    if (error) {
      console.error("Error querying memory table:", error);
      return;
    }

    if (data && data.length > 0) {
      console.log("Memory table columns:");
      const columns = Object.keys(data[0]);
      columns.forEach((col) => console.log(`  ${col}`));

      console.log("\nSample data:");
      console.log(data[0]);
    } else {
      console.log(
        "Memory table exists but is empty. Creating a sample entry to see structure..."
      );

      // Try to create a minimal entry
      const { data: insertData, error: insertError } = await supabase
        .from("memory")
        .insert({
          thread_id: "00000000-0000-0000-0000-000000000000",
          summary: "Test entry to inspect schema",
          author_role: "system",
        })
        .select();

      if (insertError) {
        console.error("Error creating sample entry:", insertError);
        console.log(
          "Error message might reveal required fields:",
          insertError.message
        );
      } else {
        console.log("Successfully created sample entry:");
        console.log(insertData[0]);
      }
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

async function findThreadsTable() {
  console.log("\nLooking for threads or sessions table...");

  const possibleTables = [
    "threads",
    "thread",
    "sessions",
    "session",
    "conversations",
    "chats",
  ];

  for (const table of possibleTables) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(1);

      if (!error) {
        console.log(`Found table: ${table}`);
        if (data && data.length > 0) {
          console.log("Columns:");
          const columns = Object.keys(data[0]);
          columns.forEach((col) => console.log(`  ${col}`));

          console.log("\nSample data:");
          console.log(data[0]);
        } else {
          console.log(`Table ${table} exists but is empty`);
        }
      }
    } catch (error) {
      // Table doesn't exist, continue to next one
    }
  }
}

async function main() {
  await inspectMemoryTable();
  await findThreadsTable();
}

main();
