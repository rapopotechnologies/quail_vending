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
