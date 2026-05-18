# 2026-05-19 — batch17 — Dashboard blueprint + analytics selectors

## What changed

Operator session shipped (in parallel with worker lanes) the analytics selector
layer that underpins the dashboard, the readiness score, and the confidence
slider's calibration screen. Plus blueprint 22 + lane file for the dashboard
UI work that consumes them.

### Files

- `swedish_citizenship_app_project_plan/22_user_dashboard.md` — blueprint for
  the user dashboard (6 sections, hybrid Free/Pro gating, victory-native
  charts, optional cloud sync via Supabase).
- `codex-tasks/user-dashboard.txt` — lane file with 4 iterations.
- `lib/learning/dashboardStats.ts` — pure selectors:
  - `dailyActivityHistogram` — 53-week contribution-style bins
  - `perChapterProgress` — accuracy + coverage + lastAnsweredAt per chapter
  - `mockHistory` + `bestMockScore` — chronological exam-mode sessions
  - `timeOfDayPattern` — 24-bin hourly accuracy
  - `mistakeConvergence` — unresolved-wrongs curve over time
  - `xpSparkline` — synthetic daily XP for the streak surface
  - `dashboardSummary` — single-card top-line stats
- `lib/learning/readiness.ts` — `computeReadinessScore`. Weighted blend of
  rolling accuracy, chapter coverage, recency, and recent mock average.
  Verdict codes match `06_learning_and_gamification.md` band copy. Implements
  `competitive-teardown.md` rec #1 (P0).
- `lib/learning/calibration.ts` — `generateCalibration` for blueprint 17,
  plus `gradeFromConfidence` + `lapsePenaltyForWrong` FSRS bridge helpers.
- `tests/v1-1-pro-foundations.test.js` — extended to 30 tests covering all
  new selectors.

### GOAL.md

"Next sprint preview" updated with blueprint 22.

## Verification

- `npx tsc --noEmit` → clean
- `node --test tests/v1-1-pro-foundations.test.js` → 30/30 pass
- `npm run test:learning` → 7/7 (no regression)
- `npm run test:monetization` → 21/21 (no regression)

## What workers pick up from here

- **user-dashboard lane**: build `app/dashboard.tsx` + 6 `components/dashboard/*`
  chart components consuming these selectors. The hard work — data shaping,
  edge-case handling, deterministic output — is done.
- **fsrs-review lane** can now use `gradeFromConfidence` + `lapsePenaltyForWrong`
  when integrating the confidence slider with the review queue.
- **confidence-slider lane** can build `app/calibration.tsx` straight against
  `generateCalibration`.
- **competitive-teardown rec #1** (Readiness % home hero) is unblocked —
  there's a `computeReadinessScore` call and a `verdict` code to render.

## Why this work belongs in an operator session

Pure selectors are the foundational primitives multiple worker lanes plug
into. Shipping them as a single coherent layer avoids a chicken-and-egg
problem where every UI lane would otherwise stub its own selector. The
deterministic output is covered by a single test file workers can extend.
