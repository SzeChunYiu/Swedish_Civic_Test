# 2026-05-19 — batch15 — v1.1 Pro Tier foundations (operator session, in parallel with worker lanes)

## What changed

Operator session (per `GOAL.md` § "Next sprint preview — v1.1 Pro tier") shipped
the foundational additive layer for the v1.1 Pro tier rollout. This work runs
ALONGSIDE worker lanes (does not consume team quota), is strictly additive, and
does NOT alter the v1.0 Remove-Ads acceptance contract.

### Files

- `types/monetization.ts` — added `ProTierEntitlements` interface extending
  `PremiumEntitlements` with seven optional Pro-only flags. `PremiumEntitlements`
  itself is byte-equivalent to v1.0 (validator schema pin preserved).
- `lib/monetization/premium.ts` — added `PRO_LIFETIME_ENTITLEMENTS` constant,
  `hasProEntitlement()` gate, `unionEntitlements()` merger. `FREE`/`PREMIUM`/
  `REMOVE_ADS` literals + `isPremiumUser()` legacy gate unchanged.
- `lib/learning/spacedRepetition.ts` — added FSRS-lite engine (`ReviewCard`,
  `ReviewGrade`, `gradeCard`, `createNewCard`, `retrievability`, queue helpers).
  Legacy `getNextReviewAt()` + `spacedRepetitionSchedule` unchanged.
- `lib/storage/highlightsStore.ts` — new MMKV-backed Zustand store for ebook
  highlights, with per-chapter indexing and Free/Pro color-allowlist helper.

### Blueprints + lane files

- `swedish_citizenship_app_project_plan/13_pro_tier.md` (Pro IAP 59 SEK)
- `swedish_citizenship_app_project_plan/14_fsrs_review.md` (FSRS review queue)
- `swedish_citizenship_app_project_plan/15_ebook_highlights.md` (highlights +
  notes — content prerequisite flagged)
- `swedish_citizenship_app_project_plan/16_referral_google.md` (Google login →
  7-day Pro grant; Supabase auth prereq)
- `codex-tasks/pro-tier.txt`
- `codex-tasks/fsrs-review.txt`
- `codex-tasks/ebook-highlights.txt`
- `codex-tasks/referral-google.txt`

### GOAL.md

Extended with a "Next sprint preview" block. Workers MUST NOT start v1.1 lanes
until v1.0 Remove-Ads acceptance passes on `main`.

## Verification

- `npx tsc --noEmit` → clean
- `npm run test:learning` → 7/7 pass
- `npm run test:monetization` → 21/21 pass
- `tests/architecture-public-exports.test.js` → green (new exports are additive,
  test enforces "no missing", not "no extras")
- `tests/content-spaced-repetition-schema.test.js` → green
- `tests/content-premium-entitlements-parity.test.js` → green
- lint clean for all four new/edited files

## What is explicitly NOT done in this batch

- IAP wiring for `com.billyyiu.swedishcivictest.prolifetime` (lane `pro-tier.txt`
  iteration 2 — worker owns).
- Review store / `/review` route / surfaces (lane `fsrs-review.txt` — worker owns).
- Highlights UI in `app/chapter/[chapterId].tsx` (depends on ebook content
  prerequisite — see 15_ebook_highlights.md § 15a).
- Supabase auth + Google sign-in (lane `referral-google.txt` — worker owns).
- Notes export PDF/Markdown (lane `ebook-highlights.txt` iteration 4).

## Reason for the operator pickup

These four pieces are foundational primitives that worker lanes plug into.
Shipping them in-band as a single coherent additive layer avoids a chicken-and-egg
problem where every worker lane would otherwise stub its own copy of the same
types/algorithm. Per `GOAL.md` § "Next sprint preview", this counts as
out-of-band operator infra and does not consume team productivity quota.
