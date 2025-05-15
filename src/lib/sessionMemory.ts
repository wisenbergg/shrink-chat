// File: src/lib/sessionMemory.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabase: SupabaseClient

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
} else {
  console.warn(
    '[sessionMemory] Missing Supabase env vars – using stub client for tests'
  )

  // A standalone builder that supports .from(...).update(...).eq(...).select(), .single(), .insert(), .delete(), etc.
  const stubBuilder = {
    select: async () => ({ data: [], error: null }),
    single: async () => ({ data: null, error: null }),
    upsert: async () => ({ data: null, error: null }),
    insert: async () => ({ data: null, error: null }),
    update: () => {
      console.warn('[sessionMemory Stub] update() called')
      return stubBuilder
    },
    delete: () => {
      console.warn('[sessionMemory Stub] delete() called')
      return stubBuilder
    },
    eq: (col: string, val: unknown) => {
      console.warn(`[sessionMemory Stub] eq filter ${col} = ${val}`)
      return stubBuilder
    },
  }

  supabase = {
    from: (table: string) => {
      console.warn(`[sessionMemory Stub] from("${table}") called`)
      return stubBuilder
    },
  } as unknown as SupabaseClient
}

/** The shape of a user’s profile in Supabase */
export type UserProfile = {
  thread_id?: string
  name?: string
  emotionalTone?: string[]
  concerns?: string[]
  onboarding_complete?: boolean
}

/** The shape of a memory entry in Supabase */
export interface MemoryEntry {
  session_id: string
  role: string
  content: string
}

/** Insert or update a user profile record */
export async function updateUserProfile(
  threadId: string,
  profileData: Omit<UserProfile, 'thread_id'>
) {
  await supabase.from('profiles').upsert({ thread_id: threadId, ...profileData })
}

/** Mark the onboarding flag on a profile */
export async function markOnboardingComplete(threadId: string) {
  await supabase
    .from('profiles')
    .update({ onboarding_complete: true })
    .eq('thread_id', threadId)
}

/** Fetch a user’s full profile (or null if none) */
export async function getUserProfile(
  threadId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('thread_id', threadId)
    .single<UserProfile>()

  if (error) {
    console.error('[sessionMemory] getUserProfile error:', error)
    return null
  }
  return data
}

/** Retrieve all memory entries for a session */
export async function getMemoryForThreads(
  sessionId: string
): Promise<MemoryEntry[]> {
  const { data, error } = await supabase
    .from('memory')
    .select('*')
    .eq('session_id', sessionId)

  if (error) {
    console.error('[sessionMemory] getMemoryForThreads error:', error)
    return []
  }
  return data
}

/** Delete all memory entries for a session */
export async function deleteMemoryForThread(sessionId: string) {
  await supabase
    .from('memory')
    .delete()
    .eq('session_id', sessionId)
}

/** Log a single memory turn */
export async function logMemoryTurn(entry: {
  session_id: string
  role: string
  content: string
}) {
  await supabase.from('memory').insert(entry)
}
export { getMemoryForThreads as getMemoryForSession }