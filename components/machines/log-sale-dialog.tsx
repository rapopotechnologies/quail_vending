"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { logSlotSale } from "@/app/actions/sales";
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

export function LogSaleDialog({
  machineId,
  slotId,
  slotLabel,
  productName,
  currentQty,
}: {
  machineId: string;
  slotId: string;
  slotLabel: string;
  productName: string | null;
  currentQty: number;
}) {
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
      await logSlotSale(machineId, slotId, Math.trunc(value));
      toast.success(`Logged ${value} sold from ${slotLabel}`);
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
        <Button variant="outline" size="sm" disabled={!productName || currentQty <= 0}>
          Log sale
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log sale — {slotLabel}</DialogTitle>
          <DialogDescription>
            {productName} — {currentQty} currently in this slot. Qty entered here is subtracted
            from stock and recorded as a sale at the product&apos;s current sell price.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sale-qty">Qty sold / taken</Label>
            <Input
              id="sale-qty"
              type="number"
              min={1}
              max={currentQty}
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Log sale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
