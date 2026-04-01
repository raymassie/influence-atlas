import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client using the service role key.
// This bypasses Row Level Security and must NEVER be imported in client components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
