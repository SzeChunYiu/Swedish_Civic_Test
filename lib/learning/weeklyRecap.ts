// Weekly recap selector (blueprint 19).
//
// Pure function. Given a UserProgress snapshot and a `now` Date, return the
// summary stats for the week containing `now`. No notifications, no storage
// writes — those live in the worker lane.
//
// Week boundary: Monday 00:00 local → Monday 00:00 local (ISO week). Using
// local time so a Sunday-evening recap notification covers the week the user
// just finished.

import { getLocalDateKey } from './streaks';
import { normalizeMockScore } from './dashboardStats';
import type { QuizSession, UserProgress, UserQuestionProgress } from '../../types/progress';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface WeeklyRecap {
  weekStart: string; // local date key, Monday
  weekEnd: string; // local date key, Sunday (inclusive)
  questionsAnswered: number;
  /** 0..1; null when 0 questions answered. */
  accuracy: number | null;
  chaptersTouched: string[];
  /** chapterId of the first chapter to cross the mastery threshold this week, if any. */
  chapterNowMastered: string | null;
  /**
   * Number of previously-wrong questions that were answered correctly during
   * the week. Approximation: counts a question as resolved if its current
   * progress has correctStreak >= 1 AND lastAnsweredAt falls in the week AND
   * the question's wrongCount > 0 from before the week started.
   */
  mistakesResolved: number;
  streakDays: number;
  mockExamsTaken: number;
  bestMockScore: number | null;
  /** Accuracy delta vs the previous week, in percentage points. null when no prior data. */
  accuracyDeltaPoints: number | null;
}

export interface WeeklyRecapInput {
  progress: UserProgress;
  /** Map of chapterId → mastery 0..1 for the START of the recap window. */
  chapterMasteryAtWeekStart?: Record<string, number>;
  /** Map of chapterId → mastery 0..1 NOW. */
  chapterMasteryNow?: Record<string, number>;
  /** Chapter mastery threshold (default 0.8). */
  masteryThreshold?: number;
  /** Question → chapterId map, for chaptersTouched computation. */
  questionChapterIndex?: Record<string, string>;
  now?: Date;
}

/** Returns the local-date Monday 00:00 of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay: 0 = Sunday, 1 = Monday, ... 6 = Saturday. Want Monday-start.
  const dayOfWeek = d.getDay();
  const offsetToMonday = (dayOfWeek + 6) % 7; // Mon=0, Sun=6
  d.setDate(d.getDate() - offsetToMonday);
  return d;
}

/** Returns the local-date Sunday 23:59:59.999 of the week containing `date`. */
export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  return new Date(start.getTime() + 7 * DAY_MS - 1);
}

function isWithin(iso: string | undefined, start: Date, end: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= start.getTime() && t <= end.getTime();
}

function isAnsweredInWindow(answer: { answeredAt: string }, start: Date, end: Date): boolean {
  return isWithin(answer.answeredAt, start, end);
}

function answersFromSessions(
  sessions: QuizSession[],
  start: Date,
  end: Date,
): {
  total: number;
  correct: number;
  chapterIdsTouched: Set<string>;
  questionsTouched: Set<string>;
} {
  let total = 0;
  let correct = 0;
  const chapterIdsTouched = new Set<string>();
  const questionsTouched = new Set<string>();

  for (const session of sessions) {
    for (const answer of session.answers) {
      if (!isAnsweredInWindow(answer, start, end)) continue;
      total += 1;
      if (answer.isCorrect) correct += 1;
      questionsTouched.add(answer.questionId);
    }
  }

  return { total, correct, chapterIdsTouched, questionsTouched };
}

function findFirstNewlyMastered(
  startMastery: Record<string, number>,
  nowMastery: Record<string, number>,
  threshold: number,
): string | null {
  const candidates: { chapterId: string; nowValue: number }[] = [];
  for (const [chapterId, nowValue] of Object.entries(nowMastery)) {
    const startValue = startMastery[chapterId] ?? 0;
    if (startValue < threshold && nowValue >= threshold) {
      candidates.push({ chapterId, nowValue });
    }
  }
  if (candidates.length === 0) return null;
  // Pick the highest mastery — deterministic, no ordering ambiguity.
  candidates.sort((a, b) => b.nowValue - a.nowValue || a.chapterId.localeCompare(b.chapterId));
  return candidates[0].chapterId;
}

function mistakesResolvedInWindow(
  questionProgress: Record<string, UserQuestionProgress>,
  start: Date,
  end: Date,
): number {
  let count = 0;
  for (const qp of Object.values(questionProgress)) {
    if (!qp.lastAnsweredAt) continue;
    if (!isWithin(qp.lastAnsweredAt, start, end)) continue;
    if (qp.correctStreak >= 1 && qp.wrongCount > 0) count += 1;
  }
  return count;
}

function countMocks(
  sessions: QuizSession[],
  start: Date,
  end: Date,
): {
  count: number;
  bestScore: number | null;
} {
  let count = 0;
  let best: number | null = null;
  for (const session of sessions) {
    if (session.mode !== 'exam') continue;
    if (!session.completedAt) continue;
    if (!isWithin(session.completedAt, start, end)) continue;
    count += 1;
    const score = normalizeMockScore(session.score);
    if (score !== null) {
      best = best === null ? score : Math.max(best, score);
    }
  }
  return { count, bestScore: best };
}

export function generateWeeklyRecap(input: WeeklyRecapInput): WeeklyRecap {
  const now = input.now ?? new Date();
  const start = startOfWeek(now);
  const end = endOfWeek(now);
  const previousStart = new Date(start.getTime() - 7 * DAY_MS);
  const previousEnd = new Date(start.getTime() - 1);

  const sessions = input.progress.sessions ?? [];
  const questionProgress = input.progress.questionProgress ?? {};

  const current = answersFromSessions(sessions, start, end);
  const previous = answersFromSessions(sessions, previousStart, previousEnd);

  // Resolve chaptersTouched from the question→chapter index if provided.
  if (input.questionChapterIndex) {
    for (const qid of current.questionsTouched) {
      const chapterId = input.questionChapterIndex[qid];
      if (chapterId) current.chapterIdsTouched.add(chapterId);
    }
  }

  const accuracy = current.total === 0 ? null : current.correct / current.total;
  const previousAccuracy = previous.total === 0 ? null : previous.correct / previous.total;
  const accuracyDeltaPoints =
    accuracy === null || previousAccuracy === null
      ? null
      : Math.round((accuracy - previousAccuracy) * 100);

  const chapterNowMastered =
    input.chapterMasteryAtWeekStart && input.chapterMasteryNow
      ? findFirstNewlyMastered(
          input.chapterMasteryAtWeekStart,
          input.chapterMasteryNow,
          input.masteryThreshold ?? 0.8,
        )
      : null;

  const mocks = countMocks(sessions, start, end);
  const mistakesResolved = mistakesResolvedInWindow(questionProgress, start, end);

  return {
    weekStart: getLocalDateKey(start),
    weekEnd: getLocalDateKey(end),
    questionsAnswered: current.total,
    accuracy,
    chaptersTouched: [...current.chapterIdsTouched].sort(),
    chapterNowMastered,
    mistakesResolved,
    streakDays: input.progress.currentStreak ?? 0,
    mockExamsTaken: mocks.count,
    bestMockScore: mocks.bestScore,
    accuracyDeltaPoints,
  };
}
