import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Activity,
  ExpiringLot,
  LowBulkStockProduct,
  LowStockSlot,
  SaleRecord,
} from "./types";

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

export async function fetchLowStockSlots(supabase: SupabaseServerClient): Promise<LowStockSlot[]> {
  const { data } = await supabase
    .from("machine_slots")
    .select("id, slot_label, machine_id, par_level, machines(name), products(name), stock_levels(current_qty)")
    .not("par_level", "is", null);

  type RawSlot = {
    id: string;
    slot_label: string;
    machine_id: string;
    par_level: number | null;
    machines: { name: string } | null;
    products: { name: string } | null;
    stock_levels: { current_qty: number } | null;
  };

  return ((data ?? []) as unknown as RawSlot[])
    .map((s) => ({
      id: s.id,
      slot_label: s.slot_label,
      machine_id: s.machine_id,
      machine_name: s.machines?.name ?? "—",
      product_name: s.products?.name ?? null,
      current_qty: s.stock_levels?.current_qty ?? 0,
      par_level: s.par_level as number,
    }))
    .filter((s) => s.current_qty <= s.par_level);
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

export async function fetchTotalOnHandByProduct(
  supabase: SupabaseServerClient
): Promise<Record<string, { name: string; totalOnHand: number }>> {
  const [{ data: products }, { data: rawSlots }] = await Promise.all([
    supabase.from("products").select("id, name, warehouse_qty"),
    supabase
      .from("machine_slots")
      .select("product_id, stock_levels(current_qty)")
      .not("product_id", "is", null),
  ]);

  type RawProduct = { id: string; name: string; warehouse_qty: number };
  type RawSlot = { product_id: string; stock_levels: { current_qty: number } | null };

  const inMachinesByProduct: Record<string, number> = {};
  for (const s of (rawSlots ?? []) as unknown as RawSlot[]) {
    inMachinesByProduct[s.product_id] =
      (inMachinesByProduct[s.product_id] ?? 0) + (s.stock_levels?.current_qty ?? 0);
  }

  const result: Record<string, { name: string; totalOnHand: number }> = {};
  for (const p of (products ?? []) as unknown as RawProduct[]) {
    result[p.id] = {
      name: p.name,
      totalOnHand: p.warehouse_qty + (inMachinesByProduct[p.id] ?? 0),
    };
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
  const [{ data: restocks }, { data: sales }] = await Promise.all([
    supabase
      .from("restock_events")
      .select("id, notes, performed_at, machines(name)")
      .order("performed_at", { ascending: false })
      .limit(limit),
    supabase
      .from("sales")
      .select("id, qty, sold_at, machines(name), products(name)")
      .order("sold_at", { ascending: false })
      .limit(limit),
  ]);

  type RawRestock = {
    id: string;
    notes: string | null;
    performed_at: string;
    machines: { name: string } | null;
  };
  type RawSale = {
    id: string;
    qty: number;
    sold_at: string;
    machines: { name: string } | null;
    products: { name: string } | null;
  };

  const restockActivity: Activity[] = ((restocks ?? []) as unknown as RawRestock[]).map((r) => ({
    id: r.id,
    type: "restock",
    machine_name: r.machines?.name ?? "—",
    notes: r.notes,
    at: r.performed_at,
  }));

  const saleActivity: Activity[] = ((sales ?? []) as unknown as RawSale[]).map((s) => ({
    id: s.id,
    type: "sale",
    machine_name: s.machines?.name ?? "—",
    product_name: s.products?.name ?? "—",
    qty: s.qty,
    at: s.sold_at,
  }));

  return [...restockActivity, ...saleActivity]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}
