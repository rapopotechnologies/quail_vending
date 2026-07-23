-- Batch/lot-level expiry tracking for warehouse (bulk) stock. products.warehouse_qty
-- stays the aggregate total used everywhere else (the status auto-sync trigger,
-- low-stock/reorder calcs, "total on hand") - product_lots exists purely to
-- track *which* units expire when. recordPurchase (app/actions/products.ts)
-- creates one lot per purchase; createRestockEvent (app/actions/restock.ts)
-- draws lots down oldest-expiry-first (FIFO) by the same qty it subtracts
-- from warehouse_qty, so the two stay in sync going forward. Pre-existing
-- warehouse_qty (from before this migration) has no corresponding lot - it's
-- simply untracked for expiry purposes until replaced by a new purchase.
create table product_lots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  qty int not null default 0 check (qty >= 0),
  expiry_date date not null,
  received_at timestamptz not null default now()
);

create index product_lots_product_id_idx on product_lots (product_id);
create index product_lots_expiry_date_idx on product_lots (expiry_date);

alter table product_lots enable row level security;

-- Same authenticated-CRUD shape as stock_levels: routine operational data
-- that staff (not just super_admin) need to insert/update/delete as part of
-- normal purchase-recording and restock-drawdown flows.
create policy "product_lots_select_authenticated" on product_lots
  for select to authenticated using (true);
create policy "product_lots_insert_authenticated" on product_lots
  for insert to authenticated with check (true);
create policy "product_lots_update_authenticated" on product_lots
  for update to authenticated using (true);
create policy "product_lots_delete_authenticated" on product_lots
  for delete to authenticated using (true);
