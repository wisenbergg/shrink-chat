// src/lib/logSession.ts

import supabaseAdmin from '../utils/supabase/server';

export interface SessionEntry {
  session_id: string;
  timestamp: number;
  prompt: string;
  response: string;
  model?: string;
  signal?: string;
  recallUsed: boolean;    // your code uses camelCase
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
      recallused:  entry.recallUsed   // ← map to lowercase column
    });

  if (error) {
    console.error('❌ Failed to log session entry:', error);
  }
}
