// src/lib/sessionMemory.ts
import { supabaseAdmin } from '@/utils/supabase/server';

export interface MemoryTurn {
  prompt: string;
  response: string;
  timestamp: number;
}

// single‑thread fetch
export async function getMemoryForSession(
  sessionId: string,
  limit = 10
): Promise<MemoryTurn[]> {
  const { data, error } = await supabaseAdmin
    .from('chat_logs')
    .select('content,created_at,role')
    .eq('thread_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('❌ supabase getMemoryForSession error:', error);
    return [];
  }
  // transform into MemoryTurn pairs (user then assistant)
  const turns: MemoryTurn[] = [];
  for (const row of data) {
    if (row.role === 'user') {
      turns.push({ prompt: row.content, response: '', timestamp: row.created_at });
    } else {
      const last = turns[turns.length - 1];
      if (last) last.response = row.content;
    }
  }
  return turns;
}

// multi‑thread fetch
export async function getMemoryForThreads(
  threadIds: string[],
  limitPerThread = 5
): Promise<MemoryTurn[]> {
  let all: MemoryTurn[] = [];
  for (const id of threadIds) {
    const mem = await getMemoryForSession(id, limitPerThread);
    all = all.concat(mem);
  }
  return all.sort((a, b) => a.timestamp - b.timestamp);
}
