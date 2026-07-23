-- Product/machine photos (so staff can visually confirm a SKU when
-- restocking, and the landing page can show a real photo of each
-- location) + a proper street address for machines, separate from the
-- existing free-text `location` note (e.g. "Bldg 4 Lobby").

alter table products add column image_url text;
alter table machines add column image_url text;
alter table machines add column address text;

-- Two public storage buckets (Supabase's storage.buckets is a plain
-- table - insertable via SQL/migrations, no dashboard step needed).
-- Public read is required: the marketing landing page displays machine
-- photos to anonymous visitors. Only authenticated (staff) can write.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('machine-images', 'machine-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product_images_authenticated_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy "product_images_authenticated_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');
create policy "product_images_authenticated_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');

create policy "machine_images_public_read" on storage.objects
  for select using (bucket_id = 'machine-images');
create policy "machine_images_authenticated_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'machine-images');
create policy "machine_images_authenticated_update" on storage.objects
  for update to authenticated using (bucket_id = 'machine-images');
create policy "machine_images_authenticated_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'machine-images');

-- Expose the new machine fields on the public-safe landing page view.
-- Still no financial data - just what a public visitor should see.
drop view public_location_impact;

create view public_location_impact as
select
  m.id,
  m.name,
  m.location,
  m.address,
  m.image_url,
  round(coalesce(sum(s.qty * s.unit_price), 0) * 0.10, 2) as charity_estimate
from machines m
left join sales s on s.machine_id = m.id
where m.status = 'active'
group by m.id, m.name, m.location, m.address, m.image_url;

grant select on public_location_impact to anon, authenticated;
