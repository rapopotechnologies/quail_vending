"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteProduct } from "@/app/actions/products";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
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
  canDelete,
}: {
  products: Product[];
  canDelete: boolean;
}) {
  const router = useRouter();

  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">No products.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Sell price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>{product.item_id || "—"}</TableCell>
            <TableCell>{product.category || "—"}</TableCell>
            <TableCell>{product.sell_price != null ? `$${product.sell_price}` : "—"}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[product.status] ?? "secondary"}>{product.status}</Badge>
            </TableCell>
            <TableCell className="flex justify-end gap-2">
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
        ))}
      </TableBody>
    </Table>
  );
}
