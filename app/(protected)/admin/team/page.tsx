import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamTable, type TeamMember } from "@/components/team/team-table";
import { InviteDialog } from "@/components/team/invite-dialog";

export default async function TeamPage() {
  const profile = await getCurrentProfile();

  if (profile?.role !== "super_admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Only a super admin can manage the team.
        </CardContent>
      </Card>
    );
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: profiles }, { data: usersPage }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").order("full_name"),
    createSupabaseServiceClient().auth.admin.listUsers({ perPage: 200 }),
  ]);

  const emailById = new Map(usersPage?.users.map((u) => [u.id, u.email ?? null]));
  const members: TeamMember[] = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    role: p.role as "super_admin" | "staff",
    email: emailById.get(p.id) ?? null,
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Team</CardTitle>
        <InviteDialog />
      </CardHeader>
      <CardContent>
        <TeamTable members={members} currentUserId={profile.id} />
      </CardContent>
    </Card>
  );
}
