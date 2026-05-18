# 14 — Spaced Repetition (FSRS) Review Engine

Status: BLUEPRINT
Depends on: 13_pro_tier.md (gating), existing `lib/storage/mistakeReviewStore.ts`, existing `lib/learning/spacedRepetition.ts` (stub being replaced)
Owners: `MANAGER-build` (algorithm + store), `MANAGER-uiux` (Review tab + due-count surface), `MANAGER-content` (copy)
Reviewer personas: cram-night user (50 cards in 1 sit), absent user (returns after 14d), confidence-doubting user.

## What ships

Replace the existing 5-step exponential stub (`spacedRepetitionSchedule = [1, 3, 7, 15, 30]`) with **FSRS-lite** (Free Spaced Repetition Scheduler, simplified) per-question card state. Reuse the FSRS-4.5 algorithm as the reference; ship a pure-TS implementation (no native dep). Open-source reference: `github.com/open-spaced-repetition/ts-fsrs`.

A **Review tab** entry appears when due cards exist. Pro users see the full queue; Free users see "N cards due — unlock with Pro" with a sample of 3 cards available.

## Algorithm

Per question, persist a card:

```ts
interface ReviewCard {
  questionId: string;
  difficulty: number;     // 0..10, FSRS D
  stability: number;      // days, FSRS S
  reps: number;
  lapses: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
  lastReviewAt: string | null;   // ISO8601
  dueAt: string;                 // ISO8601
}
```

User rating after answering: `again | hard | good | easy` (mapped to FSRS grades 1..4). Calculate next D/S/dueAt. Persist.

Backward compatibility: the existing `getNextReviewAt({ isCorrect, correctStreak })` helper stays exported and now delegates to FSRS with `again` for wrong, `good` for correct. Call sites do not change in this batch; they migrate to explicit grading in a follow-up.

## Storage

New `lib/storage/reviewStore.ts`. Persist via `expo-secure-store` (small) or `AsyncStorage` (larger card decks) — pick AsyncStorage. Key: `learning.reviews.cards.v1`. Schema-versioned; future migrations bump `v2`.

Queue selector: `getDueCards(now: Date, limit?: number)` returns cards with `dueAt <= now`, sorted by `dueAt` ascending, with new cards interleaved at a 1:4 ratio (one new for every four reviews) up to a per-day cap (Free: 3 reviews total/day, Pro: unlimited).

## Surfaces

1. **Home banner**: "N reviews due today" + tap → Review screen. Hidden when 0.
2. **New `/review` route**: card-by-card flow, four rating buttons.
3. **End-of-practice nudge**: "These 3 questions are now scheduled for tomorrow."
4. **Profile stats**: "Cards mastered: N · Streak of reviews: D days."

## Free vs Pro gate

- Free: 3 due cards/day cap, schedule still tracked (don't punish them — they can upgrade and resume).
- Pro: unlimited, plus access to per-card stats (D, S, lapse count) for the metacognition crowd.

## Acceptance test (executable)

```bash
# 1. Stub replaced — FSRS-style state surfaced
grep -q "difficulty" lib/learning/spacedRepetition.ts
grep -q "stability" lib/learning/spacedRepetition.ts
grep -q "interface ReviewCard" lib/learning/spacedRepetition.ts

# 2. Review store exists
test -f lib/storage/reviewStore.ts
grep -q "learning.reviews.cards.v1" lib/storage/reviewStore.ts

# 3. /review route exists
test -f app/review.tsx || test -f "app/(tabs)/review.tsx"

# 4. Gating wired
grep -qE "spacedRepetition|hasProEntitlement" app/review.tsx 2>/dev/null \
  || grep -qE "spacedRepetition|hasProEntitlement" "app/(tabs)/review.tsx"

# 5. Backwards-compatible helper preserved
grep -q "getNextReviewAt" lib/learning/spacedRepetition.ts

# 6. Algorithm unit tests
test -f tests/learning/spacedRepetition.test.ts
npm test -- spacedRepetition

# 7. tsc + lint
npx tsc --noEmit && npm run lint
```

## Product source paths

`lib/learning/`, `lib/storage/`, `app/`, `components/`, `tests/learning/`.

## Reviewer hooks

- `--kind functional` — answer 5 questions, verify dueAt advances per FSRS, NOT per the old fixed schedule.
- `--kind user-sim` — cram-night persona answers 20 in a row; flow doesn't break, daily cap message is clear.
- `--kind data` — FSRS parameters match a known reference vector (committed test fixture).
- `--kind a11y` — rating buttons keyboard-accessible, color is NOT the only signal (also icon + label).

## Pickup status

**lib/learning/spacedRepetition.ts FSRS core algorithm is being implemented by the operator session in parallel with this blueprint.** Workers pick up: store, /review route, surfaces, tests, gating.
