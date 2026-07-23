"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/machines", label: "Machines" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/restock", label: "Restock" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/leads", label: "Leads" },
];

export function Navbar({ fullName }: { fullName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b">
      <div className="container flex flex-col gap-2 py-2 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-0">
        <nav className="-mx-4 flex items-center gap-4 overflow-x-auto px-4 text-sm sm:mx-0 sm:overflow-visible sm:px-0">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith(item.href) && "font-medium text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground sm:justify-end">
          {fullName && <span className="truncate">{fullName}</span>}
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
