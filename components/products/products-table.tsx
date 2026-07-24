"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteProduct } from "@/app/actions/products";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { RecordPurchaseDialog } from "@/components/products/record-purchase-dialog";
import { RemoveStockDialog } from "@/components/products/remove-stock-dialog";
import { SortableHeader, type SortDirection } from "@/components/shared/sortable-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAsCrates } from "@/lib/inventory";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

export type ProductSortKey = "name" | "sell_price" | "stock" | "status";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  "re-purchase needed": "destructive",
  discontinued: "secondary",
};

export function ProductsTable({
  products,
  canDelete,
  sortKey,
  sortDir,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  products: Product[];
  canDelete: boolean;
  sortKey: ProductSortKey | null;
  sortDir: SortDirection;
  onSort: (key: ProductSortKey) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
}) {
  const router = useRouter();

  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">No products.</p>;
  }

  const allSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => onToggleSelectAll(products.map((p) => p.id))}
              aria-label="Select all"
            />
          </TableHead>
          <TableHead className="w-12"></TableHead>
          <TableHead>
            <SortableHeader label="Name" sortKey="name" activeKey={sortKey} direction={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead className="w-20">SKU</TableHead>
          <TableHead className="w-40">Category</TableHead>
          <TableHead className="w-24">
            <SortableHeader
              label="Sell price"
              sortKey="sell_price"
              activeKey={sortKey}
              direction={sortDir}
              onSort={onSort}
            />
          </TableHead>
          <TableHead className="w-36">
            <SortableHeader
              label="Stock"
              sortKey="stock"
              activeKey={sortKey}
              direction={sortDir}
              onSort={onSort}
            />
          </TableHead>
          <TableHead className="w-36">
            <SortableHeader
              label="Status"
              sortKey="status"
              activeKey={sortKey}
              direction={sortDir}
              onSort={onSort}
            />
          </TableHead>
          <TableHead className="w-72 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const lowStock = product.warehouse_qty <= (product.warehouse_par_level ?? 0);
          return (
            <TableRow key={product.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(product.id)}
                  onCheckedChange={() => onToggleSelect(product.id)}
                  aria-label={`Select ${product.name}`}
                />
              </TableCell>
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
              <TableCell
                className={lowStock ? "font-medium text-destructive" : undefined}
                title={`${product.warehouse_qty} individual units`}
              >
                {formatAsCrates(product.warehouse_qty, product.units_per_case)}
                {product.warehouse_par_level != null && ` / ${product.warehouse_par_level} par`}
                {lowStock && " (low)"}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[product.status] ?? "secondary"}>{product.status}</Badge>
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <RecordPurchaseDialog product={product} />
                <RemoveStockDialog product={product} />
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
