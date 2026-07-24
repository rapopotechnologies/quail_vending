import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Activity, ExpiringLot, LowBulkStockProduct, SaleRecord } from "./types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function fetchSalesWithNames(
  supabase: SupabaseServerClient,
  sinceISO?: string
): Promise<SaleRecord[]> {
  let query = supabase
    .from("sales")
    .select("id, qty, unit_price, sold_at, machine_id, product_id, machines(name), products(name)")
    .order("sold_at", { ascending: false });

  if (sinceISO) {
    query = query.gte("sold_at", sinceISO);
  }

  const { data } = await query;

  type RawSale = {
    id: string;
    qty: number;
    unit_price: number;
    sold_at: string;
    machine_id: string;
    product_id: string;
    machines: { name: string } | null;
    products: { name: string } | null;
  };

  return ((data ?? []) as unknown as RawSale[]).map((s) => ({
    id: s.id,
    qty: s.qty,
    unit_price: s.unit_price,
    sold_at: s.sold_at,
    machine_id: s.machine_id,
    machine_name: s.machines?.name ?? "—",
    product_id: s.product_id,
    product_name: s.products?.name ?? "—",
  }));
}

export async function fetchLowBulkStockProducts(
  supabase: SupabaseServerClient
): Promise<LowBulkStockProduct[]> {
  const { data } = await supabase.from("products").select("id, name, warehouse_qty, warehouse_par_level");

  type RawProduct = {
    id: string;
    name: string;
    warehouse_qty: number;
    warehouse_par_level: number | null;
  };

  // A product with no par level set uses an implicit threshold of 0 - flag
  // it only once it's truly out, same fallback as the products.status
  // auto-sync trigger (see migration 009_default_par_level_zero.sql).
  return ((data ?? []) as unknown as RawProduct[]).filter(
    (p) => p.warehouse_qty <= (p.warehouse_par_level ?? 0)
  );
}

export async function fetchWarehouseQtyByProduct(
  supabase: SupabaseServerClient
): Promise<Record<string, number>> {
  const { data } = await supabase.from("products").select("id, warehouse_qty");

  type RawProduct = { id: string; warehouse_qty: number };

  const result: Record<string, number> = {};
  for (const p of (data ?? []) as unknown as RawProduct[]) {
    result[p.id] = p.warehouse_qty;
  }
  return result;
}

export async function fetchExpiringLots(
  supabase: SupabaseServerClient,
  withinDays = 30
): Promise<ExpiringLot[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + withinDays);

  const { data } = await supabase
    .from("product_lots")
    .select("id, product_id, qty, expiry_date, products(name)")
    .gt("qty", 0)
    .lte("expiry_date", cutoff.toISOString().slice(0, 10))
    .order("expiry_date", { ascending: true });

  type RawLot = {
    id: string;
    product_id: string;
    qty: number;
    expiry_date: string;
    products: { name: string } | null;
  };

  return ((data ?? []) as unknown as RawLot[]).map((l) => ({
    id: l.id,
    product_id: l.product_id,
    product_name: l.products?.name ?? "—",
    qty: l.qty,
    expiry_date: l.expiry_date,
  }));
}

export async function fetchRecentActivity(
  supabase: SupabaseServerClient,
  limit = 10
): Promise<Activity[]> {
  const { data: sales } = await supabase
    .from("sales")
    .select("id, qty, sold_at, machines(name), products(name)")
    .order("sold_at", { ascending: false })
    .limit(limit);

  type RawSale = {
    id: string;
    qty: number;
    sold_at: string;
    machines: { name: string } | null;
    products: { name: string } | null;
  };

  return ((sales ?? []) as unknown as RawSale[]).map((s) => ({
    id: s.id,
    type: "sale",
    machine_name: s.machines?.name ?? "—",
    product_name: s.products?.name ?? "—",
    qty: s.qty,
    at: s.sold_at,
  }));
}
