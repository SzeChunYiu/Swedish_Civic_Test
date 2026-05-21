> **SUPERSEDED for purchases — see `stripe-purchase-setup.md`.** The Google Play
> handoff and `purchase_intents` table described below are no longer the purchase
> path; the site now uses a Stripe web checkout (`site/purchase.js` →
> `create-checkout` Edge Function → `entitlements`). The **Auth / Supabase Site
> URL** section here is still valid and is the #1 blocker (login bounces to
> `localhost:3000` until it is fixed).

# Live auth and purchase checklist for `almostswedish.se`

Created after the 2026-05-21 Loopia deploy when live Google sign-in redirected
back to `localhost:3000` and the purchase buttons could not be proven live.

## Current live findings

- Live site: <https://almostswedish.se/>
- Static site config points at Supabase project:
  `https://uesfowwijbdlffyweyum.supabase.co`
- The site code passes `redirectTo: https://almostswedish.se/` for Google OAuth.
  A direct Supabase authorize probe also produced a Google OAuth URL containing
  `redirect_to=https%3A%2F%2Falmostswedish.se%2F`.
- If Google sign-in still returns to `localhost:3000`, the likely root cause is
  external Supabase Auth URL configuration, not `site/signin.js`.
- The live Supabase REST API currently reports `public.purchase_intents` missing
  from the schema cache (`PGRST205`). This means the account-bound web purchase
  handoff cannot complete until the migration is applied.
- Public Google Play URL for `com.billyyiu.almostswedish` returned HTTP 404 to a
  public unauthenticated probe. That may mean the app is unpublished/not visible
  outside tester accounts; do not treat the web purchase handoff as production
  ready until a tester/public account can open the Play listing.

## Required Supabase dashboard fixes

Open Supabase Dashboard for project `uesfowwijbdlffyweyum`.

### 1. Auth URL Configuration

Go to `Authentication` -> `URL Configuration`.

Set:

```text
Site URL: https://almostswedish.se
```

Add redirect URLs:

```text
https://almostswedish.se/
https://almostswedish.se/**
https://www.almostswedish.se/
https://www.almostswedish.se/**
http://localhost:3000/**
```

`localhost` may stay for development, but it must not be the production Site
URL. Supabase requires the `redirectTo` URL to match the configured redirect URL
allow-list; otherwise it can fall back to the Site URL.

### 2. Google provider / Google Cloud OAuth client

In Supabase `Authentication` -> `Providers` -> `Google`, confirm Google is
enabled and uses the intended Google Cloud OAuth client.

In Google Cloud Console for that OAuth client, confirm:

```text
Authorized redirect URI:
https://uesfowwijbdlffyweyum.supabase.co/auth/v1/callback

Authorized JavaScript origins:
https://almostswedish.se
https://www.almostswedish.se
http://localhost:3000
```

### 3. Apply purchase intent migration

Run this repo migration in the same Supabase project:

```text
supabase/migrations/0002_purchase_intents.sql
```

The table must exist before `site/purchase.js` can insert the account-bound
purchase intent. Without it, the button catches the insert failure and does not
redirect to Google Play.

## Local/live verification commands

From repo root, with the live public anon key in `site/index.html`:

```bash
ANON='sb_publishable_C2RMsCVMaXFSLSmk08_Yeg_XlVRn3Q2'
BASE='https://uesfowwijbdlffyweyum.supabase.co'

# Should be 200 or 401/403 depending on auth/RLS shape, but NOT PGRST205.
curl -i "$BASE/rest/v1/purchase_intents?select=id&limit=1" \
  -H "apikey: $ANON" \
  -H "Authorization: Bearer $ANON"
```

Expected after migration: table exists. An unauthenticated insert should be
blocked by RLS, not table-missing:

```bash
curl -i "$BASE/rest/v1/purchase_intents" \
  -H "apikey: $ANON" \
  -H "Authorization: Bearer $ANON" \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  --data '{"account_email":"probe@example.invalid","platform":"google_play","plan":"remove_ads","status":"pending","user_id":"00000000-0000-0000-0000-000000000000"}'
```

Expected: RLS/auth failure, not `PGRST205`.

Then browser-test the real flow:

1. Open <https://almostswedish.se/> in a clean browser profile.
2. Click `Sign in` -> `Continue with Google`.
3. Complete Google sign-in.
4. Expected redirect target: `https://almostswedish.se/` or
   `https://www.almostswedish.se/`, never `localhost:3000`.
5. Confirm the header says account/sign-out and purchase buttons become enabled.
6. Click a purchase button using a Google Play tester account.
7. Expected: Supabase `purchase_intents` row is inserted for the signed-in
   `auth.uid()`, then browser opens the Google Play listing/referrer URL.

## Store visibility blocker

The web handoff target is:

```text
https://play.google.com/store/apps/details?id=com.billyyiu.almostswedish
```

A public probe returned HTTP 404 on 2026-05-21. Before claiming purchase is
working in production, verify one of:

- app is publicly published and the URL opens for a normal user, or
- internal/closed-testing track is active and the exact Google account used for
  test purchase is invited and can open the listing.

This site currently hands users to the Play listing with a referrer payload; it
is not itself a web card checkout. Final entitlement grant still requires store
receipt validation before writing `public.entitlements`.
