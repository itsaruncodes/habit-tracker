-- Run this once in Supabase SQL Editor (Project -> SQL Editor -> New query)

-- 1. Profiles table: one row per user, stores role
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'student', -- 'student' or 'admin'
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

-- Users can see their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Admins can see every profile
create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Users can insert their own profile row (happens right after signup)
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- 2. Habits table
create table if not exists habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  streak integer default 0,
  last_completed_date date,
  completed_today boolean default false,
  created_at timestamp with time zone default now()
);

alter table habits enable row level security;

-- Students: full access to their own habits only
create policy "Users manage own habits"
  on habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins: read-only access to every habit row
create policy "Admins can view all habits"
  on habits for select
  using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 3. Auto-create a profile row whenever someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
