"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteSale } from "@/app/actions/sales";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type SaleRow = {
  id: string;
  machine_name: string;
  product_name: string;
  qty: number;
  unit_price: number;
  sold_at: string;
};

export function SalesLog({ sales, canDelete }: { sales: SaleRow[]; canDelete: boolean }) {
  const router = useRouter();

  if (sales.length === 0) {
    return <p className="text-sm text-muted-foreground">No sales logged yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Machine</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Unit price</TableHead>
          <TableHead>Total</TableHead>
          {canDelete && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.map((sale) => (
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
