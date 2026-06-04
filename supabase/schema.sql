-- AD Space — database schema + Row Level Security
-- Run this in your Supabase project: Dashboard → SQL Editor → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / drop-and-recreate policies).

-- ─────────────────────────────────────────────────────────────
-- Profiles (one row per auth user)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Favorites (saved ad spaces, by listing id)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  listing_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

-- ─────────────────────────────────────────────────────────────
-- Info requests (interest notes — no transaction)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.info_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  listing_id    text,
  listing_title text,
  name          text not null,
  email         text not null,
  message       text,
  weeks         int,
  units         int,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Saved plans (budget planner results)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.saved_plans (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  name               text not null,
  budget             numeric not null,
  weeks              int not null,
  total_cost         numeric not null,
  total_impressions  bigint not null,
  items              jsonb not null default '[]'::jsonb,
  created_at         timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security — users can only touch their own rows
-- ─────────────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.favorites     enable row level security;
alter table public.info_requests enable row level security;
alter table public.saved_plans   enable row level security;

drop policy if exists "profiles self" on public.profiles;
create policy "profiles self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "favorites self" on public.favorites;
create policy "favorites self" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "info_requests self" on public.info_requests;
create policy "info_requests self" on public.info_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_plans self" on public.saved_plans;
create policy "saved_plans self" on public.saved_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
