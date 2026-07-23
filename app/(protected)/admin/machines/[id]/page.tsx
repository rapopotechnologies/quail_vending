import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlotsTable, type SlotWithStock } from "@/components/machines/slots-table";
import { SlotFormDialog } from "@/components/machines/slot-form-dialog";

export default async function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: machine }, { data: slots }, { data: products }, profile] = await Promise.all([
    supabase.from("machines").select("*").eq("id", id).single(),
    supabase
      .from("machine_slots")
      .select("*, products(name), stock_levels(current_qty)")
      .eq("machine_id", id)
      .order("slot_label"),
    supabase.from("products").select("*").order("name"),
    getCurrentProfile(),
  ]);

  if (!machine) notFound();

  type RawSlot = Record<string, unknown> & {
    products: { name: string } | null;
    stock_levels: { current_qty: number }[];
  };

  const enrichedSlots: SlotWithStock[] = ((slots ?? []) as unknown as RawSlot[]).map((s) => {
    const { products, stock_levels, ...rest } = s;
    return {
      ...(rest as unknown as SlotWithStock),
      product_name: products?.name ?? null,
      current_qty: stock_levels?.[0]?.current_qty ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/machines">← Machines</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {machine.name}
            <Badge variant={machine.status === "active" ? "default" : "secondary"}>
              {machine.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {machine.location || "No location set"}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Slots</CardTitle>
          <SlotFormDialog machineId={machine.id} products={products ?? []} />
        </CardHeader>
        <CardContent>
          <SlotsTable
            machineId={machine.id}
            slots={enrichedSlots}
            products={products ?? []}
            canDelete={profile?.role === "super_admin"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
