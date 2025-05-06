import { supabaseAdmin } from '@/utils/supabase/server';

export interface MemoryTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatLogRow {
  role: 'user' | 'assistant';
  content: string;
  created_at: number;
}

export async function getMemoryForSession(
  sessionId: string,
  limit = 10
): Promise<MemoryTurn[]> {
  const { data, error } = await supabaseAdmin
    .from('chat_logs')
    .select('content,created_at,role')
    .eq('thread_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit * 2); // double to cover both roles

  if (error) {
    console.error('❌ supabase getMemoryForSession error:', error);
    return [];
  }

  console.log(`🔍 Fetching memory for sessionId=${sessionId}, got ${data?.length || 0} rows`);

  const turns: MemoryTurn[] = (data as ChatLogRow[]).map(row => ({
    role: row.role,
    content: row.content,
    timestamp: row.created_at
  }));

  return turns;
}

export async function getMemoryForThreads(
  threadIds: string[],
  limitPerThread = 5
): Promise<MemoryTurn[]> {
  let all: MemoryTurn[] = [];
  for (const id of threadIds) {
    const mem = await getMemoryForSession(id, limitPerThread);
    all = all.concat(mem);
  }
  // Sort everything chronologically across threads
  return all.sort((a, b) => a.timestamp - b.timestamp);
}
