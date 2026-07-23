import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchExpiringLots,
  fetchLowBulkStockProducts,
  fetchLowStockSlots,
  fetchRecentActivity,
  fetchSalesWithNames,
} from "@/lib/reports/queries";
import { revenueSince, totalRevenue } from "@/lib/reports/aggregate";
import { RevenueSummaryCards } from "@/components/dashboard/revenue-summary-cards";
import { LowStockList } from "@/components/dashboard/low-stock-list";
import { ExpiringSoonList } from "@/components/dashboard/expiring-soon-list";
import { RecentActivity } from "@/components/dashboard/recent-activity";

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [sales, slots, bulkProducts, expiringLots, activity] = await Promise.all([
    fetchSalesWithNames(supabase),
    fetchLowStockSlots(supabase),
    fetchLowBulkStockProducts(supabase),
    fetchExpiringLots(supabase),
    fetchRecentActivity(supabase, 10),
  ]);

  const todayISO = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  return (
    <div className="space-y-6">
      <RevenueSummaryCards
        today={revenueSince(sales, todayISO)}
        last7Days={revenueSince(sales, daysAgoISO(7))}
        last30Days={revenueSince(sales, daysAgoISO(30))}
        allTime={totalRevenue(sales)}
      />
      <LowStockList slots={slots} bulkProducts={bulkProducts} limit={8} />
      <ExpiringSoonList lots={expiringLots} limit={8} />
      <RecentActivity activity={activity} />
    </div>
  );
}
