import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LocationImpact } from "@/lib/reports/public-queries";

const MEDAL_STYLES = [
  "bg-gold text-gold-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-secondary text-secondary-foreground",
];

export function GenerosityLeaderboard({ locations }: { locations: LocationImpact[] }) {
  const max = Math.max(1, ...locations.map((l) => l.charity_estimate));

  return (
    <section id="impact" className="py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Community impact leaderboard</h2>
          <p className="mt-3 text-muted-foreground">
            We give 10% of profit to local charities. Every sale at every
            location adds to the total — here&apos;s who&apos;s leading the
            way this year.
          </p>
        </div>

        {locations.length === 0 || locations.every((l) => l.charity_estimate === 0) ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Impact tracking starts as soon as sales come in — check back soon.
          </p>
        ) : (
          <Card className="mx-auto mt-10 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">Estimated charitable impact by location</CardTitle>
              <CardDescription>10% of that location&apos;s all-time sales revenue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {locations.map((loc, i) => (
                <div key={loc.id} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      MEDAL_STYLES[i] ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {i === 0 ? <Trophy className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{loc.name}</span>
                      <span className="shrink-0 text-sm font-semibold text-gold-foreground">
                        ${loc.charity_estimate.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${(loc.charity_estimate / max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
