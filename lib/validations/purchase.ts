import { z } from "zod";

export const recordPurchaseSchema = z.object({
  qty: z.coerce.number().int().min(1, "Qty must be at least 1"),
  expiry_date: z.string().min(1, "Expiry date is required"),
  // Optional actual price paid - "" (left blank) means not entered, not $0.
  unit_cost: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().min(0, "Price can't be negative").optional()
  ),
});

export type RecordPurchaseValues = z.infer<typeof recordPurchaseSchema>;
