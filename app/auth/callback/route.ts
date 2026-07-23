import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// Handles Supabase's token-hash invite/recovery links. The invite email
// confirms the account and creates a session on click but does not set a
// password, so every successful exchange lands on /set-password rather than
// straight into the app.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      redirect("/set-password");
    }
  }

  redirect("/login?error=confirm_failed");
}
