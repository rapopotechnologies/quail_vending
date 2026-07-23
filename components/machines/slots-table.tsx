"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteMachineSlot } from "@/app/actions/machine-slots";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { SlotFormDialog } from "@/components/machines/slot-form-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/lib/supabase/types";

export type SlotWithStock = Tables<"machine_slots"> & {
  product_name: string | null;
  current_qty: number | null;
};

export function SlotsTable({
  machineId,
  slots,
  products,
  canDelete,
}: {
  machineId: string;
  slots: SlotWithStock[];
  products: Tables<"products">[];
  canDelete: boolean;
}) {
  const router = useRouter();

  if (slots.length === 0) {
    return <p className="text-sm text-muted-foreground">No slots yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Slot</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Par level</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {slots.map((slot) => {
          const lowStock =
            slot.par_level != null && slot.current_qty != null && slot.current_qty <= slot.par_level;
          return (
            <TableRow key={slot.id}>
              <TableCell className="font-medium">{slot.slot_label}</TableCell>
              <TableCell>{slot.product_name ?? "Unassigned"}</TableCell>
              <TableCell className={lowStock ? "font-medium text-destructive" : undefined}>
                {slot.current_qty ?? 0}
                {slot.capacity != null && ` / ${slot.capacity}`}
                {lowStock && " (low)"}
              </TableCell>
              <TableCell>{slot.par_level ?? "—"}</TableCell>
              <TableCell className="flex justify-end gap-2">
                <SlotFormDialog machineId={machineId} slot={slot} products={products} />
                {canDelete && (
                  <DeleteConfirmButton
                    confirmMessage={`Delete slot "${slot.slot_label}"?`}
                    onDelete={async () => {
                      await deleteMachineSlot(machineId, slot.id);
                      toast.success("Slot deleted");
                      router.refresh();
                    }}
                  />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
