import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Service role key, bypasses RLS. Use only in webhook handlers, admin
// invite/user-management operations, and cron jobs where there is no user
// session. Never import into a Client Component.
export function createSupabaseServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
