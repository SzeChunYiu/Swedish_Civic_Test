# 06 — Learning and Gamification

## Goal

Make the app feel interactive and motivating without AI.

The app should feel like:

- Duolingo-style daily learning,
- driving-license theory test practice,
- flashcards,
- and a game-like progress journey.

## Learning modes

### 1. Learn Mode

Purpose: understand content.

Features:

- chapter summaries,
- Swedish + English explanations,
- glossary,
- audio button,
- practice after each section.

### 2. Practice Mode

Purpose: repeat and learn from mistakes.

Features:

- 5, 10, or 20-question sessions,
- immediate feedback,
- explanations,
- UHR references,
- XP.

### 3. Exam Mode

Purpose: simulate test pressure.

Features:

- Swedish-only by default,
- timed,
- no hints,
- no ads,
- results at end,
- topic breakdown.

### 4. Mistake Review

Purpose: convert weak areas into strengths.

Features:

- questions answered incorrectly,
- spaced repetition,
- “I know this now” action,
- weak-topic cards.

### 5. Flashcards

Purpose: learn Swedish civic vocabulary.

Examples:

- riksdag
- regering
- kommun
- region
- grundlag
- yttrandefrihet
- rättssäkerhet
- diskriminering
- välfärd
- skatt

## Gamification mechanics

| Mechanic | Description |
|---|---|
| XP | Earn points from practice |
| Levels | Level up by XP |
| Streak | Complete daily goal |
| Badges | Earn chapter badges |
| Chapter mastery | 0–100% per chapter |
| Exam readiness | Overall score estimate |
| Daily missions | Small daily tasks |
| Boss quiz | Hard quiz at chapter end |
| Mistake monster | Wrong answers return later |
| Map journey | Progress through Sweden-themed path |

## XP rules

Recommended MVP:

| Action | XP |
|---|---:|
| Correct answer | +10 |
| Wrong answer but completed | +2 |
| Read explanation | +2 |
| Complete quiz | +20 |
| Complete daily goal | +50 |
| Perfect 10-question quiz | +50 |
| Complete mock exam | +100 |

## Level formula

Simple:

```ts
export function getLevel(totalXp: number) {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}
```

## Mastery score

For each chapter:

```ts
chapterMastery =
  0.5 * accuracyScore +
  0.3 * coverageScore +
  0.2 * recencyScore
```

Where:

- accuracyScore = correct answers / total answers
- coverageScore = unique questions seen / total chapter questions
- recencyScore = recent practice bonus

## Exam readiness

Show as:

- Not ready yet: 0–49%
- Getting there: 50–69%
- Almost ready: 70–84%
- Strong preparation: 85–100%

Avoid saying "you will pass".

Use:

> Your practice score suggests strong preparation.

Do not use:

> You are guaranteed to pass.

## Daily missions

Examples:

- Answer 10 questions about democracy.
- Review 5 mistakes.
- Complete one flashcard set.
- Listen to 10 Swedish question audios.
- Complete one mini mock exam.

## Badges

Examples:

- Democracy Starter
- Law Learner
- Human Rights Hero
- Welfare Explorer
- History Explorer
- Mock Exam Finisher
- Seven-Day Streak
- Mistake Crusher

## Mini-games

### Match terms

Match Swedish terms to English meanings.

Example:

- `riksdag` → parliament
- `regering` → government
- `kommun` → municipality

### True/false speed round

10 quick questions with a timer.

### Fill-the-blank

Example:

`Demokrati betyder ____.`

### Boss quiz

After each chapter, user must complete a harder quiz.

## Motivation without manipulation

Good:

- celebrate learning,
- encourage consistency,
- make progress visible.

Avoid:

- shame,
- dark patterns,
- excessive notifications,
- making users watch too many ads,
- creating anxiety about citizenship outcomes.
