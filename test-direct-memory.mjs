// test-direct-memory.mjs
import { createClient } from "@supabase/supabase-js";

// Create a minimal Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMemoryRPC() {
  try {
    const threadId = "test-thread-" + Date.now();

    console.log(`Testing memory RPC with threadId: ${threadId}`);

    // Test the get_relevant_memories RPC
    const { data, error } = await supabase.rpc("get_relevant_memories", {
      p_user_id: threadId,
      p_embedding: JSON.stringify(Array(1536).fill(0.1)), // Mock embedding
      p_threshold: 0.5,
      p_limit: 5,
    });

    if (error) {
      console.error("RPC Error:", error);
    } else {
      console.log("RPC Success. Data:", data);
    }
  } catch (err) {
    console.error("General error:", err);
  }
}

testMemoryRPC();
