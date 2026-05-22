# GOAL — Swedish_Civic_Test

Updated: 2026-05-21 by billy (operator) — NOW BUILDING THE FINAL VERSION (v1.1). The "no-account MVP" scope is SUPERSEDED: account/sign-in (Supabase + Google) and the full Pro tier + all v1.1 lanes are IN SCOPE and ACTIVE now. v1.0 Remove-Ads + Source-Provenance must not regress.

## 🛑 VISUAL DESIGN FROZEN — operator directive 2026-05-22 (P0)

The visual design / layout of BOTH the static site (`site/`) and the native app is **LOCKED**. The "card/box" redesign overran (`site/styles.css` ballooned 5.2k→12.7k lines, 64→431 card rules) and has been reverted on the live site. Effective immediately, **all lanes, all workers**:

- **Do NOT** add/modify/"polish" cards, boxes, frames, borders, shadows, chips, surfaces, radii, spacing, or any layout/visual styling in `site/styles.css`, `site/*.html`, `app/`, `components/`, or `lib/theme/`. Such commits are **reverted on sight**.
- **No** "Polish X box/card/frame", "card depth", "focus box", "design-token", or visual-restyle iterations of any kind.
- The **UIUX lanes are SUSPENDED**: `uiux-components`, `uiux-design-tokens`, `uiux-manager`, `uiux-motion-a11y`, `uiux-screens`. Stop staffing and iterating them. CEO/managers must not queue UI/visual tasks.
- **EVERYTHING ELSE CONTINUES UNCHANGED**: content, ebook provenance, pro-tier, fsrs-review, data-integrity, language/i18n, mock-exam, bug fixes, functional accessibility (ARIA/semantics/labels only — **no visual restyling**). Functional work is unaffected.
- This freeze is operator-owned and stays until the operator lifts it here.

## Source-Provenance Contract (P0 — every release)

Every user-visible piece of factual content MUST carry a visible provenance
marker telling the user where it came from. This is non-negotiable because
the bank is currently 169 UHR-cited + 676 editorially derived (~80% non-UHR),
and the app's app-store posture is "unofficial study tool" — users must
never be misled into believing derived content is from UHR.

### Questions (DONE in PR #1927, regression bar)

- Schema field `questionProvenance` ∈ {`uhr`, `derived`, `editorial`}.
- `site/practice.js` renders a `provenanceBadge()` on every question.
- Unmarked questions fall back to `derived` (NOT `uhr`).
- Setting `smt_question_sources` ∈ {`all`, `uhr`} restricts pool. UI in
  Settings → Question sources. Mock + practice + mix all respect it.

### Ebook (TO DO — worker iterations must close this gap)

The ebook currently renders a single global "Editorial" badge per chapter
(`renderEbookProvenanceBadge` in `site/ebook.js`). That's not enough. Each
chapter is a mix of UHR-paraphrased material and original editorial
commentary, and the user has no way to tell which is which.

Required per chapter:

1. **Per-fact-box source citations** (mostly done via `ebookFactBox(lang,
   heading, facts, sourceKeys)` — sourceKeys map into
   `EBOOK_FACTBOX_SOURCE_NOTES` with `label`+`url`+`retrievedDate`). Audit
   every existing fact box; every numeric fact / agency name / law citation
   MUST pass a non-default `sourceKeys` array (no silent default to
   `uhrStudyMaterial`).

2. **Per-section provenance footnotes**. Each prose section in a chapter
   needs one of: `[UHR §x.y, p.N]` (paraphrases Sverige i fokus) /
   `[SCB, retrieved 2026-05-19]` / `[editorial commentary]`. Render as
   superscript footnote markers in the body and a footnote list at the
   chapter foot. Reuse the `sourceLink()` helper.

3. **Chapter-level provenance label**. Replace the single Editorial badge
   with a per-chapter mix label like "Sources: UHR (12 cites) · SCB (2) ·
   Riksbank (1) · Editorial (3)" so a user sees the citation density before
   they start reading. Pull counts from the rendered footnote list.

4. **Acceptance test**:

   ```bash
   # No chapter renders a fact box without a non-default sourceKeys.
   ! grep -nE "ebookFactBox\([^,]+,[^,]+,[^,]+\)\s*\)" site/ebook.js
   # Every chapter exposes at least one non-UHR source key (proves
   # heterogeneity is shown, not faked).
   for ch in 1 2 3 4 5 6 7 8 9 10 11 12 13; do
     node -e "/* render chapter $ch, assert footnote list has ≥1 entry */"
   done
   ```

5. **Worker rule**: any ebook content commit (`site/ebook.js`,
   `content/ebook/*`) that adds a paragraph without also adding a footnote
   citation is REJECTED by the MANAGER as undocumented content.

### Sources page copy (DONE in PR #1927, regression bar)

`/sources` page accurately states the 169 / 676 split and tells users about
the UHR-only setting. Workers must keep these numbers in sync with reality
when the question bank grows — `npm test -- content-sources-page-parity`
gates this.



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

## CURRENT SPRINT — v1.1 final version (ALL lanes ACTIVE NOW)

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

FOUNDATION lane — build FIRST (unblocks `referral-google` and gates the purchase). Restore the account/sign-in surface that was deleted in `dc8fecf00` for the old MVP: recover the removed files from `dc8fecf00^` (`app/(auth)/sign-in.tsx`, `app/account.tsx`, `app/auth/callback.tsx`, `components/auth/*`, `lib/auth/*`, `lib/supabase.ts`) AS REFERENCE and rebuild them against the CURRENT codebase (Supabase optional sign-in with Google/Apple). Then `referral-google` proceeds.

Lane blocked on long-form ebook content authoring:
- `ebook-highlights` (UI portion).

**v1.1 lanes are ACTIVE NOW — build them.** v1.1 is no longer gated behind v1.0; v1.0 Remove-Ads + Source-Provenance must keep passing (do not regress them). The Pro tier extends the entitlement type ADDITIVELY (do not rename existing fields). The no-account guard `scripts/native-account-scope.test.js` has been REMOVED because account/sign-in is now in scope.

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
