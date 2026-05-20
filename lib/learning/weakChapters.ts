// Weak-chapter selector.
//
// Returns the top-N chapters where the user most needs practice. Combines
// accuracy (lower is weaker) with coverage (less-seen chapters can't be
// confidently ranked yet). Used by:
//   - dashboard's "Practice my weak topics" CTA (blueprint 22)
//   - post-exam "weak topics" CTA (competitive-teardown rec #3 P0)
//   - readiness-score component breakdown
//
// Pure function — independent of dashboardStats so this ships safely even
// when called from contexts where dashboardStats may or may not be wired.

import { validAnswerTimestampMs } from './answerDates';
import type { UserProgress } from '../../types/progress';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ChapterWeakness {
  chapterId: string;
  /** 0..1; null when no answers yet. */
  accuracy: number | null;
  /** 0..1; share of chapter questions touched at least once. */
  coverage: number;
  /** Total answers recorded for this chapter. */
  answers: number;
  /** 0..1 weakness score — higher means weaker. Drives the sort. */
  weaknessScore: number;
  /** True when this chapter has < `minAnswers` and weakness is partly synthetic. */
  isSparse: boolean;
}

export interface WeakChaptersInput {
  progress: UserProgress;
  chapters: ReadonlyArray<{ id: string; questionCount: number }>;
  questionChapterIndex: Record<string, string>;
  /** Minimum answers for non-sparse classification. Default 5. */
  minAnswers?: number;
  /** Recency window in days; older answers count half. Default 30. */
  recencyDays?: number;
  /** Hard cutoff date — answers older than this are ignored. Default ∞. */
  now?: Date;
}

/**
 * Compute weakness per chapter. The score is:
 *
 *   weakness = 0.7 * (1 - accuracy) + 0.2 * (1 - coverage) + 0.1 * stalenessBoost
 *
 * Sparse chapters (fewer than minAnswers answered) get a neutral 0.5 accuracy
 * placeholder so they show up in the "practice this" list — but the isSparse
 * flag lets the UI render them differently ("you haven't tried this yet").
 */
export function chapterWeaknesses(input: WeakChaptersInput): ChapterWeakness[] {
  const now = input.now ?? new Date();
  const minAnswers = input.minAnswers ?? 5;
  const recencyDays = input.recencyDays ?? 30;
  const recencyCutoff = new Date(now.getTime() - recencyDays * DAY_MS);

  const buckets = new Map<
    string,
    { correct: number; total: number; questionIds: Set<string>; lastAnsweredAtMs: number | null }
  >();
  for (const chapter of input.chapters) {
    buckets.set(chapter.id, {
      correct: 0,
      total: 0,
      questionIds: new Set(),
      lastAnsweredAtMs: null,
    });
  }

  for (const session of input.progress.sessions ?? []) {
    for (const answer of session.answers) {
      const answeredAtMs = validAnswerTimestampMs(answer.answeredAt, now);
      if (answeredAtMs === null) continue;
      const chapterId = input.questionChapterIndex[answer.questionId];
      if (!chapterId) continue;
      const bucket = buckets.get(chapterId);
      if (!bucket) continue;
      bucket.total += 1;
      if (answer.isCorrect) bucket.correct += 1;
      bucket.questionIds.add(answer.questionId);
      if (bucket.lastAnsweredAtMs === null || answeredAtMs > bucket.lastAnsweredAtMs) {
        bucket.lastAnsweredAtMs = answeredAtMs;
      }
    }
  }

  return input.chapters.map((chapter): ChapterWeakness => {
    const bucket = buckets.get(chapter.id)!;
    const accuracy = bucket.total === 0 ? null : bucket.correct / bucket.total;
    const coverage =
      chapter.questionCount === 0 ? 0 : bucket.questionIds.size / chapter.questionCount;
    const isSparse = bucket.total < minAnswers;

    // Sparse → neutral 0.5 effective accuracy so it ranks "moderately weak" and surfaces.
    const effectiveAccuracy = accuracy === null ? 0.5 : isSparse ? 0.5 : accuracy;

    // Staleness: 0 when last answered within recency window, ramps to 1 by 90d idle.
    let stalenessBoost = 0;
    if (bucket.lastAnsweredAtMs !== null) {
      const last = new Date(bucket.lastAnsweredAtMs);
      if (last < recencyCutoff) {
        const daysIdle = (now.getTime() - last.getTime()) / DAY_MS;
        stalenessBoost = Math.min(1, (daysIdle - recencyDays) / 60);
      }
    } else {
      stalenessBoost = 1;
    }

    const weaknessScore =
      0.7 * (1 - effectiveAccuracy) + 0.2 * (1 - coverage) + 0.1 * stalenessBoost;

    return {
      chapterId: chapter.id,
      accuracy,
      coverage,
      answers: bucket.total,
      weaknessScore,
      isSparse,
    };
  });
}

/**
 * Return the top N weakest chapters sorted by descending weakness. Stable
 * ordering: ties break on chapter id ascending so output is deterministic.
 */
export function topWeakChapters(input: WeakChaptersInput, n = 3): ChapterWeakness[] {
  const all = chapterWeaknesses(input);
  return all
    .slice()
    .sort((a, b) => b.weaknessScore - a.weaknessScore || a.chapterId.localeCompare(b.chapterId))
    .slice(0, n);
}
