"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { machineSchema, type MachineValues } from "@/lib/validations/machine";

export async function createMachine(values: MachineValues) {
  const parsed = machineSchema.parse(values);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("machines").insert(parsed);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/machines");
}

export async function updateMachine(id: string, values: MachineValues) {
  const parsed = machineSchema.parse(values);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("machines").update(parsed).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/machines");
  revalidatePath(`/admin/machines/${id}`);
}

export async function deleteMachine(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("machines").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/machines");
}
