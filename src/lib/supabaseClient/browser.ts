import { createClient } from "@supabase/supabase-js";

// Create a singleton instance for the browser client
let browserSupabaseClient: ReturnType<typeof createClient> | null = null;

export const createBrowserClient = () => {
  if (browserSupabaseClient) return browserSupabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  browserSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserSupabaseClient;
};
