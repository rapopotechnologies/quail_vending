import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#locations", label: "Locations" },
  { href: "#impact", label: "Community Impact" },
  { href: "#partner", label: "Partner With Us" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/quail-logo.png" alt="Quail Vending Co." width={36} height={36} priority />
          <span className="text-lg font-semibold">Quail Vending Co.</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
