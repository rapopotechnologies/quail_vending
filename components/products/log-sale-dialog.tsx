"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { createSale } from "@/app/actions/sales";
import { saleSchema, type SaleValues } from "@/lib/validations/sale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Tables } from "@/lib/supabase/types";

export function LogSaleDialog({
  product,
  machines,
}: {
  product: Tables<"products">;
  machines: Tables<"machines">[];
}) {
  const [open, setOpen] = useState(false);
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
    defaultValues: {
      product_id: product.id,
      qty: 1,
      unit_price: product.sell_price ?? 0,
    },
  });

  async function onSubmit(values: SaleValues) {
    try {
      await createSale(values);
      toast.success("Sale logged");
      reset({ product_id: product.id, machine_id: undefined, qty: 1, unit_price: product.sell_price ?? 0 });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Log sale" disabled={machines.length === 0}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Log sale</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a sale</DialogTitle>
          <DialogDescription>
            Record a sale of {product.name} and which machine it sold from. This is for revenue
            tracking only — it doesn&apos;t change bulk or machine stock counts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("product_id")} />
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
            <Label htmlFor="sale-qty">Qty</Label>
            <Input id="sale-qty" type="number" min={1} autoFocus {...register("qty")} />
            {errors.qty && <p className="text-sm text-destructive">{errors.qty.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sale-unit-price">Unit price</Label>
            <Input id="sale-unit-price" type="number" step="0.01" min={0} {...register("unit_price")} />
            {errors.unit_price && (
              <p className="text-sm text-destructive">{errors.unit_price.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging..." : "Log sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
