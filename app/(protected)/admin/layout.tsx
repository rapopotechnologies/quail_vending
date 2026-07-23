import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { Navbar } from "@/components/layout/navbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Navbar fullName={profile.full_name} />
      <main className="container py-8">{children}</main>
    </div>
  );
}
