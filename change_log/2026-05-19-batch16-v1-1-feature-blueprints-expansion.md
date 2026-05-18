# 2026-05-19 — batch16 — v1.1 feature blueprints expansion

## What changed

Operator session added five additional v1.1 feature blueprints + lane
files after carefully checking existing artifacts for overlap. Updated
blueprint 13 to add the user-requested **Free / Ad-Free / Pro comparison
table** as a required paywall component (not a "Compare plans" disclosure).

## Triage summary — what was NOT newly blueprinted because it already exists

Items from the brainstorm intentionally NOT given new blueprints; cited
existing artifacts that already cover them:

| Brainstorm item | Already lives in |
|---|---|
| Streak with grace days | `competitive-teardown.md` rec #5 (P0); `06_learning_and_gamification.md` |
| Predicted pass probability / Readiness % | `competitive-teardown.md` rec #1 (P0); flag in `ProTierEntitlements` |
| Daily challenge / Quick 5 | `competitive-teardown.md` rec #23 (P1) |
| Achievements / Badges | `06_learning_and_gamification.md` § Badges; `delight.txt` |
| "Did you know?" fact bubbles | `delight.txt` + `docs/parallel-sessions/delight.md` (FACT-BUBBLE) |
| Native-language explanations | Entire `LANGUAGE` lane (`docs/parallel-sessions/language.md`) |
| Mock exam topic breakdown | `competitive-teardown.md` rec #3 (P0) |
| Mock exam pause/resume + history | `competitive-teardown.md` rec #13 (P1) |
| TTS voiceover | `competitive-teardown.md` rec #10 (P1) |
| Leaderboard | **Explicitly rejected** in teardown "do NOT copy" — skipped |

## Newly added blueprints

- `17_confidence_slider.md` — confidence 1–5 + calibration screen (Pro).
  Maps to FSRS grade selection so honest self-rating tunes the review queue.
- `18_custom_study_plan.md` — test-date countdown + auto-balanced daily
  target (Pro full plan, Free countdown only). No AI scheduling — pure
  deterministic algorithm.
- `19_weekly_recap.md` — Sunday recap notification + screen (Free for
  everyone, opt-in, local-only — no push token, no server).
- `20_mock_exam_realism.md` — four small additions to exam.tsx (Free):
  - 20a focus-loss pause + count + modal
  - 20b color-shift timer (reduced-motion safe, with a11y label updates)
  - 20c mid-exam question flag with pre-submit review drawer
  - 20d time-per-question heatmap on results
- `21_accessibility_bundle.md` — **never Pro-gated** by invariant:
  - 21a Atkinson Hyperlegible toggle (better evidence than OpenDyslexic)
  - 21b 4-step text-size stepper (compact / standard / large / x-large)
  - 21c slow-down audio playback (0.5 / 0.75 / 1.0 / 1.25×)

## Updated blueprint

- `13_pro_tier.md` § Required paywall UI — new **Free / Ad-Free / Pro
  comparison table** spec. The table is rendered as the headline of
  `<ProPaywall />` — not behind a disclosure — with a parity test that
  catches drift between marketing copy and real entitlement flags.

## Newly added lane files

- `codex-tasks/confidence-slider.txt`
- `codex-tasks/custom-study-plan.txt`
- `codex-tasks/weekly-recap.txt`
- `codex-tasks/mock-exam-realism.txt`
- `codex-tasks/accessibility-bundle.txt`

Updated `codex-tasks/pro-tier.txt` with Iteration 4 covering the comparison
table component + parity test.

## GOAL.md update

"Next sprint preview" v1.1 block updated with the five additional blueprints,
their lane files, and dependency classification (which lanes can start now,
which are blocked on Pro IAP / Supabase auth / ebook content).

## Verification

No new code shipped in this batch — blueprints + lane files only.
- `npx tsc --noEmit` → clean (no source changes)
- Existing pinned schema tests untouched, still green from batch15.

## Why this work belongs in an operator session

Triage + blueprint authoring is operator/bridge work per
`Swedish_Civic_Test/CLAUDE.md`. Implementation of the features themselves
goes to worker lanes; the blueprints + acceptance tests + reviewer hooks
are the bridge between user intent and worker execution.
