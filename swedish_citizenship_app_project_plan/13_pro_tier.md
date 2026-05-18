# 13 — Pro Tier (Lifetime 59 kr)

Status: BLUEPRINT (pending operator approval to extend GOAL.md after Remove-Ads ships)
Depends on: 08_monetization_ads.md (this supersedes the pricing table there), current Remove-Ads sprint
Owners: `MANAGER-build` (IAP wiring), `MANAGER-content` (Pro-feature copy/translations), `MANAGER-uiux` (paywall + locked-state UI)
Reviewer personas: cost-anxious immigrant, first-time IAP user, restore-on-new-device user, EU consent skeptic.

## What ships

A second non-consumable IAP product **`com.billyyiu.swedishcivictest.prolifetime`** priced **59 SEK** that unlocks a defined feature matrix. Existing Remove-Ads buyers (29 SEK) keep their entitlement and can upgrade to Pro for the price difference (handled outside IAP — see "Upgrade path" below; do NOT implement a 30 SEK product, that complicates restore).

Anchor pricing: 59 kr lifetime (one-time). No monthly. No subscription. One-shot test audience does not subscribe.

## Entitlements matrix

`PremiumEntitlements` in `types/monetization.ts` MUST be extended without breaking the existing Remove-Ads sprint acceptance test. Add new fields with safe defaults (`false`), do NOT rename existing fields.

| Flag (new or existing) | Free | Remove-Ads (29 kr) | Pro (59 kr) |
| --- | --- | --- | --- |
| `adsDisabled` (existing) | false | **true** | **true** |
| `unlimitedMockExams` (existing) | false | false | **true** |
| `fullMistakeReview` (existing) | false | false | **true** |
| `spacedRepetition` (new) | false | false | **true** |
| `nativeLangExplanations` (new) | false | false | **true** |
| `customStudyPlan` (new) | false | false | **true** |
| `notesExport` (new) | false | false | **true** |
| `predictedPassProbability` (new) | false | false | **true** |
| `confidenceSlider` (new) | false | false | **true** |
| `multiColorHighlights` (new — see 15) | false | false | **true** |

`isPremiumUser()` in `lib/monetization/premium.ts` MUST be updated to test `unlimitedMockExams && fullMistakeReview && spacedRepetition` so existing Remove-Ads buyers do NOT accidentally become "Pro" (Remove-Ads grants only `adsDisabled`).

A new helper `hasProEntitlement(e)` returns `e.unlimitedMockExams && e.fullMistakeReview && e.spacedRepetition`. Call sites that gate by "Pro" use this helper, not the raw flags, so we can change the gate-set later without code churn.

## Storage keys

- `monetization.removeAds.adsDisabled.v1` (existing — do not touch)
- `monetization.proLifetime.entitled.v1` (new — `'true'` when Pro IAP confirmed)
- `monetization.referral.proGrant.expiresAt.v1` (new — ISO8601, see 16_referral_google.md)

Effective Pro state at runtime: persisted Pro entitlement OR unexpired referral grant.

## Upgrade path for existing Remove-Ads buyers (29 kr → Pro 59 kr)

DO NOT create a 30 kr "upgrade" SKU. Both Apple and Google make multi-SKU upgrades messy for non-consumables. Instead:

1. Detect Remove-Ads ownership at paywall.
2. Show banner: "You already paid 29 kr — upgrade to Pro for 59 kr total (you save nothing on price, but get everything)." Honest copy, no dark pattern.
3. If they buy Pro: both entitlements coexist. Pro is the superset; no migration needed.

Acceptance: a user who owns Remove-Ads only sees the banner; restoring shows both entitlements after Pro purchase.

## Acceptance test (executable)

```bash
# 1. Pro product id + price wired
grep -q "com.billyyiu.swedishcivictest.prolifetime" lib/monetization/purchases.ts
grep -q "59 SEK" lib/monetization/purchases.ts

# 2. New entitlement flags exist on the type
grep -q "spacedRepetition:" types/monetization.ts
grep -q "nativeLangExplanations:" types/monetization.ts
grep -q "notesExport:" types/monetization.ts

# 3. hasProEntitlement helper exists and is used at gate sites
grep -q "hasProEntitlement" lib/monetization/premium.ts
# at least 3 call sites in app/components gate by hasProEntitlement (not raw flags)
test "$(grep -rE "hasProEntitlement\\(" app components | wc -l)" -ge 3

# 4. Remove-Ads acceptance still passes (regression bar)
grep -q "REMOVE_ADS_PRODUCT_ID" lib/monetization/purchases.ts
npm test -- monetization

# 5. Restore flow handles both SKUs
grep -qE "restorePurchases.*prolifetime|prolifetime.*restorePurchases" lib/monetization/purchases.ts

# 6. typescript + lint clean
npx tsc --noEmit && npm run lint
```

## Product source paths

`lib/monetization/`, `types/monetization.ts`, `components/`, `app/`, `tests/monetization/`.

## Required paywall UI: tier comparison table

The paywall MUST present a three-column comparison table — **Free / Ad-Free
(29 kr) / Pro (59 kr)** — so users can self-select. Hiding tier differences
behind a "Compare plans" link is a dark pattern; the table is the headline
of the paywall screen, not a footnote.

Canonical row content (Sv + En both required; copy is the single source of
truth in `lib/monetization/tierComparison.ts`):

| Row | Free | Ad-Free (29 kr) | Pro (59 kr) |
|---|---|---|---|
| Ads | shown at session boundaries | **none** | **none** |
| Chapter practice | unlimited | unlimited | unlimited |
| Mock exams | 3 / week | 3 / week | **unlimited** |
| Mistake review | last 20 | last 20 | **full history** |
| Spaced repetition | 3 cards / day | 3 cards / day | **unlimited** |
| Ebook highlights | yellow only | yellow only | **4 colors + notes** |
| Notes export (PDF / MD) | — | — | **yes** |
| Native-language explanations | sv / en | sv / en | **+ zh / ar / fa / so / ti / uk** |
| Custom study plan | — | — | **yes** |
| Predicted pass probability | — | — | **yes** |
| Confidence rating + calibration | — | — | **yes** |
| Audio question playback (TTS) | yes | yes | yes |
| Dyslexia font / text size / dark mode | yes | yes | yes |
| Price | free forever | **29 kr** one-time | **59 kr** one-time |

Rules for the table component (`components/TierComparisonTable.tsx`):

- Render the exact rows above from `tierComparison.ts`. No magic strings.
- Highlight the "Pro" column with the existing accent token; do NOT use a
  red/orange "best value" badge — calm, no urgency.
- The row content MUST be derived from real entitlement flags so future
  divergence between marketing copy and code is caught by a parity test
  (`tests/content-tier-comparison-parity.test.js`).
- Two CTAs below the table: "Buy Pro 59 kr" (primary) and "Just remove ads
  29 kr" (secondary). For users who already own Ad-Free: secondary becomes
  "You already own this — upgrade to Pro" (still tappable, no dark pattern).
- Sv + En i18n via existing pattern. Honest tone — never imply Free users
  will fail the test.

## Out of scope here

- The Pro features themselves (FSRS, highlights, native-lang explanations, audio ebook, referral) — see 14, 15, 16, 17.
- Real AdMob / RevenueCat account setup — operator runbook task.
- Family plan / annual SKU — explicitly deferred. 59 kr lifetime only for v1.1.

## Reviewer hooks

- `--kind functional` — purchase succeeds, entitlement persists across relaunch, restore works on a wiped device.
- `--kind user-sim` — cost-anxious-immigrant persona reads paywall in Swedish + English; copy must not feel pressuring.
- `--kind a11y` — paywall + locked-feature CTAs have a11y labels and are reachable by screen reader.
- `--kind data` — entitlement state is the ONLY source of truth for gating; no hardcoded "isProForDemo" flags.
