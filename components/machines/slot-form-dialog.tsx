"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createMachineSlot, updateMachineSlot } from "@/app/actions/machine-slots";
import { machineSlotSchema, type MachineSlotValues } from "@/lib/validations/machine-slot";
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
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/types";

type MachineSlot = Tables<"machine_slots">;
type Product = Tables<"products">;

const NONE = "__none__";

export function SlotFormDialog({
  machineId,
  slot,
  products,
}: {
  machineId: string;
  slot?: MachineSlot;
  products: Product[];
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const isEdit = !!slot;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MachineSlotValues>({
    resolver: zodResolver(machineSlotSchema),
    defaultValues: slot
      ? {
          slot_label: slot.slot_label,
          product_id: slot.product_id,
          capacity: slot.capacity,
          par_level: slot.par_level,
        }
      : { slot_label: "", product_id: null, capacity: undefined, par_level: undefined },
  });

  async function onSubmit(values: MachineSlotValues) {
    try {
      if (isEdit) {
        await updateMachineSlot(machineId, slot.id, values);
        toast.success("Slot updated");
      } else {
        await createMachineSlot(machineId, values);
        toast.success("Slot created");
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
          {isEdit ? "Edit" : "Add slot"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit slot" : "Add slot"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slot_label">Slot label</Label>
            <Input id="slot_label" placeholder="A1" {...register("slot_label")} />
            {errors.slot_label && (
              <p className="text-sm text-destructive">{errors.slot_label.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select
              value={watch("product_id") ?? NONE}
              onValueChange={(v) => setValue("product_id", v === NONE ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Unassigned</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" type="number" {...register("capacity")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="par_level">Par level</Label>
              <Input id="par_level" type="number" {...register("par_level")} />
            </div>
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
