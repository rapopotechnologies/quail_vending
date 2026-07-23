import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Activity } from "@/lib/reports/types";

export function RecentActivity({ activity }: { activity: Activity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {activity.map((item) => (
              <li key={`${item.type}-${item.id}`} className="flex items-center justify-between">
                <span>
                  {item.type === "sale" ? (
                    <>
                      Sold {item.qty}x {item.product_name} at {item.machine_name}
                    </>
                  ) : (
                    <>
                      Restocked {item.machine_name}
                      {item.notes && ` — ${item.notes}`}
                    </>
                  )}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {new Date(item.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
