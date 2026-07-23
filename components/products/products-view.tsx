"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTable } from "@/components/products/products-table";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

export function ProductsView({
  products,
  canDelete,
}: {
  products: Product[];
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState<"all" | "needs-reordering">("all");

  const needsReorderingCount = useMemo(
    () => products.filter((p) => p.status === "re-purchase needed").length,
    [products]
  );

  const filtered = useMemo(
    () =>
      filter === "needs-reordering"
        ? products.filter((p) => p.status === "re-purchase needed")
        : products,
    [products, filter]
  );

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({products.length})</TabsTrigger>
          <TabsTrigger value="needs-reordering">
            Needs reordering ({needsReorderingCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <ProductsTable products={filtered} canDelete={canDelete} />
    </div>
  );
}
