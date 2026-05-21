// FSRS-lite spaced repetition.
//
// Simplified variant of the FSRS-4.5 algorithm (free-spaced-repetition-scheduler).
// Tracks difficulty (D ∈ [1,10]) and stability (S, days where retrievability ≈ 0.9)
// per card and produces a due date after each grading.
//
// Backward-compatible: the existing `getNextReviewAt({ isCorrect, correctStreak, answeredAt })`
// helper is preserved and delegates to the new engine, so progressStore.ts does not
// break. Migration to explicit four-button grading lands in a follow-up.

const DAY_MS = 24 * 60 * 60 * 1000;

// Retained for any consumer that imports the old constant. The FSRS engine no
// longer uses a fixed-step schedule — intervals come from stability.
export const spacedRepetitionSchedule: number[] = [1, 3, 7, 15, 30];

export type ReviewGrade = 1 | 2 | 3 | 4;
// 1 = again (lapse), 2 = hard, 3 = good, 4 = easy
export const REVIEW_GRADES = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 } as const;
const REVIEW_GRADE_VALUES: ReadonlySet<number> = new Set(Object.values(REVIEW_GRADES));

export type ReviewState = 'new' | 'learning' | 'review' | 'relearning';

export interface ReviewCard {
  questionId: string;
  difficulty: number; // 1..10
  stability: number; // days
  reps: number;
  lapses: number;
  state: ReviewState;
  lastReviewAt: string | null; // ISO8601
  dueAt: string; // ISO8601
}

const MIN_STABILITY = 1; // days
const MAX_STABILITY = 365 * 5;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / DAY_MS;
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();
}

export function isReviewGrade(value: unknown): value is ReviewGrade {
  return typeof value === 'number' && Number.isInteger(value) && REVIEW_GRADE_VALUES.has(value);
}

export function isCanonicalReviewTimestamp(value: unknown): value is string {
  return getCanonicalReviewTimestampMs(value) !== null;
}

function getCanonicalReviewTimestampMs(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString() === value ? timestamp : null;
}

function safeReviewTimestamp(value: unknown): string {
  return isCanonicalReviewTimestamp(value) ? value : new Date().toISOString();
}

function cardCanBeGraded(card: ReviewCard, isNew: boolean): boolean {
  if (!Number.isFinite(card.difficulty) || !Number.isFinite(card.stability)) return false;
  if (!Number.isFinite(card.reps) || !Number.isFinite(card.lapses)) return false;
  return isNew || isCanonicalReviewTimestamp(card.lastReviewAt);
}

// Retrievability under exponential-decay forgetting curve: R(t) = exp(-t/S).
export function retrievability(stabilityDays: number, elapsedDays: number): number {
  if (!Number.isFinite(stabilityDays) || stabilityDays <= 0) return 0;
  if (!Number.isFinite(elapsedDays) || elapsedDays < 0) return 0;
  return clamp(Math.exp(-elapsedDays / stabilityDays), 0, 1);
}

// Initial stability assigned to a brand-new card based on first grade.
const INITIAL_STABILITY: Record<ReviewGrade, number> = {
  1: 1, // again — relearn tomorrow
  2: 2,
  3: 4,
  4: 8,
};

export function createNewCard(
  questionId: string,
  now: string = new Date().toISOString(),
): ReviewCard {
  const dueAt = safeReviewTimestamp(now);
  return {
    questionId,
    difficulty: 5,
    stability: INITIAL_STABILITY[3],
    reps: 0,
    lapses: 0,
    state: 'new',
    lastReviewAt: null,
    dueAt,
  };
}

/**
 * Grade a card. Returns a NEW card record — does not mutate the input.
 * Pure function: deterministic given (card, grade, now).
 */
export function gradeCard(
  card: ReviewCard,
  grade: unknown,
  now: string = new Date().toISOString(),
): ReviewCard {
  const isNew = card.state === 'new' || card.lastReviewAt === null;
  if (!isReviewGrade(grade) || !isCanonicalReviewTimestamp(now) || !cardCanBeGraded(card, isNew)) {
    return card;
  }
  const elapsed = isNew ? 0 : Math.max(0, daysBetween(card.lastReviewAt!, now));
  const R = isNew ? 1 : retrievability(card.stability, elapsed);

  let nextDifficulty = card.difficulty;
  let nextStability = card.stability;
  let nextState: ReviewState = card.state;
  let nextLapses = card.lapses;

  if (isNew) {
    nextStability = INITIAL_STABILITY[grade];
    nextState = grade === 1 ? 'learning' : 'review';
    if (grade === 1) nextLapses = 0;
  } else {
    switch (grade) {
      case 1: // again
        nextDifficulty = card.difficulty + 1.5;
        nextStability = card.stability * 0.2;
        nextState = 'relearning';
        nextLapses = card.lapses + 1;
        break;
      case 2: // hard
        nextDifficulty = card.difficulty + 0.15;
        nextStability = card.stability * (1 + (1 - R) * 0.5);
        nextState = 'review';
        break;
      case 3: // good
        nextDifficulty = card.difficulty - 0.1;
        nextStability =
          card.stability * (1 + (1 - R) * 1.5 * ((MAX_DIFFICULTY + 1 - card.difficulty) / 10));
        nextState = 'review';
        break;
      case 4: // easy
        nextDifficulty = card.difficulty - 0.3;
        nextStability =
          card.stability * (1 + (1 - R) * 2.5 * ((MAX_DIFFICULTY + 1 - card.difficulty) / 10));
        nextState = 'review';
        break;
    }
  }

  nextDifficulty = clamp(nextDifficulty, MIN_DIFFICULTY, MAX_DIFFICULTY);
  nextStability = clamp(nextStability, MIN_STABILITY, MAX_STABILITY);

  // Round interval to whole days so dueAt lands at a stable point on the timeline.
  const intervalDays = Math.max(1, Math.round(nextStability));

  return {
    questionId: card.questionId,
    difficulty: nextDifficulty,
    stability: nextStability,
    reps: card.reps + 1,
    lapses: nextLapses,
    state: nextState,
    lastReviewAt: now,
    dueAt: addDays(now, intervalDays),
  };
}

// ---- Legacy v1.0 helper -----------------------------------------------------
// Pinned by scripts/validate-content.js + tests/content-spaced-repetition-schema.test.js.
// Behavior MUST exactly match the original 5-step schedule:
//   isCorrect=false → answeredAt + 1 day
//   isCorrect=true  → answeredAt + spacedRepetitionSchedule[clamp(correctStreak)]
// New v1.1 review code uses gradeCard() with an explicit ReviewGrade instead.

export function getNextReviewAt({
  isCorrect,
  correctStreak,
  answeredAt = new Date().toISOString(),
}: {
  isCorrect: unknown;
  correctStreak: unknown;
  answeredAt?: unknown;
}): string {
  const hasValidAnsweredAt = isCanonicalReviewTimestamp(answeredAt);
  const baseIso = hasValidAnsweredAt ? answeredAt : new Date().toISOString();
  const hasValidCorrectness = typeof isCorrect === 'boolean';
  const hasValidStreak =
    typeof correctStreak === 'number' &&
    Number.isFinite(correctStreak) &&
    Number.isInteger(correctStreak) &&
    correctStreak >= 0;
  const safeCorrectStreak = hasValidStreak ? correctStreak : 0;
  const answeredCorrectly =
    hasValidAnsweredAt && hasValidCorrectness && isCorrect === true && hasValidStreak;
  const scheduleIndex = answeredCorrectly
    ? Math.max(0, Math.min(safeCorrectStreak, spacedRepetitionSchedule.length - 1))
    : 0;
  const daysUntilReview = answeredCorrectly ? spacedRepetitionSchedule[scheduleIndex] : 1;
  return addDays(baseIso, daysUntilReview);
}

// ---- Queue selection helpers -------------------------------------------------

export function isDue(card: ReviewCard, now: string = new Date().toISOString()): boolean {
  const dueAt = getCanonicalReviewTimestampMs(card?.dueAt);
  const current = getCanonicalReviewTimestampMs(now);
  if (dueAt === null || current === null) return false;
  return dueAt <= current;
}

export function sortByDueAscending(a: ReviewCard, b: ReviewCard): number {
  const aTime = getCanonicalReviewTimestampMs(a?.dueAt);
  const bTime = getCanonicalReviewTimestampMs(b?.dueAt);
  const safeATime = aTime ?? Number.POSITIVE_INFINITY;
  const safeBTime = bTime ?? Number.POSITIVE_INFINITY;
  return safeATime - safeBTime;
}
