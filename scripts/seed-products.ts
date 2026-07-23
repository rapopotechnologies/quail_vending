/**
 * Imports products from the "Inventory Items Master List" CSV export.
 *
 * Usage: npx tsx scripts/seed-products.ts /path/to/export.csv
 *
 * Expected columns: Item ID, Item name, Type, Pickup Unit Cost (Business),
 * Delivery Unit Cost (Business), Delivery Unit Cost (Normal Costco),
 * Size/Unit (oz), Sell Price ($), Projected Sell Price, Stock, Status,
 * Source, Notes, Link.
 *
 * "Notes" actually encodes pricing_basis ("Delivered Price" / "Pickup
 * Price"), not free-text notes - the sheet's own author used that column
 * for both purposes at different points. "Stock" maps to warehouse_qty
 * (bulk stock on hand), not any per-machine slot quantity.
 *
 * Skips rows with a blank Item name (trailing blank/incomplete rows in the
 * sheet). Requires SUPABASE_SERVICE_ROLE_KEY in the environment since this
 * writes directly, bypassing RLS - run locally, never expose this script's
 * output or the service role key client-side.
 */
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npx tsx scripts/seed-products.ts /path/to/export.csv");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const STATUS_MAP: Record<string, string> = {
  "Re-purchase needed": "re-purchase needed",
  Active: "active",
  Discontinued: "discontinued",
};
const PRICING_BASIS_MAP: Record<string, string> = {
  "Delivered Price": "delivered",
  "Pickup Price": "pickup",
};

function parseMoney(v: string | undefined): number | null {
  const s = (v ?? "").replace("$", "").replace(/,/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseNum(v: string | undefined): number | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

type Row = Record<string, string>;

async function main() {
  const csv = readFileSync(csvPath, "utf-8");
  const rows: Row[] = parse(csv, { columns: true, skip_empty_lines: true });

  const products = rows
    .filter((r) => (r["Item name"] ?? "").trim())
    .map((r) => {
      const stockRaw = (r["Stock"] ?? "").trim();
      const warehouseQty = stockRaw ? Math.trunc(Number(stockRaw)) || 0 : 0;

      return {
        item_id: (r["Item ID"] ?? "").trim() || null,
        name: r["Item name"].trim(),
        category: (r["Type"] ?? "").trim() || null,
        pickup_unit_cost: parseMoney(r["Pickup Unit Cost (Business)"]),
        delivery_unit_cost_business: parseMoney(r["Delivery Unit Cost (Business)"]),
        delivery_unit_cost_retail: parseMoney(r["Delivery Unit Cost (Normal Costco)"]),
        size_unit_oz: parseNum(r["Size/Unit (oz)"]),
        sell_price: parseMoney(r["Sell Price ($)"]),
        projected_sell_price: parseMoney(r["Projected Sell Price"]),
        status: STATUS_MAP[(r["Status"] ?? "").trim()] ?? "re-purchase needed",
        source_vendor: (r["Source"] ?? "").trim() || null,
        pricing_basis: PRICING_BASIS_MAP[(r["Notes"] ?? "").trim()] ?? null,
        product_url: (r["Link"] ?? "").trim() || null,
        warehouse_qty: warehouseQty,
      };
    });

  console.log(`Importing ${products.length} products...`);

  const { error } = await supabase.from("products").insert(products);
  if (error) {
    console.error("Import failed:", error.message);
    process.exit(1);
  }

  console.log("Done.");
}

main();
