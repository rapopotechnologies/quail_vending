import { z } from "zod";
import { optionalNumber } from "./shared";

export const machineSlotSchema = z.object({
  slot_label: z.string().min(1, "Slot label is required"),
  product_id: z.string().uuid().optional().nullable(),
  capacity: optionalNumber,
  par_level: optionalNumber,
});

export type MachineSlotValues = z.infer<typeof machineSlotSchema>;
