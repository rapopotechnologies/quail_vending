import { z } from "zod";
import { optionalNumber } from "./shared";

export const machineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
  profit_share_pct: optionalNumber,
  status: z.enum(["active", "offline", "maintenance"]),
});

export type MachineValues = z.infer<typeof machineSchema>;
