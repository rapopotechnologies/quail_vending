"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteSale } from "@/app/actions/sales";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { SortableHeader, type SortDirection } from "@/components/shared/sortable-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type SaleRow = {
  id: string;
  machine_name: string;
  product_name: string;
  qty: number;
  unit_price: number;
  sold_at: string;
};

type SortKey = "sold_at" | "machine_name" | "product_name" | "qty" | "total";

export function SalesLog({ sales, canDelete }: { sales: SaleRow[]; canDelete: boolean }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return sales;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...sales].sort((a, b) => {
      switch (sortKey) {
        case "sold_at":
          return (new Date(a.sold_at).getTime() - new Date(b.sold_at).getTime()) * dir;
        case "machine_name":
          return a.machine_name.localeCompare(b.machine_name) * dir;
        case "product_name":
          return a.product_name.localeCompare(b.product_name) * dir;
        case "qty":
          return (a.qty - b.qty) * dir;
        case "total":
          return (a.qty * a.unit_price - b.qty * b.unit_price) * dir;
        default:
          return 0;
      }
    });
  }, [sales, sortKey, sortDir]);

  if (sales.length === 0) {
    return <p className="text-sm text-muted-foreground">No sales logged yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortableHeader label="When" sortKey="sold_at" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
          </TableHead>
          <TableHead>
            <SortableHeader
              label="Machine"
              sortKey="machine_name"
              activeKey={sortKey}
              direction={sortDir}
              onSort={handleSort}
            />
          </TableHead>
          <TableHead>
            <SortableHeader
              label="Product"
              sortKey="product_name"
              activeKey={sortKey}
              direction={sortDir}
              onSort={handleSort}
            />
          </TableHead>
          <TableHead>
            <SortableHeader label="Qty" sortKey="qty" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
          </TableHead>
          <TableHead>Unit price</TableHead>
          <TableHead>
            <SortableHeader label="Total" sortKey="total" activeKey={sortKey} direction={sortDir} onSort={handleSort} />
          </TableHead>
          {canDelete && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell>{new Date(sale.sold_at).toLocaleString()}</TableCell>
            <TableCell>{sale.machine_name}</TableCell>
            <TableCell>{sale.product_name}</TableCell>
            <TableCell>{sale.qty}</TableCell>
            <TableCell>${sale.unit_price.toFixed(2)}</TableCell>
            <TableCell>${(sale.qty * sale.unit_price).toFixed(2)}</TableCell>
            {canDelete && (
              <TableCell className="text-right">
                <DeleteConfirmButton
                  confirmMessage="Delete this sale record?"
                  onDelete={async () => {
                    await deleteSale(sale.id);
                    toast.success("Sale deleted");
                    router.refresh();
                  }}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
