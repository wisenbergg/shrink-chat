// src/lib/supabaseClient/server.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createServerClient(): SupabaseClient {
  // Choose local in dev, cloud in prod
  const supabaseUrl =
    process.env.NODE_ENV === 'development'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL!
      : process.env.SUPABASE_URL!;

  // Always use the service‐role key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Debug: confirm which URL/key prefix you’re using
  console.log(
    '[createServerClient]',
    'URL=', supabaseUrl,
    'KEY prefix=', supabaseKey.slice(0, 10)
  );

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}
