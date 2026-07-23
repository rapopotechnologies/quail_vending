import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MachinePicker } from "@/components/restock/machine-picker";
import { RestockForm, type RestockSlot } from "@/components/restock/restock-form";

export default async function RestockPage({
  searchParams,
}: {
  searchParams: Promise<{ machineId?: string }>;
}) {
  const { machineId } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: machines } = await supabase.from("machines").select("*").order("name");

  let slots: RestockSlot[] = [];
  if (machineId) {
    const { data: rawSlots } = await supabase
      .from("machine_slots")
      .select("*, products(name), stock_levels(current_qty)")
      .eq("machine_id", machineId)
      .order("slot_label");

    type RawSlot = {
      id: string;
      slot_label: string;
      capacity: number | null;
      par_level: number | null;
      products: { name: string } | null;
      // stock_levels.machine_slot_id is unique, so PostgREST embeds this as
      // a single object, not an array.
      stock_levels: { current_qty: number } | null;
    };

    slots = ((rawSlots ?? []) as unknown as RawSlot[]).map((s) => ({
      id: s.id,
      slot_label: s.slot_label,
      capacity: s.capacity,
      par_level: s.par_level,
      product_name: s.products?.name ?? null,
      current_qty: s.stock_levels?.current_qty ?? 0,
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <MachinePicker machines={machines ?? []} selectedId={machineId} />
        {machineId && <RestockForm machineId={machineId} slots={slots} />}
      </CardContent>
    </Card>
  );
}
