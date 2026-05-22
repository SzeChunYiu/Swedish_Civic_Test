-- Referral grants for optional account-backed Pro access.
--
-- The client may read its own profile/referral rows, but it must not be able to
-- write Pro grant state directly. Redemption goes through redeem_referral().

create extension if not exists pgcrypto;

create or replace function public.generate_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  random_bytes bytea;
  candidate text;
  collision_exists boolean;
  position integer;
begin
  loop
    random_bytes := gen_random_bytes(8);
    candidate := '';
    for position in 0..7 loop
      candidate := candidate ||
        substr(alphabet, (get_byte(random_bytes, position) % length(alphabet)) + 1, 1);
    end loop;

    select exists(
      select 1 from public.profiles where referral_code = candidate
    ) into collision_exists;

    exit when not collision_exists;
  end loop;

  return candidate;
end;
$$;

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists pro_grant_expires_at timestamptz,
  add column if not exists successful_referrals integer not null default 0,
  add column if not exists referral_onboarding_completed_at timestamptz;

update public.profiles
set referral_code = public.generate_referral_code()
where referral_code is null;

alter table public.profiles
  alter column referral_code set default public.generate_referral_code(),
  alter column referral_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_referral_code_format'
  ) then
    alter table public.profiles
      add constraint profiles_referral_code_format
      check (referral_code ~ '^[A-Z0-9]{8}$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_successful_referrals_range'
  ) then
    alter table public.profiles
      add constraint profiles_successful_referrals_range
      check (successful_referrals >= 0 and successful_referrals <= 4);
  end if;
end $$;

create unique index if not exists profiles_referral_code_unique
  on public.profiles(referral_code);

-- Keep client profile edits limited to non-entitlement fields. Service-role
-- code can still update protected columns for onboarding eligibility and grants.
revoke insert, update on public.profiles from authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referee_user_id uuid not null references public.profiles(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  referrer_grant_expires_at timestamptz not null,
  referee_grant_expires_at timestamptz not null,
  unique (referee_user_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'referrals_no_self_referral'
  ) then
    alter table public.referrals
      add constraint referrals_no_self_referral
      check (referrer_user_id <> referee_user_id);
  end if;
end $$;

create index if not exists referrals_referrer_user_idx
  on public.referrals(referrer_user_id);

alter table public.referrals enable row level security;

revoke insert, update, delete on public.referrals from anon, authenticated;

create policy "referrals_select_participant"
  on public.referrals for select
  to authenticated
  using (auth.uid() = referrer_user_id or auth.uid() = referee_user_id);

create or replace function public.redeem_referral(code text)
returns table (
  status text,
  pro_grant_expires_at timestamptz,
  successful_referrals integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'));
  referee_id uuid := auth.uid();
  referrer_profile public.profiles%rowtype;
  referee_profile public.profiles%rowtype;
  referrer_next_expiry timestamptz;
  referee_next_expiry timestamptz;
begin
  if referee_id is null then
    return query select 'signed_out'::text, null::timestamptz, null::integer;
    return;
  end if;

  if normalized_code !~ '^[A-Z0-9]{8}$' then
    return query select 'invalid_code'::text, null::timestamptz, null::integer;
    return;
  end if;

  select *
    into referee_profile
    from public.profiles
    where id = referee_id
    for update;

  if not found then
    return query select 'profile_missing'::text, null::timestamptz, null::integer;
    return;
  end if;

  select *
    into referrer_profile
    from public.profiles
    where referral_code = normalized_code
    for update;

  if not found then
    return query select 'not_found'::text, null::timestamptz, null::integer;
    return;
  end if;

  if referrer_profile.id = referee_id then
    return query select 'self_referral'::text, null::timestamptz, null::integer;
    return;
  end if;

  if exists(select 1 from public.referrals where referee_user_id = referee_id) then
    return query select
      'already_redeemed'::text,
      referee_profile.pro_grant_expires_at,
      referrer_profile.successful_referrals;
    return;
  end if;

  if referrer_profile.successful_referrals >= 4 then
    return query select
      'cap_reached'::text,
      referee_profile.pro_grant_expires_at,
      referrer_profile.successful_referrals;
    return;
  end if;

  if referee_profile.referral_onboarding_completed_at is null then
    return query select
      'onboarding_incomplete'::text,
      referee_profile.pro_grant_expires_at,
      referrer_profile.successful_referrals;
    return;
  end if;

  referrer_next_expiry :=
    greatest(coalesce(referrer_profile.pro_grant_expires_at, now()), now()) + interval '7 days';
  referee_next_expiry :=
    greatest(coalesce(referee_profile.pro_grant_expires_at, now()), now()) + interval '7 days';

  begin
    insert into public.referrals (
      referrer_user_id,
      referee_user_id,
      referrer_grant_expires_at,
      referee_grant_expires_at
    )
    values (
      referrer_profile.id,
      referee_id,
      referrer_next_expiry,
      referee_next_expiry
    );
  exception when unique_violation then
    return query select
      'already_redeemed'::text,
      referee_profile.pro_grant_expires_at,
      referrer_profile.successful_referrals;
    return;
  end;

  update public.profiles
  set
    successful_referrals = successful_referrals + 1,
    pro_grant_expires_at = referrer_next_expiry,
    updated_at = now()
  where id = referrer_profile.id;

  update public.profiles
  set
    pro_grant_expires_at = referee_next_expiry,
    updated_at = now()
  where id = referee_id;

  return query select
    'redeemed'::text,
    referee_next_expiry,
    referrer_profile.successful_referrals + 1;
end;
$$;

revoke all on function public.redeem_referral(text) from public;
grant execute on function public.redeem_referral(text) to authenticated;
