import { Leaf, Sparkles, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const values = [
  {
    icon: Wrench,
    title: "No Cost to Host",
    body: "Install, stocking, and service included. We do the work, you get the amenity.",
  },
  {
    icon: Leaf,
    title: "Healthy & Modern",
    body: "Curated menus with clear nutrition and better-for-you brands.",
  },
  {
    icon: Sparkles,
    title: "Smart Operations",
    body: "Data-driven restocks keep favorites available and reduce waste.",
  },
];

export function ValuesSection() {
  return (
    <section className="container grid gap-6 pb-24 sm:grid-cols-3">
      {values.map((v) => (
        <Card key={v.title}>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <v.icon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">{v.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{v.body}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
