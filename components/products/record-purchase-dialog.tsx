"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { recordPurchase } from "@/app/actions/products";
import { recordPurchaseSchema, type RecordPurchaseValues } from "@/lib/validations/purchase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Tables } from "@/lib/supabase/types";

export function RecordPurchaseDialog({ product }: { product: Tables<"products"> }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const perCase = product.units_per_case;
  const hasCases = perCase > 1;
  // "Individual items" is always available - staff occasionally add loose
  // stock (a partial case, an item bought separately) even for products
  // normally purchased by the case.
  const [mode, setMode] = useState<"crates" | "items">(hasCases ? "crates" : "items");
  const byCase = mode === "crates";

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordPurchaseValues>({
    resolver: zodResolver(recordPurchaseSchema),
    defaultValues: { qty: 1, expiry_date: "" },
  });

  const entered = watch("qty");
  const individualUnits = byCase ? Math.max(0, Math.trunc(entered || 0)) * perCase : entered;

  async function onSubmit(values: RecordPurchaseValues) {
    const unitsToAdd = byCase ? values.qty * perCase : values.qty;
    try {
      await recordPurchase(product.id, { qty: unitsToAdd, expiry_date: values.expiry_date });
      toast.success(`Added ${unitsToAdd} to bulk stock`);
      reset({ qty: 1, expiry_date: "" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Record purchase
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a purchase</DialogTitle>
          <DialogDescription>
            {product.name} — currently {product.warehouse_qty} in bulk stock
            {hasCases && ` (${perCase} units/case)`}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {hasCases && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <TabsList>
                <TabsTrigger value="crates">Crates</TabsTrigger>
                <TabsTrigger value="items">Individual items</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <div className="space-y-2">
            <Label htmlFor="qty">{byCase ? "Crates bought" : "Items bought"}</Label>
            <Input id="qty" type="number" min={1} autoFocus {...register("qty")} />
            {errors.qty && <p className="text-sm text-destructive">{errors.qty.message}</p>}
            {byCase && (
              <p className="text-sm text-muted-foreground">= {individualUnits} individual units</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry_date">Expiry date</Label>
            <Input id="expiry_date" type="date" {...register("expiry_date")} />
            {errors.expiry_date && (
              <p className="text-sm text-destructive">{errors.expiry_date.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add to bulk stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
