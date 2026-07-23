"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { MachinesTable, type MachineSortKey } from "@/components/machines/machines-table";
import type { SortDirection } from "@/components/shared/sortable-header";
import type { Tables } from "@/lib/supabase/types";

type Machine = Tables<"machines">;

export function MachinesView({ machines, canDelete }: { machines: Machine[]; canDelete: boolean }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<MachineSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  function handleSort(key: MachineSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = machines;
    if (q) {
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.location ?? "").toLowerCase().includes(q) ||
          (m.address ?? "").toLowerCase().includes(q)
      );
    }

    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      result = [...result].sort((a, b) => {
        if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
        return a.status.localeCompare(b.status) * dir;
      });
    }

    return result;
  }, [machines, search, sortKey, sortDir]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Input
          placeholder="Search name, location, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {machines.length === 0 ? "No machines yet." : "No machines match."}
        </p>
      ) : (
        <MachinesTable
          machines={filtered}
          canDelete={canDelete}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}
    </div>
  );
}
