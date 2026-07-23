-- profiles_update_self (migration 002) only restricts which ROW a user can
-- update (id = auth.uid()), not which COLUMNS. That means any authenticated
-- staff user could call `supabase.from('profiles').update({ role:
-- 'super_admin' }).eq('id', myId)` directly and self-promote, bypassing the
-- app UI entirely (RLS is the real security boundary, not the UI). Close it
-- with a trigger that blocks role changes unless done by an existing
-- super_admin.
--
-- auth.uid() is null for direct SQL (dashboard/migrations) and service-role
-- requests (no user JWT), so this only fires for actual PostgREST requests
-- made with a signed-in user's JWT - it doesn't block trusted server-side
-- or ops-console role changes.

create function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_super_admin() then
    raise exception 'Only a super admin can change roles';
  end if;
  return new;
end;
$$;

create trigger prevent_role_self_escalation
  before update on profiles
  for each row execute procedure public.prevent_role_self_escalation();
