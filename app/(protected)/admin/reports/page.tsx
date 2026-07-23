import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchLowBulkStockProducts,
  fetchLowStockSlots,
  fetchSalesWithNames,
} from "@/lib/reports/queries";
import { revenueByMachine, revenueByProduct } from "@/lib/reports/aggregate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueBarChart } from "@/components/reports/revenue-bar-chart";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { LowStockList } from "@/components/dashboard/low-stock-list";

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();

  const [sales, slots, bulkProducts] = await Promise.all([
    fetchSalesWithNames(supabase),
    fetchLowStockSlots(supabase),
    fetchLowBulkStockProducts(supabase),
  ]);

  const byMachine = revenueByMachine(sales);
  const byProduct = revenueByProduct(sales).slice(0, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Restock due</CardTitle>
        </CardHeader>
        <CardContent>
          <LowStockList slots={slots} bulkProducts={bulkProducts} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueBarChart
          title="Revenue by machine"
          description="All-time revenue per machine"
          data={byMachine}
        />
        <RevenueBarChart
          title="Top sellers"
          description="All-time revenue by product (top 10)"
          data={byProduct.map((p) => ({ name: p.name, revenue: p.revenue }))}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>All sales</CardTitle>
          <ExportCsvButton sales={sales} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {sales.length} sale{sales.length === 1 ? "" : "s"} recorded. Export downloads the full
            history as CSV.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
