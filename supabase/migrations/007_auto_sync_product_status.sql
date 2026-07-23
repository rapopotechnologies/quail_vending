-- Automates products.status instead of leaving it as a manually-maintained
-- field that drifts from reality. Whenever warehouse_qty or
-- warehouse_par_level changes:
--   - if warehouse_qty <= warehouse_par_level -> status = 're-purchase needed'
--   - otherwise                                -> status = 'active'
-- 'discontinued' is left alone - it's the one genuinely manual state,
-- unrelated to stock level (a product can be discontinued regardless of
-- how much is left in the warehouse).
-- Products with no warehouse_par_level set are left untouched, since
-- there's no threshold to judge against yet.

create function public.sync_product_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'discontinued' then
    return new;
  end if;

  if new.warehouse_par_level is not null then
    if new.warehouse_qty <= new.warehouse_par_level then
      new.status := 're-purchase needed';
    else
      new.status := 'active';
    end if;
  end if;

  return new;
end;
$$;

create trigger sync_product_status
  before insert or update on products
  for each row execute procedure public.sync_product_status();
