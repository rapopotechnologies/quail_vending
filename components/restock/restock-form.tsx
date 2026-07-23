"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createRestockEvent } from "@/app/actions/restock";
import { restockEventSchema, type RestockEventValues } from "@/lib/validations/restock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type RestockSlot = {
  id: string;
  slot_label: string;
  product_name: string | null;
  current_qty: number;
  capacity: number | null;
  par_level: number | null;
};

function suggestedQty(slot: RestockSlot): number {
  if (slot.par_level == null) return 0;
  return Math.max(slot.par_level - slot.current_qty, 0);
}

export function RestockForm({ machineId, slots }: { machineId: string; slots: RestockSlot[] }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RestockEventValues>({
    resolver: zodResolver(restockEventSchema),
    defaultValues: {
      notes: "",
      items: slots.map((s) => ({ machine_slot_id: s.id, qty_added: suggestedQty(s) })),
    },
  });

  async function onSubmit(values: RestockEventValues) {
    try {
      await createRestockEvent(machineId, values);
      toast.success("Restock logged");
      reset({
        notes: "",
        items: slots.map((s) => ({ machine_slot_id: s.id, qty_added: suggestedQty(s) })),
      });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (slots.length === 0) {
    return <p className="text-sm text-muted-foreground">This machine has no slots yet.</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Slot</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Current stock</TableHead>
            <TableHead className="w-32">Qty to add</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.map((slot, index) => (
            <TableRow key={slot.id}>
              <TableCell className="font-medium">{slot.slot_label}</TableCell>
              <TableCell>{slot.product_name ?? "Unassigned"}</TableCell>
              <TableCell>
                {slot.current_qty}
                {slot.capacity != null && ` / ${slot.capacity}`}
              </TableCell>
              <TableCell>
                <input
                  type="hidden"
                  value={slot.id}
                  {...register(`items.${index}.machine_slot_id`)}
                />
                <Input type="number" min={0} {...register(`items.${index}.qty_added`)} />
                {slot.par_level != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Suggested: {suggestedQty(slot)} (to par {slot.par_level})
                  </p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {errors.items?.message && (
        <p className="text-sm text-destructive">{errors.items.message}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging..." : "Log restock"}
      </Button>
    </form>
  );
}
