# 18 — Custom Study Plan (Test-Date Countdown)

Status: BLUEPRINT
Pro entitlement flag: `customStudyPlan` (already in `ProTierEntitlements`)
Depends on: 13_pro_tier.md, existing `lib/learning/examDate.ts` (currently 505 B — extending)
Owners: `MANAGER-build` (planner), `MANAGER-uiux` (home hero + onboarding step), `MANAGER-content` (copy)
Reviewer personas: panicking-2-weeks-out user, slow-and-steady-3-months user, missed-day user.

## What ships

User enters their real test date during onboarding (optional) or in settings.
Pro users see a generated study plan: "Test in 27 days · target 14 questions/day,
2 mock exams/week" with a per-day completion checkmark. Misses are absorbed
quietly (no guilt copy); the daily target re-balances against remaining days.

Free users see the countdown only ("23 days until your test") — no plan
generation, no per-day target. Soft upsell at the bottom: "Get a daily plan
with Pro 59 kr."

## Plan algorithm

Inputs:
- test date (ISO date, user-entered)
- remaining unmastered questions = total - mastered (from existing mastery
  selector in `lib/learning/mastery.ts`)
- remaining mocks goal: 6 full mock exams before test day (matches the
  "library of pre-built mocks" from competitive-teardown rec #2)
- intensity: casual / regular / serious (carries from existing onboarding
  daily-goal — competitive-teardown rec #6)

Output:
```ts
interface StudyPlan {
  testDate: string;          // ISO date
  daysRemaining: number;
  dailyQuestionTarget: number;
  weeklyMockTarget: number;
  estimatedReadinessOn(testDate): number;  // % from readiness selector
  generatedAt: string;
}
```

Algorithm (deterministic, no AI):
- `dailyQuestionTarget = max(5, ceil(remainingQuestions / max(1, daysRemaining - 2)))`
  — the `- 2` reserves the final two days for full-format mocks + light review.
- `weeklyMockTarget = min(2, max(1, floor((6 - mocksTaken) / weeksRemaining)))`
- Re-compute on every app open. Plan adapts as the user studies more or
  misses days; never shows "you fell behind by N days" — only "X/day now".

## Surfaces

- **Onboarding step** (after daily-goal selection): "When is your test?"
  with a date picker + "I haven't booked it yet" skip.
- **Home hero (Pro)**: ring + "Today: 11/14 questions · 1/2 mocks this week".
- **Home hero (Free)**: just the countdown card + soft upsell.
- **Settings**: edit test date, regenerate plan.

## Acceptance test (executable)

```bash
# 1. Flag wired (sanity)
grep -q "customStudyPlan" types/monetization.ts

# 2. examDate module extended
grep -qE "StudyPlan|generateStudyPlan" lib/learning/examDate.ts

# 3. Onboarding step asks for test date (optional)
grep -qE "testDate|examDate" app/onboarding.tsx

# 4. Home renders countdown for everyone, full plan only for Pro
grep -qE "daysRemaining|examDate|countdown" "app/(tabs)/home.tsx"
grep -qE "customStudyPlan|hasProEntitlement" "app/(tabs)/home.tsx"

# 5. Setting can edit/clear test date
grep -qE "examDate|testDate" app/settings.tsx

# 6. Plan unit test with frozen clock
test -f tests/learning/studyPlan.test.ts || grep -rqE "generateStudyPlan" tests/

# 7. tsc + lint
npx tsc --noEmit && npm run lint
```

## Product source paths

`lib/learning/examDate.ts`, `lib/learning/mastery.ts`, `app/onboarding.tsx`,
`app/(tabs)/home.tsx`, `app/settings.tsx`, `components/`, `tests/learning/`.

## Reviewer hooks

- `--kind functional` — change `Date.now` via test fixture; daily target
  rebalances after a 5-day miss.
- `--kind user-sim` — panicking-2-weeks-out persona sees a realistic target
  (not "answer 200/day"); the algorithm clamps to a humane upper bound.
- `--kind language` — no guilt copy in Sv or En ("X days behind" is banned).
- `--kind data` — Free users without Pro entitlement render only the
  countdown card; never the plan.

## Out of scope

- AI-generated study schedules — explicitly banned in CLAUDE.md.
- Push notifications for daily plan — covered by 19_weekly_recap.md (weekly
  cadence only; daily push is fatigue-inducing per teardown "do NOT copy").
