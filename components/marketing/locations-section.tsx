import Image from "next/image";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LocationImpact } from "@/lib/reports/public-queries";

export function LocationsSection({ locations }: { locations: LocationImpact[] }) {
  return (
    <section id="locations" className="border-t bg-muted/30 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Where we operate</h2>
          <p className="mt-3 text-muted-foreground">
            Quail Vending machines are currently stocked and serviced at these locations.
          </p>
        </div>

        {locations.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            We&apos;re just getting started — check back soon, or be our next location.
          </p>
        ) : (
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
            {locations.map((loc) => (
              <Card key={loc.id} className="overflow-hidden">
                {loc.image_url && (
                  <div className="relative h-40 w-full">
                    <Image
                      src={loc.image_url}
                      alt={loc.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardContent className="flex items-center gap-3 pt-6">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{loc.name}</p>
                    {(loc.address || loc.location) && (
                      <p className="text-sm text-muted-foreground">
                        {loc.address || loc.location}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
