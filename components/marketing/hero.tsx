import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="container py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Modern vending, zero hassle
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
        We install, stock, and service healthy vending machines and micro
        markets at no cost to your building — and give back 10% of profit to
        local charities along the way.
      </p>
      <div className="mt-8">
        <Button asChild size="lg">
          <a href="#partner">Host a machine at your business</a>
        </Button>
      </div>
    </section>
  );
}
