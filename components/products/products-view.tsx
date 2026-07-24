"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductsTable, type ProductSortKey } from "@/components/products/products-table";
import { BulkParLevelDialog } from "@/components/products/bulk-par-level-dialog";
import type { SortDirection } from "@/components/shared/sortable-header";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;
type Machine = Tables<"machines">;

const ALL_CATEGORIES = "__all__";

function isLowStock(p: Product) {
  return p.warehouse_qty <= (p.warehouse_par_level ?? 0);
}

export function ProductsView({
  products,
  machines,
  canDelete,
}: {
  products: Product[];
  machines: Machine[];
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "low-stock">("all");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<ProductSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(ids: string[]) {
    setSelectedIds((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...ids]);
    });
  }

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

  const lowStockCount = useMemo(() => products.filter(isLowStock).length, [products]);

  const filtered = useMemo(() => {
    let result = products;

    if (filter === "low-stock") {
      result = result.filter(isLowStock);
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
          case "stock":
            return (a.warehouse_qty - b.warehouse_qty) * dir;
          case "status":
            return a.status.localeCompare(b.status) * dir;
          default:
            return 0;
        }
      });
    }

    return result;
  }, [products, filter, category, search, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({products.length})</TabsTrigger>
            <TabsTrigger value="low-stock">Low stock ({lowStockCount})</TabsTrigger>
          </TabsList>
        </Tabs>
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
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
          <p className="text-sm text-muted-foreground">{selectedIds.size} selected</p>
          <div className="flex gap-2">
            <BulkParLevelDialog
              productIds={Array.from(selectedIds)}
              onDone={() => setSelectedIds(new Set())}
            />
          </div>
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products match.</p>
      ) : (
        <ProductsTable
          products={filtered}
          machines={machines}
          canDelete={canDelete}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      )}
    </div>
  );
}
