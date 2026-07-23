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

export async function inviteStaff(values: InviteValues) {
  await requireSuperAdmin();
  const parsed = inviteSchema.parse(values);

  const service = createSupabaseServiceClient();
  const { data, error } = await service.auth.admin.inviteUserByEmail(parsed.email);
  if (error) throw new Error(error.message);

  if (parsed.role === "super_admin" && data.user) {
    const { error: roleError } = await service
      .from("profiles")
      .update({ role: "super_admin" })
      .eq("id", data.user.id);
    if (roleError) throw new Error(roleError.message);
  }

  revalidatePath("/admin/team");
}

export async function updateProfileRole(id: string, role: "staff" | "super_admin") {
  await requireSuperAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/team");
}
