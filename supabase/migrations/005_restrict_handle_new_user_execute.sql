-- handle_new_user is a trigger function only meant to fire via
-- on_auth_user_created; it doesn't need to be directly callable via
-- PostgREST's /rpc/handle_new_user. Closes a Supabase security-advisor flag.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
