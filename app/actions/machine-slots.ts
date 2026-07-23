"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { machineSlotSchema, type MachineSlotValues } from "@/lib/validations/machine-slot";

export async function createMachineSlot(machineId: string, values: MachineSlotValues) {
  const parsed = machineSlotSchema.parse(values);
  const supabase = await createSupabaseServerClient();

  const { data: slot, error } = await supabase
    .from("machine_slots")
    .insert({ ...parsed, machine_id: machineId })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const { error: stockError } = await supabase
    .from("stock_levels")
    .insert({ machine_slot_id: slot.id, current_qty: 0 });

  if (stockError) throw new Error(stockError.message);

  revalidatePath(`/admin/machines/${machineId}`);
}

export async function updateMachineSlot(
  machineId: string,
  slotId: string,
  values: MachineSlotValues
) {
  const parsed = machineSlotSchema.parse(values);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("machine_slots").update(parsed).eq("id", slotId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/machines/${machineId}`);
}

export async function deleteMachineSlot(machineId: string, slotId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("machine_slots").delete().eq("id", slotId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/machines/${machineId}`);
}
