// src/utils/supabase/server.ts

import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Default export so this file is always treated as an ES module
export default supabaseAdmin;

