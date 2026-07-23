"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createProduct, updateProduct } from "@/app/actions/products";
import { productSchema, type ProductValues } from "@/lib/validations/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

export function ProductFormDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          item_id: product.item_id ?? "",
          name: product.name,
          category: product.category ?? "",
          size_unit_oz: product.size_unit_oz,
          pickup_unit_cost: product.pickup_unit_cost,
          delivery_unit_cost_business: product.delivery_unit_cost_business,
          delivery_unit_cost_retail: product.delivery_unit_cost_retail,
          sell_price: product.sell_price,
          projected_sell_price: product.projected_sell_price,
          status: product.status as ProductValues["status"],
          source_vendor: product.source_vendor ?? "",
          pricing_basis: product.pricing_basis as ProductValues["pricing_basis"],
          product_url: product.product_url ?? "",
          notes: product.notes ?? "",
          warehouse_qty: product.warehouse_qty,
          warehouse_par_level: product.warehouse_par_level,
          units_per_case: product.units_per_case,
        }
      : { name: "", status: "re-purchase needed", warehouse_qty: 0, units_per_case: 1 },
  });

  async function onSubmit(values: ProductValues) {
    try {
      if (isEdit) {
        await updateProduct(product.id, values);
        toast.success("Product updated");
      } else {
        await createProduct(values);
        toast.success("Product created");
        reset();
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isEdit ? "outline" : "default"} size="sm">
          {isEdit ? "Edit" : "Add product"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_id">SKU / Item ID</Label>
              <Input id="item_id" {...register("item_id")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="Snacks, Drinks - Healthy, ..." {...register("category")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size_unit_oz">Size (oz)</Label>
              <Input id="size_unit_oz" type="number" step="0.01" {...register("size_unit_oz")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pickup_unit_cost">Pickup cost</Label>
              <Input id="pickup_unit_cost" type="number" step="0.01" {...register("pickup_unit_cost")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_unit_cost_business">Delivery cost (business)</Label>
              <Input
                id="delivery_unit_cost_business"
                type="number"
                step="0.01"
                {...register("delivery_unit_cost_business")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_unit_cost_retail">Delivery cost (retail)</Label>
              <Input
                id="delivery_unit_cost_retail"
                type="number"
                step="0.01"
                {...register("delivery_unit_cost_retail")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sell_price">Sell price</Label>
              <Input id="sell_price" type="number" step="0.01" {...register("sell_price")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projected_sell_price">Projected sell price</Label>
              <Input
                id="projected_sell_price"
                type="number"
                step="0.01"
                {...register("projected_sell_price")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v as ProductValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="re-purchase needed">Re-purchase needed</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Active / Re-purchase needed track bulk stock vs. reorder threshold
                automatically once both are set — this only matters for marking
                something Discontinued.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Pricing basis</Label>
              <Select
                value={watch("pricing_basis") ?? undefined}
                onValueChange={(v) => setValue("pricing_basis", v as ProductValues["pricing_basis"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source_vendor">Source vendor</Label>
              <Input id="source_vendor" placeholder="Costco Business, gopuff, ..." {...register("source_vendor")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_url">Product URL</Label>
              <Input id="product_url" {...register("product_url")} />
              {errors.product_url && (
                <p className="text-sm text-destructive">{errors.product_url.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="warehouse_qty">Bulk stock on hand</Label>
              <Input id="warehouse_qty" type="number" min={0} {...register("warehouse_qty")} />
              {errors.warehouse_qty && (
                <p className="text-sm text-destructive">{errors.warehouse_qty.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse_par_level">Bulk reorder threshold</Label>
              <Input id="warehouse_par_level" type="number" min={0} {...register("warehouse_par_level")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="units_per_case">Units per case</Label>
              <Input id="units_per_case" type="number" min={1} {...register("units_per_case")} />
              {errors.units_per_case && (
                <p className="text-sm text-destructive">{errors.units_per_case.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
