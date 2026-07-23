"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteMachine } from "@/app/actions/machines";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { MachineFormDialog } from "@/components/machines/machine-form-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/lib/supabase/types";

type Machine = Tables<"machines">;

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  offline: "secondary",
  maintenance: "destructive",
};

export function MachinesTable({
  machines,
  canDelete,
}: {
  machines: Machine[];
  canDelete: boolean;
}) {
  const router = useRouter();

  if (machines.length === 0) {
    return <p className="text-sm text-muted-foreground">No machines yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Profit share</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {machines.map((machine) => (
          <TableRow key={machine.id}>
            <TableCell className="font-medium">
              <Link href={`/admin/machines/${machine.id}`} className="hover:underline">
                {machine.name}
              </Link>
            </TableCell>
            <TableCell>{machine.location || "—"}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[machine.status] ?? "secondary"}>{machine.status}</Badge>
            </TableCell>
            <TableCell>{machine.profit_share_pct != null ? `${machine.profit_share_pct}%` : "—"}</TableCell>
            <TableCell className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/machines/${machine.id}`}>Slots</Link>
              </Button>
              <MachineFormDialog machine={machine} />
              {canDelete && (
                <DeleteConfirmButton
                  confirmMessage={`Delete "${machine.name}"? This can't be undone.`}
                  onDelete={async () => {
                    await deleteMachine(machine.id);
                    toast.success("Machine deleted");
                    router.refresh();
                  }}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
