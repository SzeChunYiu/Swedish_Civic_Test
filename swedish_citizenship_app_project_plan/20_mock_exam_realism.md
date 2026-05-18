# 20 — Mock Exam Realism Polish

Status: BLUEPRINT
Free feature (no Pro gate — exam realism is a trust/credibility surface, not a paywall)
Depends on: existing `app/(tabs)/exam.tsx` (28 KB, substantial), `components/MockExamStatusBar.tsx`, GOAL.md rule "no ads on exam screen"
Related: competitive-teardown.md rec #2 (mock library — separate work), #3 (topic breakdown — separate work), #13 (pause/resume — separate work)
Owners: `MANAGER-build` (focus + flag state), `MANAGER-uiux` (timer color, heatmap rendering)
Reviewer personas: realistic-test-day persona, cheater-attempter (tab-switching), reviewer-of-results.

## What ships — four small features, one batch

These are the mock-exam polish items that DON'T already have prioritized
recs in `competitive-teardown.md`. The four big P0/P1 items (mock library,
topic breakdown, pause/resume, "X to pass" framing) ship under teardown
ownership; this blueprint adds the realism + analysis layer on top.

### 20a — Tab-switch / app-background pause + warning

When the app loses focus during a mock exam:
- timer pauses immediately
- a modal returns on resume: "You switched away. The real test doesn't
  allow this. Your time was paused."
- the event is logged to the mock-exam result so the user can see "1 tab
  switch during this mock" on the result screen — honesty, not penalty
- in "Realistic mode" toggle (settings): timer does NOT pause and the
  switches are counted as the only consequence. Pure-practice mode pauses.

Implementation: `AppState` listener in `app/(tabs)/exam.tsx`, count to
`MockExamResult.focusBreaks`.

### 20b — Color-shift timer

The timer changes color as time runs out:
- green: > 50% of total time
- yellow: 25–50%
- red: < 25%

Uses existing theme tokens (`colors.text` neutral → `colors.warning` orange
→ `colors.danger` red). Respects reduced-motion (no flashing). A11y label
updates: "12 minutes remaining" → "12 minutes remaining, time running low".

### 20c — Mid-exam question flag

Each question has a "Flag for review" toggle (📌 icon, no text-only).
Flagged questions appear in a slim drawer at exam end *before* submit:
"You flagged 3 questions — review them?" One-tap jump back to each.

Persists in `MockExamSession.flaggedQuestionIds[]`. NOT visible after
submit (cleaner result screen).

### 20d — Time-per-question heatmap (post-exam analysis)

On the result screen, a horizontal strip of cells (one per question) colored
by time spent vs. the median time per question:
- gray: < 50% median (rushed — may have skipped)
- normal: 50–150% median
- amber: 150–250% median (over-thought)
- red: > 250% median (stuck)

Tap a cell → jumps to that question + your answer + the correct answer.
Adds an "I spent too long on these" diagnostic that no Swedish-test app
ships today.

## Acceptance test (executable)

```bash
# 20a — focus listener wired, modal copy present
grep -qE "AppState.*addEventListener|useAppState" "app/(tabs)/exam.tsx"
grep -qE "focusBreaks|switchedAway" types/progress.ts
grep -qE "switched away|växlade" "app/(tabs)/exam.tsx" components/

# 20b — timer color tokens
grep -qE "timer.*color|colorByRemaining|warningPalette" components/MockExamStatusBar.tsx

# 20c — flag state
grep -qE "flaggedQuestionIds|flagForReview" "app/(tabs)/exam.tsx" types/

# 20d — heatmap on results
grep -qE "timePerQuestion|TimeHeatmap" components/ResultSummary.tsx

# 20e — exam result schema extended (focusBreaks, perQuestionMs, flagged)
grep -qE "perQuestionMs|focusBreaks" types/progress.ts

# 20f — realistic-mode setting
grep -qE "examRealisticMode|realisticMode" lib/storage/settingsStore.ts

# 20g — GOAL.md invariant preserved (no ads on exam)
! grep -rqE "AdComponent|<Banner" "app/(tabs)/exam.tsx"

# tsc + lint
npx tsc --noEmit && npm run lint
```

## Product source paths

`app/(tabs)/exam.tsx`, `components/MockExamStatusBar.tsx`,
`components/ResultSummary.tsx`, `types/progress.ts`,
`lib/storage/settingsStore.ts`, `tests/exam/`.

## Reviewer hooks

- `--kind functional` — switch apps mid-mock; modal appears; switch count
  shows on result.
- `--kind user-sim` — cheater-attempter tries to use a second device to look
  up answers; switch count surfaces honestly without "you cheated" copy.
- `--kind a11y` — color-shift timer also has a textual label change for
  screen readers; not color-only.
- `--kind a11y` — heatmap cells have a11y labels "Question 14, 47 seconds,
  over the median".
- `--kind functional` — flag drawer appears at submit only when flagged > 0.

## Out of scope

- Cheat-prevention beyond honest counting (no camera, no remote proctoring).
- Server-side mock-history leaderboards (banned per teardown "do NOT copy").
