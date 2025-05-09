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
    .limit(limit * 2);

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
  return all.sort((a, b) => a.timestamp - b.timestamp);
}

export interface UserProfile {
  name?: string;
  emotionalTone?: string[];
  concerns?: string[];
  onboardingComplete?: boolean;
}

const userProfiles: Record<string, UserProfile> = {};

export function updateUserProfile(threadId: string, profile: UserProfile) {
  if (!userProfiles[threadId]) {
    userProfiles[threadId] = {};
  }
  userProfiles[threadId] = { ...userProfiles[threadId], ...profile };
}

export function getUserProfile(threadId: string): UserProfile | undefined {
  return userProfiles[threadId];
}

export function markOnboardingComplete(threadId: string) {
  if (!userProfiles[threadId]) {
    userProfiles[threadId] = {};
  }
  userProfiles[threadId].onboardingComplete = true;
}
