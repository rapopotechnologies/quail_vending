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
import { DateRangeSelect } from "@/components/reports/date-range-select";
import { RANGE_OPTIONS, type RangeValue } from "@/lib/reports/date-range";
import { LowStockList } from "@/components/dashboard/low-stock-list";

function sinceISOForRange(range: RangeValue): string | undefined {
  if (range === "all") return undefined;
  const days = { "7d": 7, "30d": 30, "90d": 90 }[range];
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range: RangeValue = RANGE_OPTIONS.some((o) => o.value === searchParams.range)
    ? (searchParams.range as RangeValue)
    : "90d";

  const supabase = await createSupabaseServerClient();

  const [sales, slots, bulkProducts] = await Promise.all([
    fetchSalesWithNames(supabase, sinceISOForRange(range)),
    fetchLowStockSlots(supabase),
    fetchLowBulkStockProducts(supabase),
  ]);

  const byMachine = revenueByMachine(sales);
  const byProduct = revenueByProduct(sales).slice(0, 10);
  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "";

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

      <div className="flex justify-end">
        <DateRangeSelect value={range} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueBarChart
          title="Revenue by machine"
          description={`${rangeLabel} revenue per machine`}
          data={byMachine}
        />
        <RevenueBarChart
          title="Top sellers"
          description={`${rangeLabel} revenue by product (top 10)`}
          data={byProduct.map((p) => ({ name: p.name, revenue: p.revenue }))}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Sales — {rangeLabel}</CardTitle>
          <ExportCsvButton sales={sales} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {sales.length} sale{sales.length === 1 ? "" : "s"} in this range. Export downloads
            exactly what&apos;s shown here as CSV — switch the range above to export a different
            window.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
