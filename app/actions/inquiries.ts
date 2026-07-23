"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { inquirySchema, type InquiryValues } from "@/lib/validations/inquiry";

// Public-facing: submitted from the landing page by anonymous visitors.
// RLS (partner_inquiries_insert_anon) allows this for the anon role.
export async function submitInquiry(values: InquiryValues) {
  const parsed = inquirySchema.parse(values);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("partner_inquiries").insert({
    business_name: parsed.business_name,
    contact_name: parsed.contact_name,
    email: parsed.email,
    phone: parsed.phone || null,
    location: parsed.location || null,
    message: parsed.message || null,
  });

  if (error) throw new Error(error.message);
}

export async function updateInquiryStatus(id: string, status: "new" | "contacted" | "closed") {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("partner_inquiries").update({ status }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
}

export async function deleteInquiry(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("partner_inquiries").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
}
