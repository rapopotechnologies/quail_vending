import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchExpiringLots, fetchLowBulkStockProducts } from "@/lib/reports/queries";
import { Navbar } from "@/components/layout/navbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const [lowBulkStockProducts, expiringLots] = await Promise.all([
    fetchLowBulkStockProducts(supabase),
    fetchExpiringLots(supabase),
  ]);
  const lowStockCount = lowBulkStockProducts.length + expiringLots.length;

  return (
    <div className="min-h-screen">
      <Navbar fullName={profile.full_name} role={profile.role} lowStockCount={lowStockCount} />
      <main className="container py-8">{children}</main>
    </div>
  );
}
