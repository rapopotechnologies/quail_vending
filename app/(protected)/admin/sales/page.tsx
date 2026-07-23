import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleForm } from "@/components/sales/sale-form";
import { SalesLog, type SaleRow } from "@/components/sales/sales-log";

export default async function SalesPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: machines }, { data: products }, { data: rawSales }, profile] = await Promise.all([
    supabase.from("machines").select("*").order("name"),
    supabase.from("products").select("*").order("name"),
    supabase
      .from("sales")
      .select("id, qty, unit_price, sold_at, machines(name), products(name)")
      .order("sold_at", { ascending: false })
      .limit(50),
    getCurrentProfile(),
  ]);

  type RawSale = {
    id: string;
    qty: number;
    unit_price: number;
    sold_at: string;
    machines: { name: string } | null;
    products: { name: string } | null;
  };

  const sales: SaleRow[] = ((rawSales ?? []) as unknown as RawSale[]).map((s) => ({
    id: s.id,
    machine_name: s.machines?.name ?? "—",
    product_name: s.products?.name ?? "—",
    qty: s.qty,
    unit_price: s.unit_price,
    sold_at: s.sold_at,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log a sale</CardTitle>
        </CardHeader>
        <CardContent>
          <SaleForm machines={machines ?? []} products={products ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent sales</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesLog sales={sales} canDelete={profile?.role === "super_admin"} />
        </CardContent>
      </Card>
    </div>
  );
}
