import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type DepletionRow = {
  product_id: string;
  name: string;
  unitsPerDay: number;
  totalOnHand: number;
};

export function DepletionForecast({ rows }: { rows: DepletionRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough sales in this range to estimate depletion.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Total on hand</TableHead>
          <TableHead>Units/day</TableHead>
          <TableHead>Est. days left</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const daysLeft = r.totalOnHand / r.unitsPerDay;
          const urgent = daysLeft <= 14;
          return (
            <TableRow key={r.product_id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.totalOnHand}</TableCell>
              <TableCell>{r.unitsPerDay.toFixed(1)}</TableCell>
              <TableCell className={urgent ? "font-medium text-destructive" : undefined}>
                {Math.round(daysLeft)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
