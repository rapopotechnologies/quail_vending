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
  const hasSavedCaseSize = product.units_per_case > 1;
  // Crates vs. individual items is always offered - even products with no
  // saved case size (units_per_case of 1) might still be bought by the case
  // occasionally, and staff can type the case size in on the spot.
  const [mode, setMode] = useState<"crates" | "items">(hasSavedCaseSize ? "crates" : "items");
  const byCase = mode === "crates";
  const [caseSize, setCaseSize] = useState(hasSavedCaseSize ? product.units_per_case : 1);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordPurchaseValues>({
    resolver: zodResolver(recordPurchaseSchema),
    defaultValues: { qty: 1, expiry_date: "", unit_cost: undefined },
  });

  const entered = watch("qty");
  const effectiveCaseSize = Math.max(1, Math.trunc(caseSize || 1));
  const individualUnits = byCase
    ? Math.max(0, Math.trunc(entered || 0)) * effectiveCaseSize
    : entered;

  async function onSubmit(values: RecordPurchaseValues) {
    const unitsToAdd = byCase ? values.qty * effectiveCaseSize : values.qty;
    // The price field is entered per whatever the staff member is buying in
    // (per crate or per item) - normalize to per-individual-unit before
    // storing, since that's what warehouse_qty and everything else uses.
    const perUnitCost =
      values.unit_cost != null ? values.unit_cost / (byCase ? effectiveCaseSize : 1) : undefined;
    try {
      await recordPurchase(product.id, {
        qty: unitsToAdd,
        expiry_date: values.expiry_date,
        unit_cost: perUnitCost,
      });
      toast.success(`Added ${unitsToAdd} to bulk stock`);
      reset({ qty: 1, expiry_date: "", unit_cost: undefined });
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
          Restock warehouse
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restock warehouse</DialogTitle>
          <DialogDescription>
            Add newly purchased stock (e.g. a Costco run) to {product.name}&apos;s bulk warehouse
            supply — currently {product.warehouse_qty} in stock
            {hasSavedCaseSize && ` (${product.units_per_case} units/case)`}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList>
              <TabsTrigger value="crates">Crates</TabsTrigger>
              <TabsTrigger value="items">Individual items</TabsTrigger>
            </TabsList>
          </Tabs>
          {byCase && (
            <div className="space-y-2">
              <Label htmlFor="case-size">Units per case</Label>
              <Input
                id="case-size"
                type="number"
                min={1}
                value={caseSize}
                onChange={(e) => setCaseSize(Number(e.target.value))}
              />
              {!hasSavedCaseSize && (
                <p className="text-sm text-muted-foreground">
                  This product has no saved case size — set one here just for this purchase, or
                  save it permanently via Edit.
                </p>
              )}
            </div>
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
          <div className="space-y-2">
            <Label htmlFor="unit_cost">
              Price paid {byCase ? "per crate" : "per item"} (optional)
            </Label>
            <Input
              id="unit_cost"
              type="number"
              step="0.01"
              min={0}
              placeholder="Not tracked"
              {...register("unit_cost")}
            />
            {errors.unit_cost && (
              <p className="text-sm text-destructive">{errors.unit_cost.message}</p>
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
