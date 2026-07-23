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
