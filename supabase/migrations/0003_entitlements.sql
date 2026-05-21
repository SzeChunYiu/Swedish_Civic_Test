-- Account-bound entitlements granted after a verified Stripe payment.
-- Only the Stripe webhook (service role) may write here; clients read their own.
-- One active row per (user, plan). Fulfillment is driven by checkout.session.completed.

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('remove_ads', 'pro_lifetime')),
  source text not null default 'stripe',
  stripe_session_id text,
  stripe_customer_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan)
);

alter table public.entitlements enable row level security;

-- Clients may read only their own entitlements. There is deliberately NO insert/
-- update policy for `authenticated`: rows are written exclusively by the webhook
-- using the service-role key (which bypasses RLS), so a user can never grant
-- themselves an entitlement by calling the REST API directly.
create policy "entitlements_select_own"
  on public.entitlements
  for select
  to authenticated
  using (auth.uid() = user_id);
