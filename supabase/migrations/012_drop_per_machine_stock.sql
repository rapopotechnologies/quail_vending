-- Inventory tracking is now a single running total per product
-- (products.warehouse_qty), not broken out per machine slot. That per-slot
-- model only ever existed to answer "which machine needs a refill" - staff
-- confirmed they don't need that: just what was bought, what's left overall,
-- and what's expiring. All three tables below were still empty (never used
-- in production), so this drops no real data.
drop table if exists restock_event_items cascade;
drop table if exists restock_events cascade;
drop table if exists stock_levels cascade;
drop table if exists machine_slots cascade;
