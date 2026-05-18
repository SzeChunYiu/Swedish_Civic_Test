# 22 — User Dashboard with Visualizations

Status: BLUEPRINT
Hybrid gate: dashboard works for ALL users on local data. Signed-in
(referral-google) users get cloud-synced history. Pro users get the
analytics-depth sections (mock chart, time-of-day, mistake convergence).
Depends on: existing `lib/storage/progressStore.ts`, 13_pro_tier.md (gating
of advanced sections), 16_referral_google.md (Supabase auth for sync — OPTIONAL)
Owners: `MANAGER-build` (selectors + sync), `MANAGER-uiux` (chart components + layout), `MANAGER-content` (empty-state + insight copy)
Reviewer personas: data-loving-power-user, glance-only-checking-in user, no-progress-new-user.

## What ships

A new `/dashboard` route (also surfacable as a tab if we expand from 5→6 tabs)
that gives users a single page of charts and stats over their study history.
Replaces the current sparse `profile.tsx` stats with a real analytics surface,
in the same Notion-calm visual language as the rest of the app — never
"crypto dashboard" loud.

Six sections, gated as below. Every section degrades gracefully to a
"Not enough data yet — keep practicing" empty state.

### Free tier sections

1. **Activity heatmap** — GitHub-contributions-style 53-week grid colored
   by questions answered per day. Tap a day to drill into that day's
   sessions. Best motivation surface for visible streaks.
2. **Per-chapter progress** — horizontal bars: accuracy % and coverage % side
   by side per chapter. Sortable: by chapter order (default) / by weakest
   first. Tap a chapter to deep-link practice filtered to that chapter.
3. **Streak + XP timeline** — sparkline of daily XP for the last 30 days,
   plus the existing streak counter and current level. Cross-link to home.

### Pro tier sections (gated by `predictedPassProbability` Pro flag, since the
heaviest analytics are paired with predicted pass which is already Pro)

4. **Mock exam score chart** — line chart of mock scores over time, with
   the official pass-line as a horizontal reference. Best score badge.
   List of completed mocks with retake CTA.
5. **Time-of-day pattern** — 24-bin radial chart showing accuracy by hour
   answered. "You answer 8% better in the morning" insight.
6. **Mistake convergence** — area chart of unresolved-mistakes count over
   time, decreasing as the user resolves them. Big number: "23 mistakes
   resolved this week".

## Tech choices

- **Charts**: `victory-native` (already in the React Native ecosystem,
  works on Expo Web via `victory`). Avoid Recharts (web-only).
- **No new persistence**: all selectors derive from the existing
  `UserProgress` shape (`lib/storage/progressStore.ts`). Operator session
  has already shipped `lib/learning/dashboardStats.ts` with the pure
  selectors; this lane consumes them.
- **Empty states first**: every chart renders empty correctly with a CTA
  before any data exists.
- **Cloud sync (optional)**: when signed in via Supabase (per 16), mirror
  `UserProgress` to a `user_progress` table for cross-device continuity.
  Local-first; sync is best-effort, never blocks UI. This is a separate
  iteration; the dashboard MVP works fully offline.

## Surfaces

- New `app/dashboard.tsx` route (not a tab — kept reachable from profile
  and home to avoid disturbing the 5-tab layout per existing nav).
- Profile screen gets a "View dashboard →" CTA.
- Home hero summary chip: "You answered 87 questions this week" → opens
  dashboard.

## Acceptance test (executable)

```bash
# 1. Selectors exist + pure (operator session shipped these)
test -f lib/learning/dashboardStats.ts
grep -qE "dailyActivityHistogram|perChapterProgress|mockHistory|timeOfDayPattern|mistakeConvergence" lib/learning/dashboardStats.ts

# 2. Route exists
test -f app/dashboard.tsx

# 3. Pro gate on sections 4/5/6
grep -qE "hasProEntitlement|predictedPassProbability" app/dashboard.tsx

# 4. Free sections never gated
! grep -qE "hasProEntitlement.*ActivityHeatmap|hasProEntitlement.*PerChapterBars" components/dashboard/ -r 2>/dev/null

# 5. Empty states present (per-section)
grep -qE "emptyState|no data|inga data" components/dashboard/ -r

# 6. tsc + lint
npx tsc --noEmit && npm run lint
```

## Product source paths

`lib/learning/dashboardStats.ts`, `app/dashboard.tsx`,
`components/dashboard/*` (one component per section),
`tests/dashboard/`.

## Reviewer hooks

- `--kind functional` — user with 3 days of activity sees correct heatmap
  colors, correct per-day counts when tapped.
- `--kind user-sim` — no-progress-new-user persona: every section shows an
  encouraging empty state, never a broken chart.
- `--kind a11y` — every chart has a text-table accessibility fallback
  (`accessibilityLabel` enumerates the data points).
- `--kind data` — selector output is deterministic given the same
  `UserProgress` input + frozen clock; covered by unit tests.
- `--kind language` — chart titles, axis labels, and insight strings
  match Sv + En via existing i18n.

## Out of scope

- AI-generated insights ("your accuracy drops on Tuesdays because…") —
  banned per CLAUDE.md.
- Social compare ("you're better than 62% of users") — requires server
  aggregate; defer until referral + auth land AND we have enough users
  to make the comparison meaningful.
- PDF export of dashboard — interesting but defer; notes-export (15c)
  covers ebook notes already.
- Real-time WebSocket sync — local-first; sync (when it lands) is
  pull-on-foreground only.

## Why this is its own blueprint (not lumped into Pro tier 13)

The dashboard has visible value to **Free** users (heatmap + per-chapter +
streak) — it's the closest thing the app has to a "see your progress"
moment, which is the #1 retention surface in every benchmark in
competitive-teardown.md. Locking the entire dashboard behind Pro would be
a self-inflicted wound. Pro gates only the analytics-depth sections.
