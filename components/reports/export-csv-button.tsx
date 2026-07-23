"use client";

import { Button } from "@/components/ui/button";
import type { SaleRecord } from "@/lib/reports/types";

function toCsv(sales: SaleRecord[]): string {
  const header = ["Date", "Machine", "Product", "Qty", "Unit Price", "Total"];
  const rows = sales.map((s) => [
    new Date(s.sold_at).toLocaleString(),
    s.machine_name,
    s.product_name,
    s.qty,
    s.unit_price.toFixed(2),
    (s.qty * s.unit_price).toFixed(2),
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function ExportCsvButton({ sales }: { sales: SaleRecord[] }) {
  function handleExport() {
    const csv = toCsv(sales);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={sales.length === 0}>
      Export CSV
    </Button>
  );
}
