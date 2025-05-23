// File: src/utils/actions.ts
'use server'

import { createServerClient } from '@/lib/supabaseClient/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

const UID_COOKIE = 'sw_uid'
const COOKIE_OPTS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30 // 30 days
}

/*──────────────── helper ────────────────*/
async function ensureRows(id: string) {
  const supabase = createServerClient()
  await supabase.from('users').upsert({ id }, { onConflict: 'id' })
  await supabase.from('threads').upsert({ id }, { onConflict: 'id' })
  await supabase.from('profiles').upsert(
    { thread_id: id, onboarding_complete: false },
    { onConflict: 'thread_id' }
  )
  await supabase.from('onboarding_progress').upsert(
    { user_id: id, current_step: 1 },
    { onConflict: 'user_id' }
  )
}

/*──────────────── getUserId ──────────────*/
export async function getUserId(): Promise<string> {
  // `cookies()` typing is flaky across Next versions – cast to any
  const store: any = cookies() as any
  let id = store.get?.(UID_COOKIE)?.value ?? null

  if (!id) {
    id = uuidv4()
    store.set?.(UID_COOKIE, id, COOKIE_OPTS) // sets Set-Cookie header
    await ensureRows(id)
  }
  return id
}

/*───────── onboarding helpers ─────────*/
export async function updateOnboardingProgress(
  step: number,
  response?: string
): Promise<boolean> {
  try {
    const userId = await getUserId()
    const supabase = createServerClient()

    await supabase
      .from('onboarding_progress')
      .upsert(
        {
          user_id: userId,
          current_step: step + 1,
          [`step${step}_completed_at`]: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )

    if (response) {
      await supabase.from('onboarding_responses').insert({
        user_id: userId,
        step_number: step,
        response
      })
    }

    revalidatePath('/onboarding/welcome')
    revalidatePath('/onboarding/privacy')
    revalidatePath('/onboarding/choose-mode')
    return true
  } catch (err) {
    console.error('updateOnboardingProgress error:', err)
    return false
  }
}

export async function getOnboardingProgress() {
  try {
    const userId = await getUserId()
    const supabase = createServerClient()
    const { data } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data
  } catch (err) {
    console.error('getOnboardingProgress error:', err)
    return null
  }
}

export async function completeOnboarding(): Promise<void> {
  const ok = await updateOnboardingProgress(3)
  if (ok) redirect('/')
}