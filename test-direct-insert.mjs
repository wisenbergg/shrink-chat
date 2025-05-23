import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";

// Load environment variables from .env.local
config({ path: ".env.local" });

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

async function testDirectMemoryInsertion() {
  try {
    // Generate a random UUID for testing
    const threadId = uuidv4();
    console.log(`Using random thread ID: ${threadId}`);

    // Try direct memory insertion
    console.log("Attempting direct memory insertion...");
    const { data, error } = await supabase
      .from("memory")
      .insert({
        thread_id: threadId,
        author_role: "user",
        summary: "Direct insertion test",
        salience: 50,
      })
      .select();

    if (error) {
      console.error("Memory insertion failed:", error);
      return;
    }

    console.log("Memory inserted successfully:", data);

    // Check if thread was auto-created
    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .select("*")
      .eq("id", threadId);

    if (threadError) {
      console.error("Error checking thread:", threadError);
    } else {
      console.log("Thread auto-created?", thread.length > 0 ? "Yes" : "No");
      console.log("Thread data:", thread);
    }

    // Check if profile was auto-created
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("thread_id", threadId);

    if (profileError) {
      console.error("Error checking profile:", profileError);
    } else {
      console.log("Profile auto-created?", profile.length > 0 ? "Yes" : "No");
      console.log("Profile data:", profile);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

testDirectMemoryInsertion();
