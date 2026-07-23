"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { bulkUpdateParLevel } from "@/app/actions/products";
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

export function BulkParLevelDialog({
  productIds,
  onDone,
}: {
  productIds: string[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [parLevel, setParLevel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(parLevel);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Enter a valid par level");
      return;
    }
    setIsSubmitting(true);
    try {
      await bulkUpdateParLevel(productIds, Math.trunc(value));
      toast.success(`Updated par level for ${productIds.length} product(s)`);
      setOpen(false);
      setParLevel("");
      onDone();
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
        <Button variant="outline" size="sm">
          Set par level
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set bulk par level</DialogTitle>
          <DialogDescription>
            Applies to {productIds.length} selected product{productIds.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="par-level">Par level</Label>
            <Input
              id="par-level"
              type="number"
              min={0}
              autoFocus
              value={parLevel}
              onChange={(e) => setParLevel(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Apply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
