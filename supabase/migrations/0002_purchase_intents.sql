-- Account-bound purchase handoff intents for the static web surface.
-- The client may insert only for its authenticated Supabase user; fulfillment
-- still requires App Store / Google Play receipt validation before entitlements.

create table if not exists public.purchase_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_email text,
  plan text not null check (plan in ('remove_ads', 'pro_lifetime')),
  platform text not null check (platform in ('google_play', 'app_store')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.purchase_intents enable row level security;

create policy "purchase_intents_insert_own"
  on public.purchase_intents
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "purchase_intents_select_own"
  on public.purchase_intents
  for select
  to authenticated
  using (auth.uid() = user_id);
