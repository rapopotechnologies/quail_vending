"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { inviteSchema, type InviteValues } from "@/lib/validations/team";

async function requireSuperAdmin() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "super_admin") {
    throw new Error("Only a super admin can manage the team");
  }
  return profile;
}

// Invites always land as `staff` (the handle_new_user trigger's default) -
// super_admin is never grantable from the app. Promoting someone requires a
// manual, out-of-app operation (direct SQL/Supabase dashboard) so there's no
// in-product path to mint elevated access.
export async function inviteStaff(values: InviteValues) {
  await requireSuperAdmin();
  const parsed = inviteSchema.parse(values);

  const service = createSupabaseServiceClient();
  const { error } = await service.auth.admin.inviteUserByEmail(parsed.email);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/team");
}

// The only role change the app allows is revoking super_admin down to
// staff - never the reverse. See inviteStaff above for why.
export async function demoteToStaff(id: string) {
  const profile = await requireSuperAdmin();
  if (id === profile.id) {
    throw new Error("Can't change your own role here");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ role: "staff" }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/team");
}
