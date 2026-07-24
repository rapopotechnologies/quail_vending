import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { LowBulkStockProduct } from "@/lib/reports/types";

export function LowStockList({
  bulkProducts,
  limit,
}: {
  bulkProducts: LowBulkStockProduct[];
  /** Cap rows shown, with a "view all" link for the rest. Omit to show everything (e.g. on the Reports page). */
  limit?: number;
}) {
  if (bulkProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Low stock</CardTitle>
          <CardDescription>Nothing is running low right now.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const visibleBulkProducts = limit ? bulkProducts.slice(0, limit) : bulkProducts;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Low stock</CardTitle>
        <CardDescription>{bulkProducts.length} product(s) at or below par level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleBulkProducts.map((product) => (
          <div key={product.id} className="flex items-center justify-between text-sm">
            <Link href="/admin/products" className="hover:underline">
              {product.name}
            </Link>
            <span className="font-medium text-destructive">
              {product.warehouse_qty} / {product.warehouse_par_level ?? 0} par
            </span>
          </div>
        ))}
        {bulkProducts.length > visibleBulkProducts.length && (
          <Link href="/admin/products" className="block pt-1 text-sm text-muted-foreground hover:underline">
            +{bulkProducts.length - visibleBulkProducts.length} more — view all in Products
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
