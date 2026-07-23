"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { deleteMachine } from "@/app/actions/machines";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmButton } from "@/components/shared/delete-confirm-button";
import { MachineFormDialog } from "@/components/machines/machine-form-dialog";
import { SortableHeader, type SortDirection } from "@/components/shared/sortable-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/lib/supabase/types";

type Machine = Tables<"machines">;

export type MachineSortKey = "name" | "status";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  active: "default",
  offline: "secondary",
  maintenance: "destructive",
};

export function MachinesTable({
  machines,
  canDelete,
  sortKey,
  sortDir,
  onSort,
}: {
  machines: Machine[];
  canDelete: boolean;
  sortKey: MachineSortKey | null;
  sortDir: SortDirection;
  onSort: (key: MachineSortKey) => void;
}) {
  const router = useRouter();

  if (machines.length === 0) {
    return <p className="text-sm text-muted-foreground">No machines yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>
            <SortableHeader label="Name" sortKey="name" activeKey={sortKey} direction={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>
            <SortableHeader label="Status" sortKey="status" activeKey={sortKey} direction={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead>Profit share</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {machines.map((machine) => (
          <TableRow key={machine.id}>
            <TableCell>
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-muted">
                {machine.image_url ? (
                  <Image
                    src={machine.image_url}
                    alt=""
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </TableCell>
            <TableCell className="font-medium">
              <Link href={`/admin/machines/${machine.id}`} className="hover:underline">
                {machine.name}
              </Link>
            </TableCell>
            <TableCell>{machine.location || "—"}</TableCell>
            <TableCell>{machine.address || "—"}</TableCell>
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
