# GOAL — Swedish_Civic_Test

Updated: 2026-05-17 09:10 by billy (operator)

## Sprint target (≤7 days)

Ship a **release-ready v1.0 that is ad-supported by default**: every published
build shows Google AdMob ads to free users, and the only way to remove ads is a
**one-time non-consumable in-app purchase "Remove Ads" priced 29 SEK**.
Everything in the ad + purchase path must be implemented, gated, and verified
**before** we submit to the stores. The token-driven UI/UX baseline from the
previous goal still holds (no hardcoded colors in `app/`/`components/`, a11y
labels, Playwright web smoke) — it is now a regression bar, not the headline.

Monetization model (authoritative):
- Free tier = ads ON (banner/native/interstitial/app-open per existing placements).
- "Remove Ads" = one-time non-consumable IAP, 29 SEK, sets `adsDisabled=true`.
- `adsDisabled` MUST be decoupled from `unlimitedMockExams`/`fullMistakeReview`
  (today `isPremiumUser` requires all three — fix so a Remove-Ads buyer gets
  ad-free without those, and ads never render when `adsDisabled` is true).
- No ads ever on the exam screen; no ads when `adsDisabled`.

## Acceptance test (executable + documented device gate)

```bash
# 1. ads enablement is env/remote-driven, NOT hardcoded false; real-unit path exists
grep -q "REAL_ADS_ENABLED" lib/monetization/ads.ts && ! grep -q "REAL_ADS_ENABLED_FOR_V1 = false" lib/monetization/ads.ts

# 2. ad gating unit tests pass: no ad when adsDisabled, none on exam screen,
#    none when ads disabled by config; banner shown for free entitlement
npm test -- monetization

# 3. IAP module exists: purchase + restore + persisted entitlement + product id wired
test -f lib/monetization/purchases.ts && grep -qiE "restore" lib/monetization/purchases.ts \
  && grep -rqi "remove.?ads" app components lib

# 4. consent + store compliance assets present
test -f publishing/public-site/app-ads.txt \
  && grep -rqiE "tracking-transparency|ATT|UMP|consent" lib app \
  && test -f publishing/admob-iap-setup-runbook.md

# 5. typescript + lint + content clean; web export does not crash with ad stubs
npx tsc --noEmit && npm run lint && npm run validate:content && npx expo export --platform web

# 6. UI/UX regression bar still green
test "$(grep -rE '#[0-9a-fA-F]{6}|rgba?\(' app components | wc -l)" -eq 0 \
  && npm run test:e2e -- tests/e2e/visual-smoke.spec.ts

# 7. privacy labels + data-safety updated to declare ads SDK + IAP
grep -qiE "admob|advertis|in-app purchase|IDFA|tracking" publishing/privacy-labels.md \
  && grep -qiE "admob|advertis|in-app purchase" publishing/google-play-data-safety.md
```

Steps 1–7 are factory-verifiable and MUST pass. The final gate is a **manual
device-QA sign-off** (EAS preview build on real iOS + Android): ads render with
test units, purchase removes ads + persists across relaunch, restore works, ATT
+ EEA consent prompts appear, no ad on exam screen. Record it in
`reports/release-ads-iap-device-qa.md` (template committed by the release lane).
Real AdMob unit IDs and store IAP product creation are operator/account tasks —
see `publishing/admob-iap-setup-runbook.md`.

## Product source paths (commits must touch ≥1 of these)

- `app/`
- `components/`
- `lib/`
- `types/`
- `data/`
- `tests/`

## Non-product paths (commits touching ONLY these are REVERTED by managers)

- `docs/`
- `codex-tasks/`
- `change_log/`
- `reports/` (except device-QA evidence + acceptance screenshots)
- `swedish_citizenship_app_project_plan/`
- `publishing/` (EXCEPTION: the `release` team owns these; for the release team only, `publishing/` IS a product path — incl. the AdMob/IAP runbook, app-ads.txt, privacy/data-safety)

## Banned iteration types

- queue-refresh, planner-audit-without-source-diff, validator-policy-refresh, manager-review-without-rejection-or-accept, docs-only-handoff, status-summary-as-deliverable, "intake" / "sync evidence" / "audit posture" iterations.

## PR rule (merge-gate — enforced by operator guard, not just hooks)

Opening **or** merging any pull request whose diff touches **zero** product
path (see "Product source paths" above; `publishing/` counts only for the
release team) is a BANNED iteration. "record handoff", "current audit",
"route refresh", "no-work audit", "staffing cycle" PRs do **not** count as
iterations and will be **auto-closed** by the operator PR guard before they
merge; any that already merged will be **auto-reverted** on `main`. A pane's
iteration is complete only when a product-path diff is merged. Handoffs go in
the pane journal, never a PR. This closes the server-side-merge loophole:
local pre-commit hooks do not run on GitHub merges, so this rule + the
operator guard are the merge-gate until branch protection or CI is restored.

## Productivity targets

- ≥6 source-touching commits per day across all civic teams combined.
- ≤20% of commits may have zero `app/components/lib/types/data/tests` lines (allow-meta tagged release/publishing work).
- Each MANAGER must reject at least one bad worker iteration per day or the operator will assume the manager is rubber-stamping.

## Next sprint preview — v1.1 Pro tier (NOT current sprint; queued for after v1.0 Remove-Ads ships)

Operator has approved nine blueprints in `swedish_citizenship_app_project_plan/`:

- `13_pro_tier.md` — Pro Lifetime IAP at **59 SEK** (one-time, no subscription) with extended entitlement matrix + **Free / Ad-Free / Pro comparison table** as paywall headline.
- `14_fsrs_review.md` — FSRS-lite spaced repetition (Pro feature; Free gets 3 cards/day).
- `15_ebook_highlights.md` — multi-color highlights + notes + export (Free gets yellow only; content prerequisite: long-form ebook bodies).
- `16_referral_google.md` — Google sign-in → 7-day Pro for both sides (depends on optional Supabase auth landing first).
- `17_confidence_slider.md` — confidence rating 1–5 + calibration screen (Pro).
- `18_custom_study_plan.md` — test-date countdown + auto-generated daily target (Pro; Free sees countdown only).
- `19_weekly_recap.md` — Sunday recap notification + screen (Free for everyone, opt-in, local-only).
- `20_mock_exam_realism.md` — tab-switch pause + color-shift timer + mid-exam flag + time-per-question heatmap (Free).
- `21_accessibility_bundle.md` — Atkinson Hyperlegible font + 4-step text size + audio playback rate (Free for everyone — never Pro-gated).
- `22_user_dashboard.md` — visualizations dashboard with activity heatmap, per-chapter bars, mock chart, time-of-day pattern, mistake convergence (Free gets sections 1–3, Pro gets 4–6).

Lane files in `codex-tasks/`: `pro-tier.txt`, `fsrs-review.txt`, `ebook-highlights.txt`, `referral-google.txt`, `confidence-slider.txt`, `custom-study-plan.txt`, `weekly-recap.txt`, `mock-exam-realism.txt`, `accessibility-bundle.txt`.

Lanes that have NO Pro/auth dependency and can start as soon as v1.0 ships:
- `weekly-recap`, `mock-exam-realism`, `accessibility-bundle`.

Lanes blocked on Pro IAP wiring (lane `pro-tier` iterations 1–2):
- `confidence-slider`, `custom-study-plan`, `fsrs-review` (UI portion).

Lane blocked on Supabase + Google sign-in:
- `referral-google`.

Lane blocked on long-form ebook content authoring:
- `ebook-highlights` (UI portion).

**Workers MUST NOT start v1.1 lanes until the current Remove-Ads v1.0 acceptance test passes on `main`.** The Pro tier extends the entitlement type without renaming existing fields, but accidental scope creep will break Remove-Ads acceptance. Off-sprint commits will be reverted.

Operator session is concurrently implementing two foundational pieces in parallel (out-of-band, does not count against worker quotas, tagged `[allow-meta]` on any non-product touches):
- FSRS algorithm core in `lib/learning/spacedRepetition.ts` (so the review-store lane has something to plug into).
- `lib/storage/highlightsStore.ts` skeleton (so the highlights UI lane has a store to call).
- Entitlement type extension in `types/monetization.ts` + `lib/monetization/premium.ts` (additive, Remove-Ads acceptance preserved).

## Out of scope (do NOT spend time on)

- AI tutor, AI-generated questions inside the app, community features.
- Creating the real AdMob account / real ad unit IDs / store IAP products (operator does these via the runbook).
- Final store submission + Expo/EAS login (external; operator will grant EAS access for preview builds).

## Updated by operator only

CEO must not edit this file. Request a new goal via `[CEO->OPERATOR NEEDS-GOAL]` in `codex-tasks/ceo-inbox.txt`.
