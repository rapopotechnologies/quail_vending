import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductsView } from "@/components/products/products-view";
import { ProductFormDialog } from "@/components/products/product-form-dialog";

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: products }, { data: rawSlots }, profile] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase
      .from("machine_slots")
      .select("product_id, stock_levels(current_qty)")
      .not("product_id", "is", null),
    getCurrentProfile(),
  ]);

  type RawSlot = {
    product_id: string;
    stock_levels: { current_qty: number } | null;
  };

  const inMachinesByProduct: Record<string, number> = {};
  for (const s of (rawSlots ?? []) as unknown as RawSlot[]) {
    inMachinesByProduct[s.product_id] =
      (inMachinesByProduct[s.product_id] ?? 0) + (s.stock_levels?.current_qty ?? 0);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Products</CardTitle>
        <ProductFormDialog />
      </CardHeader>
      <CardContent>
        <ProductsView
          products={products ?? []}
          inMachinesByProduct={inMachinesByProduct}
          canDelete={profile?.role === "super_admin"}
        />
      </CardContent>
    </Card>
  );
}
