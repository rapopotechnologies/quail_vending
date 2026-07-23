import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsTable } from "@/components/leads/leads-table";

export default async function LeadsPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: inquiries }, profile] = await Promise.all([
    supabase.from("partner_inquiries").select("*").order("created_at", { ascending: false }),
    getCurrentProfile(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <LeadsTable inquiries={inquiries ?? []} canDelete={profile?.role === "super_admin"} />
      </CardContent>
    </Card>
  );
}
