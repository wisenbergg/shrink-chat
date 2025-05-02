// src/lib/logChat.ts

import supabaseAdmin from '../utils/supabase/server';


export async function logChat(entry: {
  threadId: string;
  turn: number;
  role: 'user' | 'assistant';
  content: string;
}) {
  const { error } = await supabaseAdmin
    .from('chat_logs')
    .insert({
      thread_id: entry.threadId,
      turn: entry.turn,
      role: entry.role,
      content: entry.content
    });

  if (error) {
    console.error('❌ supabase logChat error:', error);
    throw new Error('logChat failed');
  }
}
