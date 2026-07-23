import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { LowBulkStockProduct, LowStockSlot } from "@/lib/reports/types";

export function LowStockList({
  slots,
  bulkProducts,
  limit,
}: {
  slots: LowStockSlot[];
  bulkProducts: LowBulkStockProduct[];
  /** Cap rows shown per card, with a "view all" link for the rest. Omit to show everything (e.g. on the Reports page). */
  limit?: number;
}) {
  if (slots.length === 0 && bulkProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Low stock</CardTitle>
          <CardDescription>Nothing is running low right now.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const visibleSlots = limit ? slots.slice(0, limit) : slots;
  const visibleBulkProducts = limit ? bulkProducts.slice(0, limit) : bulkProducts;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {slots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Machines needing restock</CardTitle>
            <CardDescription>{slots.length} slot(s) at or below par level</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleSlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between text-sm">
                <span>
                  <Link href={`/admin/machines/${slot.machine_id}`} className="hover:underline">
                    {slot.machine_name}
                  </Link>{" "}
                  · {slot.slot_label} · {slot.product_name ?? "Unassigned"}
                </span>
                <span className="font-medium text-destructive">
                  {slot.current_qty} / {slot.par_level} par
                </span>
              </div>
            ))}
            {slots.length > visibleSlots.length && (
              <Link href="/admin/restock" className="block pt-1 text-sm text-muted-foreground hover:underline">
                +{slots.length - visibleSlots.length} more — view restock
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {bulkProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk stock to reorder</CardTitle>
            <CardDescription>
              {bulkProducts.length} product(s) at or below their warehouse par level
            </CardDescription>
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
      )}
    </div>
  );
}
