"use client";

import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/lib/supabase/types";

export function MachinePicker({
  machines,
  selectedId,
}: {
  machines: Tables<"machines">[];
  selectedId?: string;
}) {
  const router = useRouter();

  return (
    <Select
      value={selectedId}
      onValueChange={(v) => router.push(`/admin/restock?machineId=${v}`)}
    >
      <SelectTrigger className="max-w-sm">
        <SelectValue placeholder="Choose a machine to restock" />
      </SelectTrigger>
      <SelectContent>
        {machines.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
