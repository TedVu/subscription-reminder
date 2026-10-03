-- handle_new_user() only runs as the auth.users trigger; it must not be callable
-- through the API (flagged by the Supabase security advisor).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
