# 17 — Confidence Slider + Metacognition Stats

Status: BLUEPRINT
Pro entitlement flag: `confidenceSlider` (already in `ProTierEntitlements`)
Depends on: 13_pro_tier.md (gating), 14_fsrs_review.md (FSRS engine — confidence informs grade mapping)
Owners: `MANAGER-build` (capture + store), `MANAGER-uiux` (slider + stats), `MANAGER-content` (insight copy)
Reviewer personas: overconfident-cram-night user, anxious-underestimator, metric-skeptic.

## What ships

Before answering each question (Pro mode only), an inline 1–5 confidence
slider: "How sure are you?" 1 = guess, 5 = certain. The rating is captured
alongside the answer. Result: surfaced as a **calibration plot** ("you said
4/5 sure but were right 56% of the time") — the headline metacognition
insight that Brainscape and Anki users pay for elsewhere.

This is a Pro-only feature because:
- It needs the full mistake history (full mistake review is Pro).
- Calibration stats are a "power user" surface, not a beginner one.
- It maps cleanly to FSRS grade selection (low confidence + correct → "hard";
  high confidence + wrong → "again" with a `lapses` boost).

## Data model

Extend per-question answer log:

```ts
interface AnswerEvent {
  questionId: string;
  isCorrect: boolean;
  answeredAt: string;
  // Pro: 1..5; Free: absent
  confidenceRating?: 1 | 2 | 3 | 4 | 5;
}
```

Persist in existing answer-log path. No new top-level store.

## FSRS grade mapping

When confidence is recorded, override the legacy `isCorrect → grade` map:

| Confidence | Correct | Wrong |
|---|---|---|
| 1 (guess) | `good` (3) | `again` (1) |
| 2 | `good` (3) | `again` (1) |
| 3 | `good` (3) | `again` (1) — and `lapses` +1 |
| 4 | `easy` (4) | `again` (1) — and `lapses` +1 |
| 5 (certain) | `easy` (4) | `again` (1) — and `lapses` +2 (calibration penalty) |

A user who is *certain* and wrong is shown again more aggressively than one
who guesses and is wrong — encourages honest self-rating. Same applies in
reverse: a user who guesses and is right doesn't get full credit (interval
grows slowly until confidence rises).

## UI

- Inline below the question, above options: 5 dots. Default = unselected.
- Tap a dot, then tap an option to submit. Both required to submit.
- Sv: "Hur säker är du?" / En: "How sure are you?"
- Tooltip on first use only: "This tunes your review schedule."
- Free users see the same slider in grayscale with a "Pro" lock chip — never
  blocks answering; you can still tap an option and submit without rating.

## Calibration screen

New `app/calibration.tsx` (Pro). For each confidence level 1..5, show:
- count of answers
- accuracy % achieved
- expected accuracy (the user's chosen rating × 20% if they were perfectly
  calibrated)
- one-line verdict ("Well calibrated — your 5s really are 95%+ correct" /
  "You overestimate — your 5s are only 58% correct").

Empty state: "Rate at least 20 questions to see your calibration."

## Acceptance test (executable)

```bash
# 1. Flag wired (already shipped — sanity)
grep -q "confidenceSlider" types/monetization.ts

# 2. AnswerEvent extended
grep -q "confidenceRating" lib/storage/ -r

# 3. UI component exists and respects gate
test -f components/ConfidenceSlider.tsx
grep -rqE "confidenceSlider|hasProEntitlement" components/ConfidenceSlider.tsx

# 4. Calibration screen
test -f app/calibration.tsx
grep -qE "calibration|confidence" app/calibration.tsx

# 5. FSRS grade mapping uses confidence when present
grep -qE "confidenceRating.*grade|grade.*confidenceRating" lib/learning/

# 6. tsc + lint
npx tsc --noEmit && npm run lint
```

## Product source paths

`lib/storage/`, `lib/learning/`, `components/`, `app/calibration.tsx`,
`tests/learning/calibration.test.ts`.

## Reviewer hooks

- `--kind functional` — answer 30 questions with mixed confidence; calibration screen renders correct counts + accuracy.
- `--kind user-sim` — overconfident-cram persona: their 5-rated wrongs trigger faster relearning loop than their 1-rated wrongs.
- `--kind a11y` — slider reachable by keyboard, screen reader announces "Confidence 3 of 5", labels in Sv + En.
- `--kind data` — Pro-off users can answer without selecting confidence; no required-field block.

## Out of scope

- Predicting performance on specific topics (covered by readiness score — competitive-teardown rec #1).
- Multi-dimensional confidence (e.g. "topic familiarity" separate from "this question") — too noisy for v1.1.
