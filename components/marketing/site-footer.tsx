import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t py-10">
      <div className="container flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
        <p>
          Quail Vending Co. gives <span className="font-medium text-foreground">10% of profit</span>{" "}
          to local charities — every location contributes.
        </p>
        <p className="flex items-center gap-2 text-xs">
          <span>&copy; {new Date().getFullYear()} Quail Vending Co.</span>
          <span aria-hidden>·</span>
          <Link href="/login" className="hover:underline">
            Staff login
          </Link>
        </p>
      </div>
    </footer>
  );
}
