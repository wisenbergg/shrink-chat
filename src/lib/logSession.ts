// File: src/lib/logSession.ts
import supabaseAdmin from '../utils/supabase/server';

export interface SessionEntry {
  session_id: string;
  prompt: string;
  response: string;
  model?: string;
  signal?: string;
  recallUsed: boolean;
}

/**
 * Logs a session entry into session_logs with retries, and on final failure
 * writes the entry into session_logs_dead_letter table.
 */
export async function logSessionEntry(entry: SessionEntry) {
  const maxAttempts = 3;
  let attempt = 0;
  let lastError: string | null = null;

  while (attempt < maxAttempts) {
    const { error } = await supabaseAdmin
      .from('session_logs')
      .insert({
        session_id: entry.session_id,
        prompt:      entry.prompt,
        response:    entry.response,
        model:       entry.model,
        signal:      entry.signal,
        recallused:  entry.recallUsed
      });

    if (!error) return; // successful write

    attempt++;
    lastError = error.message;
    console.error(`❌ Attempt ${attempt} failed to log session entry:`, error);
    await new Promise(res => setTimeout(res, 100 * 2 ** (attempt - 1)));
  }

  // After retries, write to dead‑letter table
  const { error: dlError } = await supabaseAdmin
    .from('session_logs_dead_letter')
    .insert({
      session_id: entry.session_id,
      prompt:      entry.prompt,
      response:    entry.response,
      model:       entry.model,
      signal:      entry.signal,
      recallused:  entry.recallUsed,
      attempts:    maxAttempts,
      last_error:  lastError ?? 'unknown error'
    });

  if (dlError) console.error('💀 Failed to write dead-letter entry:', dlError);
}
