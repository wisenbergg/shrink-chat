// src/lib/logChat.ts

import { createServerClient } from "./supabaseClient/server"; // adjust path if needed

// Service‐role client for server‐side operations
const supabaseAdmin = createServerClient();

export async function logChat(entry: {
  threadId: string;
  turn: number;
  role: "user" | "assistant";
  content: string;
}): Promise<string> {
  // 1) Ensure the thread exists (so messages.thread_id FK is satisfied)
  const { error: threadError } = await supabaseAdmin
    .from("threads")
    .upsert({ id: entry.threadId }, { onConflict: "id" });
  if (threadError) {
    console.error("❌ supabase upsert thread error:", threadError);
    throw new Error("logChat failed: unable to create thread record");
  }

  // 2) Insert the chat turn into messages and return the ID
  const { data, error: msgError } = await supabaseAdmin
    .from("messages")
    .insert({
      thread_id: entry.threadId,
      turn: entry.turn,
      role: entry.role,
      content: entry.content,
    })
    .select("id")
    .single();

  if (msgError) {
    console.error("❌ supabase insert message error:", msgError);
    throw new Error(`logChat failed: ${msgError.message}`);
  }

  return data.id;
}
