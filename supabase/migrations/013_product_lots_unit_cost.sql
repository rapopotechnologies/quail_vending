alter table public.product_lots
  add column unit_cost numeric(10, 2);

comment on column public.product_lots.unit_cost is
  'Actual per-individual-unit price paid on this purchase, optional. Distinct from products.pickup_unit_cost/delivery_unit_cost_* which are static catalog reference costs, not what was actually paid on a given restock.';
