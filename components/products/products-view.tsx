"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductsTable, type ProductSortKey } from "@/components/products/products-table";
import type { SortDirection } from "@/components/shared/sortable-header";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

const ALL_CATEGORIES = "__all__";

// Warehouse-only: is the bulk reserve itself running low? Early warning -
// you might still have stock sitting in machines even if this is true.
function isLowBulkStock(p: Product) {
  return p.warehouse_qty <= (p.warehouse_par_level ?? 0);
}

// Total on hand (bulk + everything currently loaded into machines): is
// there truly none of this left anywhere? The more urgent signal.
function needsReordering(p: Product, inMachines: number) {
  return p.warehouse_qty + inMachines <= (p.warehouse_par_level ?? 0);
}

export function ProductsView({
  products,
  inMachinesByProduct,
  canDelete,
}: {
  products: Product[];
  inMachinesByProduct: Record<string, number>;
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "needs-reordering" | "low-bulk-stock">("all");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<ProductSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  function handleSort(key: ProductSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c))).sort(),
    [products]
  );

  const needsReorderingCount = useMemo(
    () => products.filter((p) => needsReordering(p, inMachinesByProduct[p.id] ?? 0)).length,
    [products, inMachinesByProduct]
  );

  const lowBulkStockCount = useMemo(() => products.filter(isLowBulkStock).length, [products]);

  const filtered = useMemo(() => {
    let result = products;

    if (filter === "needs-reordering") {
      result = result.filter((p) => needsReordering(p, inMachinesByProduct[p.id] ?? 0));
    } else if (filter === "low-bulk-stock") {
      result = result.filter(isLowBulkStock);
    }

    if (category !== ALL_CATEGORIES) {
      result = result.filter((p) => p.category === category);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.item_id ?? "").toLowerCase().includes(q)
      );
    }

    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        switch (sortKey) {
          case "name":
            return a.name.localeCompare(b.name) * dir;
          case "sell_price":
            return ((a.sell_price ?? 0) - (b.sell_price ?? 0)) * dir;
          case "bulk_stock":
            return (a.warehouse_qty - b.warehouse_qty) * dir;
          case "total_on_hand": {
            const aTotal = a.warehouse_qty + (inMachinesByProduct[a.id] ?? 0);
            const bTotal = b.warehouse_qty + (inMachinesByProduct[b.id] ?? 0);
            return (aTotal - bTotal) * dir;
          }
          case "status":
            return a.status.localeCompare(b.status) * dir;
          default:
            return 0;
        }
      });
    }

    return result;
  }, [products, filter, category, search, inMachinesByProduct, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">All ({products.length})</TabsTrigger>
              <TabsTrigger value="needs-reordering">
                Needs reordering ({needsReorderingCount})
              </TabsTrigger>
              <TabsTrigger value="low-bulk-stock">
                Low bulk stock ({lowBulkStockCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {filter === "needs-reordering" &&
              "None left anywhere — bulk stock + everything currently in machines."}
            {filter === "low-bulk-stock" &&
              "Bulk (warehouse) reserve is running low — may still have stock in machines."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products match.</p>
      ) : (
        <ProductsTable
          products={filtered}
          inMachinesByProduct={inMachinesByProduct}
          canDelete={canDelete}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}
    </div>
  );
}
