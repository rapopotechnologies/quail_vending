"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productSchema, type ProductValues } from "@/lib/validations/product";

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
