"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteProduct } from "@/app/actions/products";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { RecordPurchaseDialog } from "@/components/products/record-purchase-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  "re-purchase needed": "destructive",
  discontinued: "secondary",
};

export function ProductsTable({
  products,
  inMachinesByProduct,
  canDelete,
}: {
  products: Product[];
  inMachinesByProduct: Record<string, number>;
  canDelete: boolean;
}) {
  const router = useRouter();

  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">No products.</p>;
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-20">SKU</TableHead>
          <TableHead className="w-40">Category</TableHead>
          <TableHead className="w-24">Sell price</TableHead>
          <TableHead className="w-36">Bulk stock</TableHead>
          <TableHead className="w-28">Total on hand</TableHead>
          <TableHead className="w-36">Status</TableHead>
          <TableHead className="w-64 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const lowBulkStock = product.warehouse_qty <= (product.warehouse_par_level ?? 0);
          const inMachines = inMachinesByProduct[product.id] ?? 0;
          const totalOnHand = product.warehouse_qty + inMachines;
          return (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-muted">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt=""
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="truncate">{product.item_id || "—"}</TableCell>
              <TableCell className="truncate">{product.category || "—"}</TableCell>
              <TableCell>{product.sell_price != null ? `$${product.sell_price}` : "—"}</TableCell>
              <TableCell className={lowBulkStock ? "font-medium text-destructive" : undefined}>
                {product.warehouse_qty}
                {product.warehouse_par_level != null && ` / ${product.warehouse_par_level} par`}
                {lowBulkStock && " (low)"}
                {product.units_per_case > 1 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({product.units_per_case}/case)
                  </span>
                )}
              </TableCell>
              <TableCell title={`${product.warehouse_qty} bulk + ${inMachines} across machines`}>
                {totalOnHand}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[product.status] ?? "secondary"}>{product.status}</Badge>
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <RecordPurchaseDialog product={product} />
                <ProductFormDialog product={product} />
                {canDelete && (
                  <DeleteConfirmButton
                    confirmMessage={`Delete "${product.name}"? This can't be undone.`}
                    onDelete={async () => {
                      await deleteProduct(product.id);
                      toast.success("Product deleted");
                      router.refresh();
                    }}
                  />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
