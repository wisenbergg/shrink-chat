// src/lib/logSession.ts

import supabaseAdmin from '../utils/supabase/server';

export interface SessionEntry {
  session_id: string;
  timestamp: number;
  prompt: string;
  response: string;
  model?: string;
  signal?: string;
  recallUsed: boolean;
}

export async function logSessionEntry(entry: SessionEntry) {
  const { error } = await supabaseAdmin
    .from('session_logs')
    .insert({
      session_id: entry.session_id,
      timestamp:   entry.timestamp,
      prompt:      entry.prompt,
      response:    entry.response,
      model:       entry.model,
      signal:      entry.signal,
      recallUsed:  entry.recallUsed
    });

  if (error) {
    console.error('❌ Failed to log session entry:', error);
  }
}
