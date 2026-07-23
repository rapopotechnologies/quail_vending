"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productSchema, type ProductValues } from "@/lib/validations/product";
import { recordPurchaseSchema, type RecordPurchaseValues } from "@/lib/validations/purchase";

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
