-- Swedish Civic Test — initial auth/profile/entitlement schema
-- Run in Supabase dashboard → SQL Editor, or via `supabase db push` once CLI is wired.

------------------------------------------------------------
-- 1. profiles: one row per authenticated user
------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------
-- 2. progress: per-question study state, server-synced
------------------------------------------------------------
create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  seen_count int not null default 0,
  correct_count int not null default 0,
  wrong_count int not null default 0,
  correct_streak int not null default 0,
  last_answered_at timestamptz,
  next_review_at timestamptz,
  bookmarked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.progress enable row level security;

create policy "progress_rw_own"
  on public.progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists progress_user_idx on public.progress(user_id);

------------------------------------------------------------
-- 3. entitlements: Remove-Ads etc. tied to account
------------------------------------------------------------
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  remove_ads boolean not null default false,
  source text,           -- 'ios_iap' | 'play_billing' | 'stripe' | 'grant'
  purchased_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

-- Users may read their own entitlement.
-- WRITES should happen server-side (Edge Function with service role) after verifying the
-- store receipt. Do NOT add a client-side update policy — that would let users grant themselves
-- Remove-Ads for free.
create policy "entitlements_select_own"
  on public.entitlements for select
  using (auth.uid() = user_id);
