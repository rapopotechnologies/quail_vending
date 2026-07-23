import { z } from "zod";

export const saleSchema = z.object({
  machine_id: z.string().uuid("Pick a machine"),
  product_id: z.string().uuid("Pick a product"),
  qty: z.coerce.number().int().min(1, "Qty must be at least 1"),
  unit_price: z.coerce.number().min(0, "Price can't be negative"),
});

export type SaleValues = z.infer<typeof saleSchema>;
