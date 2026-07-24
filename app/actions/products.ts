"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productSchema, type ProductValues } from "@/lib/validations/product";
import { recordPurchaseSchema, type RecordPurchaseValues } from "@/lib/validations/purchase";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// Draws down product_lots oldest-expiry-first (FIFO) to match a warehouse_qty
// reduction of `qty`. Lots that hit 0 are deleted rather than left as
// zero-qty rows. Pre-migration warehouse_qty has no backing lots, so this is
// a best-effort sync - if there isn't enough lot qty on record, it just
// drains what exists and stops (warehouse_qty is still the source of truth
// for the aggregate number; lots only track expiry).
async function consumeLotsFifo(supabase: SupabaseServerClient, productId: string, qty: number) {
  let remaining = qty;
  const { data: lots } = await supabase
    .from("product_lots")
    .select("id, qty")
    .eq("product_id", productId)
    .order("expiry_date", { ascending: true });

  for (const lot of lots ?? []) {
    if (remaining <= 0) break;
    const used = Math.min(lot.qty, remaining);
    remaining -= used;
    const newQty = lot.qty - used;
    if (newQty <= 0) {
      await supabase.from("product_lots").delete().eq("id", lot.id);
    } else {
      await supabase.from("product_lots").update({ qty: newQty }).eq("id", lot.id);
    }
  }
}

function normalize(values: ProductValues) {
  return {
    ...values,
    item_id: values.item_id || null,
    category: values.category || null,
    source_vendor: values.source_vendor || null,
    product_url: values.product_url || null,
    notes: values.notes || null,
  };
}

export async function createProduct(values: ProductValues) {
  const parsed = productSchema.parse(values);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").insert(normalize(parsed));

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

export async function updateProduct(id: string, values: ProductValues) {
  const parsed = productSchema.parse(values);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").update(normalize(parsed)).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

export async function bulkUpdateParLevel(ids: string[], parLevel: number) {
  if (ids.length === 0) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("products")
    .update({ warehouse_par_level: parLevel })
    .in("id", ids);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

// Logs a bulk purchase (e.g. a Costco run) by adding to warehouse_qty and
// recording a lot (product_lots) with this purchase's expiry date, so the
// batch can be tracked and drawn down oldest-expiry-first later.
export async function recordPurchase(productId: string, values: RecordPurchaseValues) {
  const parsed = recordPurchaseSchema.parse(values);
  const supabase = await createSupabaseServerClient();

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("warehouse_qty")
    .eq("id", productId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase
    .from("products")
    .update({ warehouse_qty: (product?.warehouse_qty ?? 0) + parsed.qty })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  const { error: lotError } = await supabase.from("product_lots").insert({
    product_id: productId,
    qty: parsed.qty,
    expiry_date: parsed.expiry_date,
  });

  if (lotError) throw new Error(lotError.message);
  revalidatePath("/admin/products");
}

// Plain inventory consumption - stock leaving for any reason (sold, expired,
// damaged, moved to a machine, whatever). No price/sales concept - this app
// only tracks what was bought and what's left, not revenue. Draws down
// product_lots FIFO by the same qty subtracted from warehouse_qty.
export async function removeStock(productId: string, qty: number) {
  if (qty <= 0) throw new Error("Qty must be at least 1");

  const supabase = await createSupabaseServerClient();

  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("warehouse_qty")
    .eq("id", productId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const currentQty = product?.warehouse_qty ?? 0;
  if (qty > currentQty) throw new Error(`Only ${currentQty} in stock`);

  const { error } = await supabase
    .from("products")
    .update({ warehouse_qty: currentQty - qty })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  await consumeLotsFifo(supabase, productId, qty);

  revalidatePath("/admin/products");
}
