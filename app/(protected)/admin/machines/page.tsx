import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MachinesTable } from "@/components/machines/machines-table";
import { MachineFormDialog } from "@/components/machines/machine-form-dialog";

export default async function MachinesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: machines }, profile] = await Promise.all([
    supabase.from("machines").select("*").order("name"),
    getCurrentProfile(),
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Machines</CardTitle>
        <MachineFormDialog />
      </CardHeader>
      <CardContent>
        <MachinesTable
          machines={machines ?? []}
          canDelete={profile?.role === "super_admin"}
        />
      </CardContent>
    </Card>
  );
}
