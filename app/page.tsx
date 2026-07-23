import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const values = [
  {
    title: "No Cost to Host",
    body: "Install, stocking, and service included. We do the work, you get the amenity.",
  },
  {
    title: "Healthy & Modern",
    body: "Curated menus with clear nutrition and better-for-you brands.",
  },
  {
    title: "Smart Operations",
    body: "Data-driven restocks keep favorites available and reduce waste.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-lg font-semibold">Quail Vending Co.</span>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Admin Login</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="container py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Modern vending, zero hassle
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            We install, stock, and service healthy vending machines and micro
            markets at no cost to your building.
          </p>
        </section>

        <section className="container grid gap-6 pb-24 sm:grid-cols-3">
          {values.map((v) => (
            <Card key={v.title}>
              <CardHeader>
                <CardTitle className="text-lg">{v.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{v.body}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Quail Vending Co.
      </footer>
    </div>
  );
}
