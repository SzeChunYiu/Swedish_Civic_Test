# 19 — Weekly Recap (Sunday Notification + Recap Screen)

Status: BLUEPRINT
Free for everyone (NOT a Pro feature) — it is a retention surface, not a
power feature, and gating it would defeat its purpose.
Depends on: existing `lib/storage/progressStore.ts`, optional `expo-notifications`
Owners: `MANAGER-build` (recap selector + scheduler), `MANAGER-uiux` (recap screen), `MANAGER-content` (copy variants)
Reviewer personas: lapsed-7-day user, study-grind user, notification-skeptic.

## What ships

A weekly local notification on the user's chosen evening (default: Sunday
19:00, user-configurable in settings, fully opt-in via existing consent
flow) + a corresponding **Weekly Recap** screen that summarizes the past
seven days. No accounts, no server — all data is already on device.

Tone: encouraging, factual, no shame. "You answered 87 questions this week,
mastered Chapter 3, mistakes down from 12 → 7." Never: "You only studied 2
days this week."

## What the recap shows

```ts
interface WeeklyRecap {
  weekStart: string;        // ISO date, local
  weekEnd: string;
  questionsAnswered: number;
  accuracy: number;         // 0..1
  chaptersTouched: string[];
  chapterNowMastered: string | null;  // first chapter to cross mastery threshold this week
  mistakesResolved: number; // wrongs answered correctly later in week
  streakDays: number;
  mockExamsTaken: number;
  bestMockScore: number | null;
  readinessDelta: number;   // change in readiness % since last week's recap
}
```

Computed by a pure selector `lib/learning/weeklyRecap.ts` over the existing
answer-event log + mastery + streak modules. No new storage.

## Notification content

Localized strings (Sv + En). Selected from a small pool to avoid repetition.
Examples:

- Sv: "Veckans översikt — 87 frågor besvarade, 1 kapitel klart."
- En: "Your week — 87 questions answered, 1 chapter mastered."

Sent via `expo-notifications` on a weekly trigger. NO push token, NO server
— local-only. Opt-in: default OFF, user enables in settings with a clear
"this is local, no tracking" reassurance line.

## Recap screen

`app/recap.tsx` reachable from the notification tap AND from a "View this
week" link on profile. Shows the WeeklyRecap stats as plain cards + a CTA
"Practice my weak chapter from this week" deep-linking practice filtered
by the weakest chapter touched.

History: last 8 weeks of recaps persisted to MMKV (~tiny). Profile shows a
"Past weeks" link → list view.

## Acceptance test (executable)

```bash
# 1. Selector exists
test -f lib/learning/weeklyRecap.ts
grep -q "interface WeeklyRecap" lib/learning/weeklyRecap.ts

# 2. Recap screen exists
test -f app/recap.tsx

# 3. Notification scheduling wired (opt-in, default off)
grep -qE "expo-notifications|scheduleNotificationAsync" lib/ -r
grep -qE "weeklyRecap.*enabled.*false|weeklyRecapEnabled: false" lib/storage/settingsStore.ts

# 4. Setting toggle present
grep -qE "weeklyRecap|Veckans|weekly recap" app/settings.tsx

# 5. No push token / no server (privacy invariant)
! grep -rqE "expo-server|pushToken|FCM|APNs" lib/learning/weeklyRecap.ts

# 6. Unit test with frozen clock
test -f tests/learning/weeklyRecap.test.ts

# 7. tsc + lint
npx tsc --noEmit && npm run lint
```

## Product source paths

`lib/learning/weeklyRecap.ts`, `lib/storage/settingsStore.ts`,
`app/recap.tsx`, `app/settings.tsx`, `tests/learning/`.

## Reviewer hooks

- `--kind functional` — frozen-clock test produces the same recap deterministically across 3 runs.
- `--kind user-sim` — lapsed-7-day user sees "Welcome back. Last week: …" with no shame copy.
- `--kind a11y` — notification + recap screen have proper a11y labels in Sv + En.
- `--kind language` — copy pool reviewed for tone (no urgency, no guilt) in both languages.
- `--kind data` — recap of a user with zero activity says "Quiet week — pick up where you left off?" not "You didn't study."

## Out of scope

- Email recap (no accounts, no server).
- Social-share weekly recap card (premature; revisit after referral lands).
- Daily push reminders (banned per teardown "do NOT copy" — Duolingo's
  guilt-trip notifications).
