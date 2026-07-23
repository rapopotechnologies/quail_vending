-- Bulk-to-single ratio: how many individual sale-able units come in one
-- case/pack you'd actually buy (e.g. a Costco case of 24 bottles).
-- warehouse_qty stays tracked in individual units everywhere (restock
-- drawdown, low-stock thresholds, machine par levels all already reason in
-- individual units) - this is purely a data-entry convenience for
-- "Record purchase", which now asks for cases bought and multiplies.

alter table products
  add column units_per_case integer not null default 1
    check (units_per_case >= 1);

comment on column products.units_per_case is
  'Individual units per case/pack as normally purchased (e.g. 24 for a Costco case of bottles). Used only to convert "cases bought" into warehouse_qty when recording a purchase - warehouse_qty itself always stays in individual units.';
