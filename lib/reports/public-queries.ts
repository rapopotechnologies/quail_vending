import type { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type LocationImpact = {
  id: string;
  name: string;
  location: string | null;
  address: string | null;
  image_url: string | null;
  charity_estimate: number;
};

// Reads the public_location_impact view — safe for anonymous visitors on
// the marketing site since it only exposes name/location/address/image/a
// computed charity figure, never raw revenue or sales rows (see migrations
// 004_public_landing_data.sql and 010_images_and_machine_address.sql).
export async function fetchLocationImpact(supabase: SupabaseServerClient): Promise<LocationImpact[]> {
  const { data } = await supabase
    .from("public_location_impact")
    .select("id, name, location, address, image_url, charity_estimate")
    .order("charity_estimate", { ascending: false });

  return ((data ?? []) as unknown as LocationImpact[]).filter(
    (l): l is LocationImpact => l.id != null && l.name != null
  );
}
