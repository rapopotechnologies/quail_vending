"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { removeStock } from "@/app/actions/products";
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
import type { Tables } from "@/lib/supabase/types";

export function RemoveStockDialog({ product }: { product: Tables<"products"> }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(qty);
    if (!Number.isFinite(value) || value < 1) {
      toast.error("Enter a valid qty");
      return;
    }
    setIsSubmitting(true);
    try {
      await removeStock(product.id, Math.trunc(value));
      toast.success(`Removed ${value} from stock`);
      setOpen(false);
      setQty("1");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={product.warehouse_qty <= 0}>
          Remove stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove stock</DialogTitle>
          <DialogDescription>
            {product.name} — {product.warehouse_qty} currently in stock. Qty entered here is
            subtracted (sold, expired, damaged — whatever the reason).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="remove-qty">Qty removed</Label>
            <Input
              id="remove-qty"
              type="number"
              min={1}
              max={product.warehouse_qty}
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Remove stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
