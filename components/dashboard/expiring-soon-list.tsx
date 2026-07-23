import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ExpiringLot } from "@/lib/reports/types";

function daysUntil(dateStr: string) {
  const ms = new Date(dateStr).getTime() - new Date(new Date().toDateString()).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function ExpiringSoonList({ lots, limit }: { lots: ExpiringLot[]; limit?: number }) {
  if (lots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expiring soon</CardTitle>
          <CardDescription>Nothing in warehouse stock is expiring soon.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const visible = limit ? lots.slice(0, limit) : lots;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expiring soon</CardTitle>
        <CardDescription>{lots.length} lot(s) expiring within 30 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.map((lot) => {
          const days = daysUntil(lot.expiry_date);
          return (
            <div key={lot.id} className="flex items-center justify-between text-sm">
              <Link href="/admin/products" className="hover:underline">
                {lot.product_name}
              </Link>
              <span className="font-medium text-destructive">
                {lot.qty} units · {days <= 0 ? "expired" : `${days}d left`}
              </span>
            </div>
          );
        })}
        {lots.length > visible.length && (
          <Link href="/admin/products" className="block pt-1 text-sm text-muted-foreground hover:underline">
            +{lots.length - visible.length} more — view all in Products
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
