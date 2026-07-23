"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { restockEventSchema, type RestockEventValues } from "@/lib/validations/restock";

export async function createRestockEvent(machineId: string, values: RestockEventValues) {
  const parsed = restockEventSchema.parse(values);
  const itemsToApply = parsed.items.filter((i) => i.qty_added > 0);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event, error: eventError } = await supabase
    .from("restock_events")
    .insert({
      machine_id: machineId,
      performed_by: user?.id ?? null,
      notes: parsed.notes || null,
    })
    .select("id")
    .single();

  if (eventError) throw new Error(eventError.message);

  const { error: itemsError } = await supabase.from("restock_event_items").insert(
    itemsToApply.map((item) => ({
      restock_event_id: event.id,
      machine_slot_id: item.machine_slot_id,
      qty_added: item.qty_added,
    }))
  );

  if (itemsError) throw new Error(itemsError.message);

  for (const item of itemsToApply) {
    const { data: stockLevel } = await supabase
      .from("stock_levels")
      .select("current_qty")
      .eq("machine_slot_id", item.machine_slot_id)
      .single();

    const { error: stockError } = await supabase
      .from("stock_levels")
      .update({
        current_qty: (stockLevel?.current_qty ?? 0) + item.qty_added,
        last_counted_at: new Date().toISOString(),
      })
      .eq("machine_slot_id", item.machine_slot_id);

    if (stockError) throw new Error(stockError.message);
  }

  // Filling a machine slot draws from the bulk stock already on hand, so
  // reduce warehouse_qty for each product involved by the total qty used.
  const { data: slots } = await supabase
    .from("machine_slots")
    .select("id, product_id")
    .in(
      "id",
      itemsToApply.map((i) => i.machine_slot_id)
    );

  const qtyByProduct = new Map<string, number>();
  for (const item of itemsToApply) {
    const productId = slots?.find((s) => s.id === item.machine_slot_id)?.product_id;
    if (!productId) continue;
    qtyByProduct.set(productId, (qtyByProduct.get(productId) ?? 0) + item.qty_added);
  }

  for (const [productId, qtyUsed] of qtyByProduct) {
    const { data: product } = await supabase
      .from("products")
      .select("warehouse_qty")
      .eq("id", productId)
      .single();

    const { error: warehouseError } = await supabase
      .from("products")
      .update({ warehouse_qty: Math.max(0, (product?.warehouse_qty ?? 0) - qtyUsed) })
      .eq("id", productId);

    if (warehouseError) throw new Error(warehouseError.message);
  }

  revalidatePath("/admin/restock");
  revalidatePath(`/admin/machines/${machineId}`);
  revalidatePath("/admin/products");
}
