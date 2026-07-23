import { z } from "zod";

export const recordPurchaseSchema = z.object({
  qty: z.coerce.number().int().min(1, "Qty must be at least 1"),
});

export type RecordPurchaseValues = z.infer<typeof recordPurchaseSchema>;
