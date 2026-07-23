-- Public-safe surface for the marketing landing page. Two things:
--
-- 1. partner_inquiries: businesses asking us to host a machine. Public can
--    only INSERT (never read/list other submissions); staff read/manage.
--
-- 2. public_location_impact: a narrow view exposing only what the landing
--    page needs (machine name, general location, and a computed "community
--    impact" dollar figure = 10% of that machine's all-time sales revenue,
--    standing in for the company's 10%-of-profit charity pledge since true
--    per-sale profit isn't tracked). Deliberately does NOT expose raw
--    revenue, sales rows, costs, or any other machines/sales columns.
--    Views run with the owning role's privileges by default, so this is
--    the one place a public (anon) role can see machine-derived data even
--    though RLS locks anon out of machines/sales directly.

create table partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  location text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

alter table partner_inquiries enable row level security;

create policy "partner_inquiries_insert_anon" on partner_inquiries
  for insert to anon, authenticated with check (true);

create policy "partner_inquiries_select_authenticated" on partner_inquiries
  for select to authenticated using (true);

create policy "partner_inquiries_update_authenticated" on partner_inquiries
  for update to authenticated using (true);

create policy "partner_inquiries_delete_super_admin" on partner_inquiries
  for delete to authenticated using (public.is_super_admin());

create view public_location_impact as
select
  m.id,
  m.name,
  m.location,
  round(coalesce(sum(s.qty * s.unit_price), 0) * 0.10, 2) as charity_estimate
from machines m
left join sales s on s.machine_id = m.id
where m.status = 'active'
group by m.id, m.name, m.location;

grant select on public_location_impact to anon, authenticated;
