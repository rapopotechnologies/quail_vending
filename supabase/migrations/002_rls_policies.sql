-- Row Level Security: all tables gated to authenticated users. super_admin
-- required for destructive actions and user management; staff gets
-- day-to-day CRUD on operational tables.

alter table profiles enable row level security;
alter table machines enable row level security;
alter table products enable row level security;
alter table machine_slots enable row level security;
alter table stock_levels enable row level security;
alter table restock_events enable row level security;
alter table restock_event_items enable row level security;
alter table sales enable row level security;

create function public.is_super_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

revoke execute on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

-- profiles: everyone can read all profiles (small internal team); only a
-- super admin can modify roles, users manage their own name.
create policy "profiles_select_authenticated" on profiles
  for select to authenticated using (true);

create policy "profiles_update_self" on profiles
  for update to authenticated using (id = auth.uid());

create policy "profiles_update_super_admin" on profiles
  for update to authenticated using (public.is_super_admin());

-- machines, products, machine_slots, stock_levels: any authenticated user
-- can read/write; only super_admin can delete.
create policy "machines_all_authenticated" on machines
  for select to authenticated using (true);
create policy "machines_write_authenticated" on machines
  for insert to authenticated with check (true);
create policy "machines_update_authenticated" on machines
  for update to authenticated using (true);
create policy "machines_delete_super_admin" on machines
  for delete to authenticated using (public.is_super_admin());

create policy "products_all_authenticated" on products
  for select to authenticated using (true);
create policy "products_write_authenticated" on products
  for insert to authenticated with check (true);
create policy "products_update_authenticated" on products
  for update to authenticated using (true);
create policy "products_delete_super_admin" on products
  for delete to authenticated using (public.is_super_admin());

create policy "machine_slots_all_authenticated" on machine_slots
  for select to authenticated using (true);
create policy "machine_slots_write_authenticated" on machine_slots
  for insert to authenticated with check (true);
create policy "machine_slots_update_authenticated" on machine_slots
  for update to authenticated using (true);
create policy "machine_slots_delete_super_admin" on machine_slots
  for delete to authenticated using (public.is_super_admin());

create policy "stock_levels_all_authenticated" on stock_levels
  for select to authenticated using (true);
create policy "stock_levels_write_authenticated" on stock_levels
  for insert to authenticated with check (true);
create policy "stock_levels_update_authenticated" on stock_levels
  for update to authenticated using (true);

-- restock_events / items: any authenticated user can create and read;
-- editing historical events is super_admin only.
create policy "restock_events_select_authenticated" on restock_events
  for select to authenticated using (true);
create policy "restock_events_insert_authenticated" on restock_events
  for insert to authenticated with check (true);
create policy "restock_events_update_super_admin" on restock_events
  for update to authenticated using (public.is_super_admin());
create policy "restock_events_delete_super_admin" on restock_events
  for delete to authenticated using (public.is_super_admin());

create policy "restock_event_items_select_authenticated" on restock_event_items
  for select to authenticated using (true);
create policy "restock_event_items_insert_authenticated" on restock_event_items
  for insert to authenticated with check (true);

-- sales: any authenticated user can create and read; editing historical
-- sales is super_admin only.
create policy "sales_select_authenticated" on sales
  for select to authenticated using (true);
create policy "sales_insert_authenticated" on sales
  for insert to authenticated with check (true);
create policy "sales_update_super_admin" on sales
  for update to authenticated using (public.is_super_admin());
create policy "sales_delete_super_admin" on sales
  for delete to authenticated using (public.is_super_admin());
