"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saleSchema, type SaleValues } from "@/lib/validations/sale";

export async function createSale(values: SaleValues) {
  const parsed = saleSchema.parse(values);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("sales").insert({
    machine_id: parsed.machine_id,
    product_id: parsed.product_id,
    qty: parsed.qty,
    unit_price: parsed.unit_price,
    entered_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales");
}

export async function deleteSale(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sales").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/sales");
}

// Logs items taken out of a machine slot as a sale in one step. There's no
// POS API to pull real sale events from (the vending hardware's own
// software - Micromart - tracks that, but has no API yet), so this is the
// stand-in: staff note how many are gone next time they're at the machine,
// and that subtraction *is* the sale record, at the product's current
// sell_price. Avoids maintaining stock counts and sales figures separately.
export async function logSlotSale(machineId: string, slotId: string, qty: number) {
  if (qty <= 0) throw new Error("Qty must be at least 1");

  const supabase = await createSupabaseServerClient();

  const { data: slot, error: slotError } = await supabase
    .from("machine_slots")
    .select("product_id, stock_levels(current_qty)")
    .eq("id", slotId)
    .single();

  if (slotError) throw new Error(slotError.message);
  if (!slot?.product_id) throw new Error("This slot has no product assigned");

  const currentQty = (slot.stock_levels as unknown as { current_qty: number } | null)?.current_qty ?? 0;
  if (qty > currentQty) throw new Error(`Only ${currentQty} in stock for this slot`);

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("sell_price")
    .eq("id", slot.product_id)
    .single();

  if (productError) throw new Error(productError.message);

  const { error: stockError } = await supabase
    .from("stock_levels")
    .update({ current_qty: currentQty - qty, last_counted_at: new Date().toISOString() })
    .eq("machine_slot_id", slotId);

  if (stockError) throw new Error(stockError.message);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: saleError } = await supabase.from("sales").insert({
    machine_id: machineId,
    product_id: slot.product_id,
    qty,
    unit_price: product?.sell_price ?? 0,
    entered_by: user?.id ?? null,
  });

  if (saleError) throw new Error(saleError.message);

  revalidatePath(`/admin/machines/${machineId}`);
  revalidatePath("/admin/sales");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/reports");
}
