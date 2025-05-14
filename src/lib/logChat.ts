// src/lib/logChat.ts

import supabaseAdmin from '../utils/supabase/server';

export async function logChat(entry: {
  threadId: string;
  turn: number;
  role: 'user' | 'assistant';
  content: string;
}) {
  const { error } = await supabaseAdmin
    .from('messages')
    .insert({
      thread_id: entry.threadId,
      turn:       entry.turn,
      role:       entry.role,
      content:    entry.content
    });

  if (error) {
    console.error('❌ supabase logChat error:', {
      code:    error.code,
      message: error.message,
      details: error.details,
      hint:    error.hint
    });
    throw new Error('logChat failed: ' + error.message);
  }
}
