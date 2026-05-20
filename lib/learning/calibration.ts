// Calibration selector (blueprint 17).
//
// Given a stream of answer events tagged with a 1..5 confidence rating,
// bucket them by rating and compare the user's actual accuracy in each
// bucket against the accuracy a perfectly-calibrated user would have
// shown. Surfaces the metacognition insight ("you say 5/5 sure but are
// right 58% of the time").
//
// Pure function — no React, no storage. Consumers: app/calibration.tsx
// (Pro screen) and the FSRS grade-mapping bridge.

export type ConfidenceRating = 1 | 2 | 3 | 4 | 5;

export const CONFIDENCE_RATINGS = [1, 2, 3, 4, 5] as const;

export interface ConfidenceAnswerEvent {
  questionId: string;
  isCorrect: boolean;
  answeredAt: string;
  confidenceRating: ConfidenceRating;
}

export type ConfidenceAnswerEventInput = Omit<ConfidenceAnswerEvent, 'confidenceRating'> & {
  confidenceRating: unknown;
};

export interface CalibrationBucket {
  rating: ConfidenceRating;
  count: number;
  /** Actual accuracy in this bucket (0..1). null when count === 0. */
  actualAccuracy: number | null;
  /** Expected accuracy a perfectly-calibrated user would show: rating × 0.2. */
  expectedAccuracy: number;
  /** actualAccuracy - expectedAccuracy in percentage points. null when count === 0. */
  deltaPoints: number | null;
}

export interface CalibrationSummary {
  /** One bucket per rating, always 5 entries even when some are empty. */
  buckets: CalibrationBucket[];
  /** Total rated answers across all buckets. */
  totalRatedAnswers: number;
  /** True when totalRatedAnswers < 20 — UI should show "answer more to see". */
  isSparse: boolean;
  /**
   * Aggregate verdict code; UI maps to localized copy.
   *   over_confident   — average deltaPoints across non-empty buckets < -10
   *   well_calibrated  — average deltaPoints between -10 and +10
   *   under_confident  — average deltaPoints > +10
   *   insufficient     — isSparse, or no non-empty buckets
   */
  verdict: 'over_confident' | 'well_calibrated' | 'under_confident' | 'insufficient';
}

const SPARSE_THRESHOLD = 20;

function expectedFor(rating: ConfidenceRating): number {
  return rating * 0.2;
}

export function isConfidenceRating(value: unknown): value is ConfidenceRating {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    CONFIDENCE_RATINGS.includes(value as ConfidenceRating)
  );
}

export function normalizeConfidenceRating(value: unknown): ConfidenceRating | null {
  return isConfidenceRating(value) ? value : null;
}

export function generateCalibration(
  events: ReadonlyArray<ConfidenceAnswerEventInput>,
): CalibrationSummary {
  const buckets: CalibrationBucket[] = CONFIDENCE_RATINGS.map((rating) => ({
    rating,
    count: 0,
    actualAccuracy: null,
    expectedAccuracy: expectedFor(rating),
    deltaPoints: null,
  }));

  const correctByRating: Record<ConfidenceRating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const event of events) {
    const rating = normalizeConfidenceRating(event.confidenceRating);
    if (rating === null) continue;

    const bucket = buckets[rating - 1];
    bucket.count += 1;
    if (event.isCorrect) correctByRating[rating] += 1;
  }

  let totalRatedAnswers = 0;
  for (const bucket of buckets) {
    totalRatedAnswers += bucket.count;
    if (bucket.count === 0) continue;
    bucket.actualAccuracy = correctByRating[bucket.rating] / bucket.count;
    bucket.deltaPoints = Math.round((bucket.actualAccuracy - bucket.expectedAccuracy) * 100);
  }

  const isSparse = totalRatedAnswers < SPARSE_THRESHOLD;

  let verdict: CalibrationSummary['verdict'];
  if (isSparse) {
    verdict = 'insufficient';
  } else {
    const nonEmpty = buckets.filter((b) => b.count > 0 && b.deltaPoints !== null);
    if (nonEmpty.length === 0) {
      verdict = 'insufficient';
    } else {
      const avgDelta = nonEmpty.reduce((sum, b) => sum + (b.deltaPoints ?? 0), 0) / nonEmpty.length;
      if (avgDelta < -10) verdict = 'over_confident';
      else if (avgDelta > 10) verdict = 'under_confident';
      else verdict = 'well_calibrated';
    }
  }

  return { buckets, totalRatedAnswers, isSparse, verdict };
}

// ---- FSRS grade mapping bridge (blueprint 17 § FSRS grade mapping) ---------
// When a confidence rating is recorded, override the legacy isCorrect-only
// grade map. Returns 1..4 matching ReviewGrade in spacedRepetition.ts.

export function gradeFromConfidence(isCorrect: boolean, rating: unknown): 1 | 2 | 3 | 4 {
  if (!isCorrect) return 1; // always 'again'
  const normalizedRating = normalizeConfidenceRating(rating);
  if (normalizedRating === null || normalizedRating <= 3) return 3; // good
  return 4; // easy — confidence 4 or 5 AND correct
}

/**
 * Extra lapse-count penalty applied on a WRONG answer, scaling with how
 * confident the user was. Caller adds this to ReviewCard.lapses delta.
 *   confidence 1/2 → +0 (didn't claim certainty, normal penalty)
 *   confidence 3   → +1
 *   confidence 4   → +1
 *   confidence 5   → +2 (calibration penalty for "I'm sure" + wrong)
 */
export function lapsePenaltyForWrong(rating: unknown): number {
  const normalizedRating = normalizeConfidenceRating(rating);
  if (normalizedRating === null || normalizedRating <= 2) return 0;
  if (normalizedRating <= 4) return 1;
  return 2;
}
