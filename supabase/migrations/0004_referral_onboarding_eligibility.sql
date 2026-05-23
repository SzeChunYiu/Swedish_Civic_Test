-- Protected referral onboarding completion signal.
--
-- Clients may prove that a signed-in user has opened enough known study
-- chapters, but they must not write referral grant state directly.

create or replace function public.mark_referral_onboarding_complete(opened_chapter_ids text[])
returns table (
  status text,
  referral_onboarding_completed_at timestamptz,
  distinct_chapters integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_id uuid := auth.uid();
  known_chapter_count integer := 0;
  completed_at timestamptz;
begin
  if requester_id is null then
    return query select 'signed_out'::text, null::timestamptz, 0::integer;
    return;
  end if;

  select count(distinct opened.chapter_id)::integer
    into known_chapter_count
    from unnest(coalesce(opened_chapter_ids, array[]::text[])) as opened(chapter_id)
    where opened.chapter_id = any (array[
      'ch01',
      'ch02',
      'ch03',
      'ch04',
      'ch05',
      'ch06',
      'ch07',
      'ch08',
      'ch09',
      'ch10',
      'ch11',
      'ch12',
      'ch13'
    ]);

  if known_chapter_count < 3 then
    return query select 'insufficient_chapters'::text, null::timestamptz, known_chapter_count;
    return;
  end if;

  select profiles.referral_onboarding_completed_at
    into completed_at
    from public.profiles
    where profiles.id = requester_id
    for update;

  if not found then
    return query select 'profile_missing'::text, null::timestamptz, known_chapter_count;
    return;
  end if;

  if completed_at is not null then
    return query select 'already_completed'::text, completed_at, known_chapter_count;
    return;
  end if;

  update public.profiles
  set
    referral_onboarding_completed_at = now(),
    updated_at = now()
  where profiles.id = requester_id
  returning profiles.referral_onboarding_completed_at
    into completed_at;

  return query select 'completed'::text, completed_at, known_chapter_count;
end;
$$;

revoke all on function public.mark_referral_onboarding_complete(text[]) from public;
grant execute on function public.mark_referral_onboarding_complete(text[]) to authenticated;
