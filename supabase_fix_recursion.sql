-- Run this in Supabase SQL Editor to FIX the "infinite recursion detected
-- in policy for relation profiles" error. Safe to run even if you already
-- ran the first schema file.

-- 1. Helper function that checks admin status WITHOUT going back through
--    the profiles table's own RLS policies (security definer = runs with
--    elevated privileges, bypassing RLS on the query inside it).
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- 2. Replace the broken self-referencing policies with ones that call
--    the helper function instead.
drop policy if exists "Admins can view all profiles" on profiles;
create policy "Admins can view all profiles"
  on profiles for select
  using (public.is_admin());

drop policy if exists "Admins can view all habits" on habits;
create policy "Admins can view all habits"
  on habits for select
  using (public.is_admin());

-- 3. Let admins update a profile's role (needed for the in-app
--    "promote to admin" / "demote to student" button).
drop policy if exists "Admins can update roles" on profiles;
create policy "Admins can update roles"
  on profiles for update
  using (public.is_admin())
  with check (true);
