// Dashboard selectors (blueprint 22).
//
// Pure functions over UserProgress. No storage writes, no React state.
// The UI lane in `app/dashboard.tsx` + `components/dashboard/*` consumes
// these to render victory-native charts.

import { getLocalDateKey } from './streaks';
import type { QuizAnswer, QuizSession, UserProgress } from '../../types/progress';

const DAY_MS = 24 * 60 * 60 * 1000;

// ----------------------------------------------------------- daily activity

export interface DailyActivityBin {
  /** Local date key YYYY-MM-DD. */
  date: string;
  /** Number of question answers landed on this day. */
  count: number;
}

/**
 * Produce a contiguous run of daily bins from `daysBack-1` ago through today,
 * inclusive (so passing 7 returns 7 entries).
 */
export function dailyActivityHistogram(
  progress: UserProgress,
  options: { daysBack: number; now?: Date } = { daysBack: 53 * 7 },
): DailyActivityBin[] {
  const now = options.now ?? new Date();
  const counts = new Map<string, number>();

  for (const session of progress.sessions ?? []) {
    for (const answer of session.answers) {
      const date = new Date(answer.answeredAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = getLocalDateKey(date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const bins: DailyActivityBin[] = [];
  for (let offset = options.daysBack - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getTime() - offset * DAY_MS);
    const key = getLocalDateKey(d);
    bins.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return bins;
}

// ----------------------------------------------------------- per-chapter

export interface ChapterProgressBar {
  chapterId: string;
  /** Correct answers / total answers for this chapter. 0..1. null when no answers. */
  accuracy: number | null;
  /** Unique questions seen / total chapter questions. 0..1. */
  coverage: number;
  /** Total answers across all attempts. */
  answers: number;
  /** Distinct questions touched. */
  uniqueQuestionsAnswered: number;
  /** Most recent ISO date for any answer on this chapter, or null. */
  lastAnsweredAt: string | null;
}

export function perChapterProgress(
  progress: UserProgress,
  chapters: ReadonlyArray<{ id: string; questionCount: number }>,
  questionChapterIndex: Record<string, string>,
): ChapterProgressBar[] {
  const perChapter = new Map<
    string,
    {
      correct: number;
      total: number;
      questionIds: Set<string>;
      lastAnsweredAt: string | null;
    }
  >();

  for (const chapter of chapters) {
    perChapter.set(chapter.id, {
      correct: 0,
      total: 0,
      questionIds: new Set(),
      lastAnsweredAt: null,
    });
  }

  for (const session of progress.sessions ?? []) {
    for (const answer of session.answers) {
      const chapterId = questionChapterIndex[answer.questionId];
      if (!chapterId) continue;
      const bucket = perChapter.get(chapterId);
      if (!bucket) continue;
      bucket.total += 1;
      if (answer.isCorrect) bucket.correct += 1;
      bucket.questionIds.add(answer.questionId);
      if (!bucket.lastAnsweredAt || answer.answeredAt > bucket.lastAnsweredAt) {
        bucket.lastAnsweredAt = answer.answeredAt;
      }
    }
  }

  return chapters.map((chapter) => {
    const bucket = perChapter.get(chapter.id)!;
    return {
      chapterId: chapter.id,
      accuracy: bucket.total === 0 ? null : bucket.correct / bucket.total,
      coverage: chapter.questionCount === 0 ? 0 : bucket.questionIds.size / chapter.questionCount,
      answers: bucket.total,
      uniqueQuestionsAnswered: bucket.questionIds.size,
      lastAnsweredAt: bucket.lastAnsweredAt,
    };
  });
}

// ----------------------------------------------------------- mock history

export interface MockHistoryEntry {
  sessionId: string;
  /** Pass score in 0..1 (matches QuizSession.score). null if no score recorded. */
  score: number | null;
  completedAt: string;
  durationMs: number | null;
}

export function mockHistory(progress: UserProgress): MockHistoryEntry[] {
  const out: MockHistoryEntry[] = [];
  for (const session of progress.sessions ?? []) {
    if (session.mode !== 'exam') continue;
    if (!session.completedAt) continue;
    out.push({
      sessionId: session.id,
      score: typeof session.score === 'number' ? session.score : null,
      completedAt: session.completedAt,
      durationMs:
        session.startedAt && session.completedAt
          ? new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()
          : null,
    });
  }
  return out.sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}

export function bestMockScore(progress: UserProgress): number | null {
  let best: number | null = null;
  for (const entry of mockHistory(progress)) {
    if (entry.score === null) continue;
    best = best === null ? entry.score : Math.max(best, entry.score);
  }
  return best;
}

// ----------------------------------------------------------- time-of-day

export interface TimeOfDayBin {
  /** 0..23 — local hour of day. */
  hour: number;
  /** Number of answers in this hour. */
  answers: number;
  /** 0..1 accuracy at this hour; null when answers === 0. */
  accuracy: number | null;
}

export function timeOfDayPattern(progress: UserProgress): TimeOfDayBin[] {
  const buckets: { answers: number; correct: number }[] = Array.from({ length: 24 }, () => ({
    answers: 0,
    correct: 0,
  }));

  for (const session of progress.sessions ?? []) {
    for (const answer of session.answers) {
      const d = new Date(answer.answeredAt);
      if (Number.isNaN(d.getTime())) continue;
      const hour = d.getHours();
      buckets[hour].answers += 1;
      if (answer.isCorrect) buckets[hour].correct += 1;
    }
  }

  return buckets.map((b, hour) => ({
    hour,
    answers: b.answers,
    accuracy: b.answers === 0 ? null : b.correct / b.answers,
  }));
}

// ----------------------------------------------------------- mistake convergence

export interface MistakeConvergencePoint {
  date: string; // local date key
  unresolvedMistakes: number;
}

/**
 * For each day in the window, the number of distinct questions that:
 *  - have been answered wrong at least once on or before that day, AND
 *  - have NOT been answered correctly on or before that day.
 * Returns a decreasing (or flat) curve as the user resolves wrongs.
 */
export function mistakeConvergence(
  progress: UserProgress,
  options: { daysBack: number; now?: Date } = { daysBack: 30 },
): MistakeConvergencePoint[] {
  const now = options.now ?? new Date();
  const allAnswers: QuizAnswer[] = [];
  for (const session of progress.sessions ?? []) {
    allAnswers.push(...session.answers);
  }
  allAnswers.sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));

  const points: MistakeConvergencePoint[] = [];
  for (let offset = options.daysBack - 1; offset >= 0; offset -= 1) {
    const cutoff = new Date(now.getTime() - offset * DAY_MS);
    cutoff.setHours(23, 59, 59, 999);
    const cutoffIso = cutoff.toISOString();

    const wrongAt = new Set<string>();
    const correctAt = new Set<string>();
    for (const a of allAnswers) {
      if (a.answeredAt > cutoffIso) break;
      if (a.isCorrect) correctAt.add(a.questionId);
      else wrongAt.add(a.questionId);
    }
    let unresolved = 0;
    for (const qid of wrongAt) if (!correctAt.has(qid)) unresolved += 1;

    points.push({
      date: getLocalDateKey(new Date(now.getTime() - offset * DAY_MS)),
      unresolvedMistakes: unresolved,
    });
  }
  return points;
}

// ----------------------------------------------------------- streak sparkline

export interface XpDayPoint {
  date: string;
  /** Synthetic XP for the day: count of correct answers × 10. */
  xp: number;
}

export function xpSparkline(
  progress: UserProgress,
  options: { daysBack: number; now?: Date } = { daysBack: 30 },
): XpDayPoint[] {
  const now = options.now ?? new Date();
  const correctByDay = new Map<string, number>();

  for (const session of progress.sessions ?? []) {
    for (const answer of session.answers) {
      if (!answer.isCorrect) continue;
      const d = new Date(answer.answeredAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = getLocalDateKey(d);
      correctByDay.set(key, (correctByDay.get(key) ?? 0) + 1);
    }
  }

  const out: XpDayPoint[] = [];
  for (let offset = options.daysBack - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getTime() - offset * DAY_MS);
    const key = getLocalDateKey(d);
    out.push({ date: key, xp: (correctByDay.get(key) ?? 0) * 10 });
  }
  return out;
}

// ----------------------------------------------------------- summary card

export interface DashboardSummary {
  questionsAnsweredThisWeek: number;
  bestMockScore: number | null;
  unresolvedMistakes: number;
  chaptersWithAnyAnswer: number;
}

export function dashboardSummary(
  progress: UserProgress,
  questionChapterIndex: Record<string, string>,
  options: { now?: Date } = {},
): DashboardSummary {
  const now = options.now ?? new Date();
  const weekStart = new Date(now.getTime() - 7 * DAY_MS);
  let questionsThisWeek = 0;
  const wrongIds = new Set<string>();
  const correctIds = new Set<string>();
  const chaptersTouched = new Set<string>();

  for (const session of progress.sessions ?? []) {
    for (const answer of session.answers) {
      if (answer.answeredAt >= weekStart.toISOString()) questionsThisWeek += 1;
      if (answer.isCorrect) correctIds.add(answer.questionId);
      else wrongIds.add(answer.questionId);
      const chapterId = questionChapterIndex[answer.questionId];
      if (chapterId) chaptersTouched.add(chapterId);
    }
  }

  let unresolved = 0;
  for (const qid of wrongIds) if (!correctIds.has(qid)) unresolved += 1;

  return {
    questionsAnsweredThisWeek: questionsThisWeek,
    bestMockScore: bestMockScore(progress),
    unresolvedMistakes: unresolved,
    chaptersWithAnyAnswer: chaptersTouched.size,
  };
}

// Re-export the QuizSession shape consumers may need without re-importing.
export type { QuizSession };
