import type { SaleRecord } from "./types";

export function totalRevenue(sales: SaleRecord[]): number {
  return sales.reduce((sum, s) => sum + s.qty * s.unit_price, 0);
}

export function revenueSince(sales: SaleRecord[], sinceISO: string): number {
  const since = new Date(sinceISO).getTime();
  return totalRevenue(sales.filter((s) => new Date(s.sold_at).getTime() >= since));
}

export function revenueByMachine(sales: SaleRecord[]): { name: string; revenue: number }[] {
  const byMachine = new Map<string, number>();
  for (const s of sales) {
    byMachine.set(s.machine_name, (byMachine.get(s.machine_name) ?? 0) + s.qty * s.unit_price);
  }
  return Array.from(byMachine, ([name, revenue]) => ({ name, revenue })).sort(
    (a, b) => b.revenue - a.revenue
  );
}

export function revenueByProduct(
  sales: SaleRecord[]
): { name: string; revenue: number; qty: number }[] {
  const byProduct = new Map<string, { revenue: number; qty: number }>();
  for (const s of sales) {
    const existing = byProduct.get(s.product_name) ?? { revenue: 0, qty: 0 };
    byProduct.set(s.product_name, {
      revenue: existing.revenue + s.qty * s.unit_price,
      qty: existing.qty + s.qty,
    });
  }
  return Array.from(byProduct, ([name, v]) => ({ name, ...v })).sort(
    (a, b) => b.revenue - a.revenue
  );
}

// Units sold per day, per product, averaged over the span the given sales
// cover (oldest to newest sale in the array) - not a fixed window, so it
// tracks whatever range the caller already scoped `sales` to.
export function velocityByProduct(
  sales: SaleRecord[]
): { product_id: string; name: string; unitsPerDay: number }[] {
  if (sales.length === 0) return [];

  const times = sales.map((s) => new Date(s.sold_at).getTime());
  const spanDays = Math.max((Math.max(...times) - Math.min(...times)) / (1000 * 60 * 60 * 24), 1);

  const qtyByProduct = new Map<string, { name: string; qty: number }>();
  for (const s of sales) {
    const existing = qtyByProduct.get(s.product_id) ?? { name: s.product_name, qty: 0 };
    existing.qty += s.qty;
    qtyByProduct.set(s.product_id, existing);
  }

  return Array.from(qtyByProduct, ([product_id, v]) => ({
    product_id,
    name: v.name,
    unitsPerDay: v.qty / spanDays,
  }));
}

export function revenueByDay(sales: SaleRecord[]): { date: string; revenue: number }[] {
  const byDay = new Map<string, number>();
  for (const s of sales) {
    const date = s.sold_at.slice(0, 10);
    byDay.set(date, (byDay.get(date) ?? 0) + s.qty * s.unit_price);
  }
  return Array.from(byDay, ([date, revenue]) => ({ date, revenue })).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
