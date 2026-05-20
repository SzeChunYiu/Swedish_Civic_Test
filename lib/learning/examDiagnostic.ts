// Post-exam topic breakdown — competitive-teardown rec #3 (P0).
//
// "End every mock with a topic/chapter breakdown ('Geography 4/6, Democracy
// 2/8') and a one-tap 'Practice my weak topics' CTA, not just a score
// number."
//
// Takes a completed QuizSession (mode='exam') + question→chapter index and
// returns per-chapter performance + weakest chapters within this single mock.

import type { QuizSession } from '../../types/progress';

export interface ChapterBreakdown {
  chapterId: string;
  correct: number;
  total: number;
  /** correct/total, 0..1. */
  accuracy: number;
}

export interface ExamDiagnostic {
  /** Total correct across the exam. */
  correctCount: number;
  totalCount: number;
  /** correctCount / totalCount, 0..1. */
  overallAccuracy: number;
  /** Sorted by accuracy ascending (weakest first); deterministic id-tiebreaker. */
  perChapter: ChapterBreakdown[];
  /** Top-N weakest chapters from this exam only; default N=3. */
  weakestChapters: ChapterBreakdown[];
  /**
   * Per-question time spent (ms) in answer order. Empty when no answers had
   * timeSpentSeconds populated. Used by the 20d heatmap.
   */
  perQuestionMs: number[];
  /** ms-per-question median; null when perQuestionMs is empty. */
  medianMs: number | null;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

export interface ExamDiagnosticInput {
  session: QuizSession;
  questionChapterIndex: Record<string, string>;
  /** Top-N for weakestChapters. Default 3. */
  weakestN?: number;
}

export function buildExamDiagnostic(input: ExamDiagnosticInput): ExamDiagnostic {
  const weakestN = input.weakestN ?? 3;

  const buckets = new Map<string, { correct: number; total: number }>();
  let correctCount = 0;
  const perQuestionMs: number[] = [];

  for (const answer of input.session.answers) {
    if (answer.isCorrect) correctCount += 1;
    if (typeof answer.timeSpentSeconds === 'number' && answer.timeSpentSeconds > 0) {
      perQuestionMs.push(Math.round(answer.timeSpentSeconds * 1000));
    }
    const chapterId = input.questionChapterIndex[answer.questionId];
    if (!chapterId) continue;
    const bucket = buckets.get(chapterId) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (answer.isCorrect) bucket.correct += 1;
    buckets.set(chapterId, bucket);
  }

  const totalCount = input.session.answers.length;
  const overallAccuracy = totalCount === 0 ? 0 : correctCount / totalCount;

  const perChapter: ChapterBreakdown[] = Array.from(buckets.entries())
    .map(([chapterId, b]) => ({
      chapterId,
      correct: b.correct,
      total: b.total,
      accuracy: b.total === 0 ? 0 : b.correct / b.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || a.chapterId.localeCompare(b.chapterId));

  return {
    correctCount,
    totalCount,
    overallAccuracy,
    perChapter,
    weakestChapters: perChapter.slice(0, weakestN),
    perQuestionMs,
    medianMs: median(perQuestionMs),
  };
}
