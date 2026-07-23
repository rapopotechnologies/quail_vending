-- Migration 007's auto-sync trigger skipped recalculating status entirely
-- when warehouse_par_level was null ("no threshold to judge against yet").
-- In practice every imported product has no par level set (the source CSV
-- didn't track reorder thresholds), so the trigger never activated for any
-- of them - they all just kept the CSV's default status regardless of
-- actual stock. Fix: treat a null par level as an implicit threshold of 0,
-- so a product only shows 're-purchase needed' once it's truly out, and
-- 'active' the moment there's any stock. Setting a real par level later
-- still overrides this per product exactly as before.

create or replace function public.sync_product_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'discontinued' then
    return new;
  end if;

  if new.warehouse_qty <= coalesce(new.warehouse_par_level, 0) then
    new.status := 're-purchase needed';
  else
    new.status := 'active';
  end if;

  return new;
end;
$$;

-- Re-run the trigger against existing rows so the corrected logic applies
-- immediately instead of waiting for the next edit/restock/purchase.
update products set warehouse_qty = warehouse_qty where status <> 'discontinued';
