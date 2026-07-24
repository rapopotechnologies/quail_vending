"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createSale } from "@/app/actions/sales";
import { saleSchema, type SaleValues } from "@/lib/validations/sale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/types";

export function SaleForm({
  machines,
  products,
}: {
  machines: Tables<"machines">[];
  products: Tables<"products">[];
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SaleValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: { qty: 1, unit_price: 0 },
  });

  function onProductChange(productId: string) {
    setValue("product_id", productId);
    const product = products.find((p) => p.id === productId);
    if (product?.sell_price != null) {
      setValue("unit_price", product.sell_price);
    }
  }

  async function onSubmit(values: SaleValues) {
    try {
      await createSale(values);
      toast.success("Sale logged");
      reset({
        machine_id: values.machine_id,
        product_id: undefined,
        qty: 1,
        unit_price: 0,
      });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-4 sm:items-end">
      <div className="space-y-2">
        <Label>Machine</Label>
        <Select value={watch("machine_id")} onValueChange={(v) => setValue("machine_id", v)}>
          <SelectTrigger className="overflow-hidden">
            <SelectValue placeholder="Pick a machine" className="min-w-0 truncate" />
          </SelectTrigger>
          <SelectContent>
            {machines.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.machine_id && (
          <p className="text-sm text-destructive">{errors.machine_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Product</Label>
        <Select value={watch("product_id")} onValueChange={onProductChange}>
          <SelectTrigger className="overflow-hidden">
            <SelectValue placeholder="Pick a product" className="min-w-0 truncate" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground">No products with stock on hand.</p>
        )}
        {errors.product_id && (
          <p className="text-sm text-destructive">{errors.product_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="qty">Qty</Label>
        <Input id="qty" type="number" min={1} {...register("qty")} />
        {errors.qty && <p className="text-sm text-destructive">{errors.qty.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit_price">Unit price</Label>
        <Input id="unit_price" type="number" step="0.01" min={0} {...register("unit_price")} />
        {errors.unit_price && (
          <p className="text-sm text-destructive">{errors.unit_price.message}</p>
        )}
      </div>

      <div className="sm:col-span-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging..." : "Log sale"}
        </Button>
      </div>
    </form>
  );
}
