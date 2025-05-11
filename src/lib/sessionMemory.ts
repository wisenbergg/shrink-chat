import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateUserProfile(
  threadId: string,
  data: { name?: string; emotionalTone?: string[]; concerns?: string[] }
): Promise<void> {
  const update = {
    thread_id: threadId,
    name: data.name ?? null,
    emotional_tone: data.emotionalTone ?? [],
    concerns: data.concerns ?? []
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(update, { onConflict: 'thread_id' });

  if (error) {
    console.error(`[Supabase] updateUserProfile failed:`, error);
    throw new Error('Failed to update profile');
  }
}

export async function markOnboardingComplete(threadId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('thread_id', threadId);

  if (error) {
    console.error(`[Supabase] markOnboardingComplete failed:`, error);
    throw new Error('Failed to complete onboarding');
  }
}

export interface UserProfile {
  thread_id: string;
  name?: string;
  emotional_tone?: string[];
  concerns?: string[];
  onboarding_complete?: boolean;
}

export async function getUserProfile(threadId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('thread_id', threadId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // "No rows returned"
      console.error(`[Supabase] getUserProfile failed:`, error);
    }
    return null;
  }

  return {
    thread_id: data.thread_id,
    name: data.name ?? undefined,
    emotional_tone: data.emotional_tone ?? [],
    concerns: data.concerns ?? [],
    onboarding_complete: data.onboarding_complete ?? false
  };
}

export async function getMemoryForSession(
  sessionId: string
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('thread_id', sessionId)
    .order('created_at');

  if (error) {
    console.error('[Supabase] getMemoryForSession failed:', error);
    return [];
  }

  return data as Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function getMemoryForThreads(
  threadId: string
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  // Aliased to same behavior — both use thread_id
  return getMemoryForSession(threadId);
    }
    
    export async function logMemoryTurn(
      threadId: string,
      role: 'user' | 'assistant',
      content: string
    ): Promise<void> {
      const { error } = await supabase
        .from('messages')
        .insert([{ thread_id: threadId, role, content }]);
    
      if (error) {
        console.error(`[Supabase] logMemoryTurn failed:`, error);
      }
    }

    export async function deleteMemoryForThread(threadId: string): Promise<void> {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('thread_id', threadId);
    
      if (error) {
        console.error(`[Supabase] Failed to delete memory for thread ${threadId}:`, error);
        throw new Error('Failed to delete memory');
      }
    }
    
    


