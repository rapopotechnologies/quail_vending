-- Core schema: profiles, machines, products, machine_slots, stock_levels,
-- restock_events (+ items), sales.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('super_admin', 'staff')),
  created_at timestamptz not null default now()
);

create table machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  profit_share_pct numeric,
  status text not null default 'active' check (status in ('active', 'offline', 'maintenance')),
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  item_id text unique,
  name text not null,
  category text,
  size_unit_oz numeric,
  pickup_unit_cost numeric,
  delivery_unit_cost_business numeric,
  delivery_unit_cost_retail numeric,
  sell_price numeric,
  projected_sell_price numeric,
  status text not null default 're-purchase needed'
    check (status in ('active', 're-purchase needed', 'discontinued')),
  source_vendor text,
  pricing_basis text check (pricing_basis in ('pickup', 'delivered')),
  product_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table machine_slots (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  slot_label text not null,
  product_id uuid references products(id) on delete set null,
  capacity int,
  par_level int,
  unique (machine_id, slot_label)
);

create table stock_levels (
  id uuid primary key default gen_random_uuid(),
  machine_slot_id uuid not null unique references machine_slots(id) on delete cascade,
  current_qty int not null default 0,
  last_counted_at timestamptz
);

create table restock_events (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id) on delete cascade,
  performed_by uuid references auth.users(id),
  performed_at timestamptz not null default now(),
  notes text
);

create table restock_event_items (
  id uuid primary key default gen_random_uuid(),
  restock_event_id uuid not null references restock_events(id) on delete cascade,
  machine_slot_id uuid not null references machine_slots(id),
  qty_added int not null
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references machines(id),
  product_id uuid not null references products(id),
  qty int not null,
  unit_price numeric not null,
  sold_at timestamptz not null default now(),
  entered_by uuid references auth.users(id)
);

-- Auto-create a profile (default role: staff) whenever a Supabase Auth user
-- is created (covers both the invite flow and any future direct creation).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
