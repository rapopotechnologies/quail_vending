import { z } from "zod";
import { optionalNumber } from "./shared";

export const productSchema = z.object({
  item_id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  size_unit_oz: optionalNumber,
  pickup_unit_cost: optionalNumber,
  delivery_unit_cost_business: optionalNumber,
  delivery_unit_cost_retail: optionalNumber,
  sell_price: optionalNumber,
  projected_sell_price: optionalNumber,
  status: z.enum(["active", "re-purchase needed", "discontinued"]),
  source_vendor: z.string().optional(),
  pricing_basis: z.enum(["pickup", "delivered"]).optional().nullable(),
  product_url: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type ProductValues = z.infer<typeof productSchema>;
