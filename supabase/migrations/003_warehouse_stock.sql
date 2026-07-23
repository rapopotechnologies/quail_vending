-- Bulk/warehouse inventory: what's on hand from a Costco run etc., before
-- it gets loaded into any machine. Tracked as a simple running total per
-- product rather than purchase lots, matching the rest of the schema's
-- level of detail for a small team.

alter table products
  add column warehouse_qty integer not null default 0,
  add column warehouse_par_level integer;

comment on column products.warehouse_qty is
  'Bulk stock on hand (not yet loaded into a machine). Increases via record-purchase, decreases automatically when a restock event draws from it.';
comment on column products.warehouse_par_level is
  'Reorder threshold for warehouse_qty - below this, the product should show as needing a bulk purchase.';
