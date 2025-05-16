// File: src/utils/supabase/server.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export function createServerClient(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
