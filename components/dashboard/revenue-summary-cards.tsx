import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCurrency(n: number) {
  return `$${n.toFixed(2)}`;
}

export function RevenueSummaryCards({
  today,
  last7Days,
  last30Days,
  allTime,
}: {
  today: number;
  last7Days: number;
  last30Days: number;
  allTime: number;
}) {
  const items = [
    { label: "Today", value: today },
    { label: "Last 7 days", value: last7Days },
    { label: "Last 30 days", value: last30Days },
    { label: "All time", value: allTime },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(item.value)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
