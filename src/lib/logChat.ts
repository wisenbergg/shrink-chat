// src/lib/logChat.ts

import supabaseAdmin from '../utils/supabase/server';

export async function logChat(entry: {
  threadId: string;
  turn: number;
  role: 'user' | 'assistant';
  content: string;
}) {
  // 1) Ensure there is a threads row with this id
  const { error: threadError } = await supabaseAdmin
    .from('threads')
    .upsert(
      {
        id: entry.threadId,
        // — if you also want to fill session_id, uncomment the next line:
        // session_id: entry.threadId,
      },
      { onConflict: 'id' }
    );

  if (threadError) {
    console.error('❌ supabase upsert thread error:', threadError);
    throw new Error('logChat failed: unable to create thread record');
  }

  // 2) Insert the new message into `messages`
  const { error: msgError } = await supabaseAdmin
    .from('messages')
    .insert({
      thread_id: entry.threadId,
      turn: entry.turn,
      role: entry.role,
      content: entry.content,
    });

  if (msgError) {
    console.error('❌ supabase logChat error:', msgError);
    throw new Error(`logChat failed: ${msgError.message}`);
  }
}
