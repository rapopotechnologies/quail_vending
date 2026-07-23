import { z } from "zod";

export const restockEventSchema = z.object({
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        machine_slot_id: z.string().uuid(),
        qty_added: z.coerce.number().int().min(0),
      })
    )
    .refine((items) => items.some((i) => i.qty_added > 0), {
      message: "Add a quantity to at least one slot",
    }),
});

export type RestockEventValues = z.infer<typeof restockEventSchema>;
