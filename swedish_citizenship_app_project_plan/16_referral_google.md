# 16 — Referral: Google Login → 7-Day Pro

Status: BLUEPRINT
Depends on: 13_pro_tier.md (entitlement system + temporary grant), Supabase auth (not yet wired — see prerequisite)
Owners: `MANAGER-build` (auth + redemption), `MANAGER-uiux` (invite + post-mock CTAs), `MANAGER-content` (legal copy)
Reviewer personas: friend-of-immigrant inviter, fraud-attempter (multi-account), EEA consent skeptic.

## What ships

Refer a friend → friend signs in with Google for the first time → **both** sides get a 7-day Pro entitlement grant. Capped at **4 successful redemptions per referrer** (= max 28 days of Pro from referrals). After cap, "Invite a friend" still shows but doesn't grant.

## Prerequisite: Supabase auth (blocking)

App currently has NO auth. Adding Google sign-in requires:
- Supabase project (already on roadmap per docs/architecture.md)
- `@react-native-google-signin/google-signin` or Expo's `expo-auth-session/providers/google`
- iOS: `GoogleService-Info.plist` + URL scheme
- Android: SHA-1 + OAuth client
- Web: client_id env

Auth is its own lane. This blueprint assumes it's landed; workers must NOT attempt referral wiring before auth is real.

## Data model (Supabase)

```sql
create table profiles (
  user_id uuid primary key references auth.users(id),
  referral_code text unique not null,
  pro_grant_expires_at timestamptz,
  successful_referrals int default 0,
  created_at timestamptz default now()
);

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid references profiles(user_id),
  referee_user_id uuid references profiles(user_id) unique,  -- one referrer per referee
  redeemed_at timestamptz default now()
);

-- RLS: users read own profile + own referrals; service-role writes referrals.
```

`referral_code` is 8 alphanumeric chars (collision-checked). Deep link: `swedishcivictest://r/{code}` or `https://app.example.se/r/{code}`.

## Redemption flow

1. New user opens deep link → app stores `pendingReferralCode` in SecureStore.
2. User taps "Continue with Google" on onboarding.
3. After Supabase auth succeeds AND `pendingReferralCode` is present AND this user has never been a referee before AND referrer hasn't hit cap → server-side RPC `redeem_referral(code)` writes the `referrals` row + extends BOTH sides' `pro_grant_expires_at` by 7 days.
4. App reads new `pro_grant_expires_at` → updates local `monetization.referral.proGrant.expiresAt.v1` → entitlement engine treats user as Pro until that timestamp.

Server-side enforcement (RPC, NOT client) for: cap check, self-referral block, single-referrer-per-referee.

## Fraud mitigation (lightweight, not enterprise)

- Cap of 4 per referrer.
- One referrer per referee, enforced by unique constraint.
- New referee must complete onboarding (3 chapters opened) before grant activates — pure-signup farms get nothing.
- No financial reward = low fraud incentive. Don't over-engineer.

## Surfaces

1. **Profile screen**: "Invite a friend → both get 7 days Pro free" with copy/share code.
2. **Post-mock-pass moment**: "You passed! Share your code with someone studying."
3. **Pro grant banner**: "Pro active until <date> from your referral. Upgrade to keep features after that." Soft conversion CTA.

## Acceptance test (executable)

```bash
# 1. Supabase auth prereq — Google sign-in wired
grep -rqE "GoogleSignin|expo-auth-session.*google" lib/ app/ \
  || grep -rqE "supabase.*auth.*google" lib/auth/

# 2. Referral module exists
test -f lib/referral/redeemReferral.ts
grep -q "referral_code" supabase/migrations/*.sql 2>/dev/null \
  || grep -q "referral_code" supabase/schema.sql 2>/dev/null

# 3. Deep link handler
grep -rqE "swedishcivictest://r/|/r/\\[code\\]" app/

# 4. Entitlement engine reads referral grant
grep -q "monetization.referral.proGrant.expiresAt.v1" lib/monetization/

# 5. Cap enforced server-side, not client
grep -q "successful_referrals" supabase/migrations/*.sql

# 6. tsc + lint
npx tsc --noEmit && npm run lint
```

## Product source paths

`lib/auth/`, `lib/referral/`, `lib/monetization/` (grant read path), `app/`, `components/`, `supabase/migrations/`, `tests/referral/`.

## Reviewer hooks

- `--kind functional` — invite flow end-to-end on TWO real Google accounts in a preview build.
- `--kind functional` — referrer at cap=4 shows "invite still works but no more bonuses" copy, no crash.
- `--kind data` — self-referral attempt rejected at DB level even if client is hacked.
- `--kind user-sim` — fraud-attempter persona tries to grant themselves Pro via own referral code → fails.
- `--kind language` — EEA consent copy explains the data flow (Supabase, Google) in Sv + En.

## Explicit non-goals

- No cash rewards.
- No revenue split / affiliate.
- No leaderboard of top referrers.
- No SMS invites (use system share sheet → user picks channel).
