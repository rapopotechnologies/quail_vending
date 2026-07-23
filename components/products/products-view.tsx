"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTable } from "@/components/products/products-table";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

function isLowBulkStock(p: Product) {
  return p.warehouse_par_level != null && p.warehouse_qty <= p.warehouse_par_level;
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

  const needsReorderingCount = useMemo(
    () => products.filter((p) => p.status === "re-purchase needed").length,
    [products]
  );

  const lowBulkStockCount = useMemo(() => products.filter(isLowBulkStock).length, [products]);

  const filtered = useMemo(() => {
    if (filter === "needs-reordering") {
      return products.filter((p) => p.status === "re-purchase needed");
    }
    if (filter === "low-bulk-stock") {
      return products.filter(isLowBulkStock);
    }
    return products;
  }, [products, filter]);

  return (
    <div className="space-y-4">
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
      <ProductsTable products={filtered} inMachinesByProduct={inMachinesByProduct} canDelete={canDelete} />
    </div>
  );
}
