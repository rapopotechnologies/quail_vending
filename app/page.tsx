import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchLocationImpact } from "@/lib/reports/public-queries";
import { SiteHeader } from "@/components/marketing/site-header";
import { Hero } from "@/components/marketing/hero";
import { ValuesSection } from "@/components/marketing/values-section";
import { LocationsSection } from "@/components/marketing/locations-section";
import { GenerosityLeaderboard } from "@/components/marketing/generosity-leaderboard";
import { InquiryForm } from "@/components/marketing/inquiry-form";
import { SiteFooter } from "@/components/marketing/site-footer";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const locations = await fetchLocationImpact(supabase);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <ValuesSection />
        <LocationsSection locations={locations} />
        <GenerosityLeaderboard locations={locations} />
        <InquiryForm />
      </main>
      <SiteFooter />
    </div>
  );
}
