# Stripe web checkout setup for `almostswedish.se`

Architecture for the account-bound "Remove Ads" / "Premium" purchase on the
static site. **All code is in the repo already.** This file lists only the
account/credential/deploy steps the operator does (the "later" part).

## How it works

1. Signed-in user clicks a `[data-purchase-kind]` button (`site/purchase.js`).
2. Browser calls Edge Function **`create-checkout`** with the user's Supabase JWT.
3. The function creates a **Stripe Checkout Session** (Google Pay / Apple Pay /
   cards, `automatic_tax` on) and returns its URL; the browser redirects there.
4. After payment Stripe calls Edge Function **`stripe-webhook`**, which verifies
   the signature and upserts a row in **`public.entitlements`** (service role).
5. Back on the site, `purchase.js` reads `entitlements`, marks the plan owned,
   and switches ads off.

Until the steps below are done, `create-checkout` returns `not_configured` and
the button shows "Online purchases are not enabled yet" — nothing breaks.

## Code already in repo

- `supabase/migrations/0003_entitlements.sql` — `entitlements` table + RLS
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `site/purchase.js` — checkout + entitlement read + ad-free gating

## Operator steps (credentials / deploy)

### 1. Stripe account + products
- Create a Stripe account (Sweden). Get the **secret key** (`sk_live_…` / `sk_test_…`).
- Create two **one-time** Prices and copy their IDs (`price_…`):
  - Remove Ads — 29 SEK
  - Premium Lifetime — 59 SEK
- Enable **Stripe Tax** (Settings → Tax) and set each product's tax category to a
  digital-services code so EU VAT is computed at checkout.

### 2. Supabase: tables
In the SQL editor for project `uesfowwijbdlffyweyum`, run (if not already):
- `supabase/migrations/0003_entitlements.sql`
- `supabase/migrations/0002_purchase_intents.sql` (legacy; harmless to keep)

### 3. Supabase: Edge Function secrets
```bash
supabase login
supabase link --project-ref uesfowwijbdlffyweyum
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_xxx \
  STRIPE_PRICE_REMOVE_ADS=price_xxx \
  STRIPE_PRICE_PRO_LIFETIME=price_xxx \
  SITE_ORIGIN=https://almostswedish.se
# STRIPE_WEBHOOK_SECRET is added in step 5.
```
(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically — do not set them.)

**EU VAT toggle:** `automatic_tax` is OFF by default so your first test checkout
works immediately. Once you've set your Stripe Tax **origin address** and added a
**Swedish tax registration** (Stripe → Settings → Tax), enable it:
`supabase secrets set STRIPE_TAX_ENABLED=true`. Turning it on before tax setup is
complete makes `create-checkout` error.

### 4. Deploy the functions
```bash
supabase functions deploy create-checkout            # keep JWT verification ON
supabase functions deploy stripe-webhook --no-verify-jwt   # Stripe sends no Supabase JWT
```

### 5. Stripe webhook
- Stripe Dashboard → Developers → Webhooks → Add endpoint:
  - URL: `https://uesfowwijbdlffyweyum.supabase.co/functions/v1/stripe-webhook`
  - Event: **`checkout.session.completed`**
- Copy the endpoint's **Signing secret** (`whsec_…`) and set it:
  ```bash
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
  supabase functions deploy stripe-webhook --no-verify-jwt   # redeploy to pick it up
  ```

### 6. Verify end-to-end
1. Sign in on `https://almostswedish.se` (Google) — must NOT bounce to localhost
   (see `auth-purchase-live-check.md` → Supabase Site URL must be the prod domain).
2. Click "Remove ads — 29 kr" → Stripe Checkout opens with Google Pay/cards.
3. Pay with a Stripe **test card** (`4242 4242 4242 4242`) in test mode.
4. You return to `…/?purchase=success`; within a few seconds the button flips to
   "Ad-free — active ✓" (the webhook wrote the entitlement).
5. Confirm a row exists: `select * from public.entitlements;`

## EU VAT (you are the merchant — Stripe direct)
You chose Stripe direct, so you remit VAT yourself. Register for **EU OSS** (via
Skatteverket) and file the OSS return; Stripe Tax computes the per-country VAT,
Stripe Tax reports help you file. (A Merchant-of-Record like Paddle/Lemon Squeezy
would remove this obligation if you reconsider later.)

## Follow-up: ad-free enforcement vs auto-ads
`purchase.js` switches manual ad panels off for entitled users, but the AdSense
**auto-ads** loader is currently unconditional in `<head>` (added for AdSense
review). To make "Remove Ads" fully suppress auto-ads, gate the `<head>` loader
on `localStorage.smt_ad_free !== '1'` once the account is approved and serving —
or move the loader back to the consent-gated injector in `app.js`. Track this
before charging for "Remove Ads" in production.
