import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductsView } from "@/components/products/products-view";
import { ProductFormDialog } from "@/components/products/product-form-dialog";

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: products }, { data: machines }, profile] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("machines").select("*").order("name"),
    getCurrentProfile(),
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Products</CardTitle>
        <ProductFormDialog />
      </CardHeader>
      <CardContent>
        <ProductsView
          products={products ?? []}
          machines={machines ?? []}
          canDelete={profile?.role === "super_admin"}
        />
      </CardContent>
    </Card>
  );
}
