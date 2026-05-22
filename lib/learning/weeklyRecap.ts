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
import { validAnswerTimestampMs } from './answerDates';
import { computeReadinessScore } from './readiness';
import type { QuizAnswer, QuizSession, UserProgress } from '../../types/progress';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MASTERY_THRESHOLD = 0.8;
type ReadinessChapter = { id: string; questionCount: number };

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
  /**
   * Local readiness-score change vs the previous recap point. null when there
   * is not enough current or previous data to make the comparison meaningful.
   */
  readinessDelta: number | null;
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
  /** Chapters used to compute the local readiness delta. */
  readinessChapters?: ReadonlyArray<ReadinessChapter>;
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

function isWithin(value: unknown, start: Date, end: Date, now: Date): boolean {
  const timestamp = validAnswerTimestampMs(value, now);
  if (timestamp === null) return false;
  return timestamp >= start.getTime() && timestamp <= end.getTime();
}

function isAnsweredInWindow(
  answer: { answeredAt?: unknown },
  start: Date,
  end: Date,
  now: Date,
): boolean {
  return isWithin(answer.answeredAt, start, end, now);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizedStreakDays(value: unknown): number {
  const days = finiteNumber(value);
  return days === null ? 0 : Math.max(0, Math.floor(days));
}

function normalizedMasteryThreshold(value: unknown): number {
  const threshold = finiteNumber(value);
  return threshold !== null && threshold >= 0 && threshold <= 1
    ? threshold
    : DEFAULT_MASTERY_THRESHOLD;
}

function normalizedMasteryValue(value: unknown): number | null {
  const mastery = finiteNumber(value);
  return mastery !== null && mastery >= 0 && mastery <= 1 ? mastery : null;
}

function normalizedMockScore(value: unknown): number | null {
  const score = finiteNumber(value);
  if (score === null) return null;
  return Math.max(0, Math.min(1, score));
}

function progressSessions(progress: UserProgress): readonly unknown[] {
  const sessions = (progress as { sessions?: unknown }).sessions;
  return Array.isArray(sessions) ? sessions : [];
}

function progressQuestionMap(progress: UserProgress): Record<string, unknown> {
  const questionProgress = (progress as { questionProgress?: unknown }).questionProgress;
  return isRecord(questionProgress) ? questionProgress : {};
}

function answersFromSessions(
  sessions: readonly unknown[],
  start: Date,
  end: Date,
  now: Date,
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
    if (!isRecord(session) || !Array.isArray(session.answers)) continue;
    for (const answer of session.answers) {
      if (!isRecord(answer)) continue;
      if (!isAnsweredInWindow(answer, start, end, now)) continue;
      total += 1;
      if (answer.isCorrect === true) correct += 1;
      if (typeof answer.questionId === 'string' && answer.questionId.trim()) {
        questionsTouched.add(answer.questionId);
      }
    }
  }

  return { total, correct, chapterIdsTouched, questionsTouched };
}

function findFirstNewlyMastered(
  startMastery: Record<string, unknown>,
  nowMastery: Record<string, unknown>,
  threshold: number,
): string | null {
  const candidates: { chapterId: string; nowValue: number }[] = [];
  for (const [chapterId, nowValue] of Object.entries(nowMastery)) {
    const normalizedNow = normalizedMasteryValue(nowValue);
    if (normalizedNow === null) continue;
    const hasStartValue = Object.prototype.hasOwnProperty.call(startMastery, chapterId);
    const normalizedStart = hasStartValue ? normalizedMasteryValue(startMastery[chapterId]) : 0;
    if (normalizedStart === null) continue;
    if (normalizedStart < threshold && normalizedNow >= threshold) {
      candidates.push({ chapterId, nowValue: normalizedNow });
    }
  }
  if (candidates.length === 0) return null;
  // Pick the highest mastery — deterministic, no ordering ambiguity.
  candidates.sort((a, b) => b.nowValue - a.nowValue || a.chapterId.localeCompare(b.chapterId));
  return candidates[0].chapterId;
}

function mistakesResolvedInWindow(
  questionProgress: Record<string, unknown>,
  start: Date,
  end: Date,
  now: Date,
): number {
  let count = 0;
  for (const qp of Object.values(questionProgress)) {
    if (!isRecord(qp)) continue;
    if (!qp.lastAnsweredAt) continue;
    if (!isWithin(qp.lastAnsweredAt, start, end, now)) continue;
    const correctStreak = finiteNumber(qp.correctStreak);
    const wrongCount = finiteNumber(qp.wrongCount);
    if (correctStreak !== null && correctStreak >= 1 && wrongCount !== null && wrongCount > 0) {
      count += 1;
    }
  }
  return count;
}

function countMocks(
  sessions: readonly unknown[],
  start: Date,
  end: Date,
  now: Date,
): {
  count: number;
  bestScore: number | null;
} {
  let count = 0;
  let best: number | null = null;
  for (const session of sessions) {
    if (!isRecord(session)) continue;
    if (session.mode !== 'exam') continue;
    if (!session.completedAt) continue;
    if (!isWithin(session.completedAt, start, end, now)) continue;
    count += 1;
    const score = normalizedMockScore(session.score);
    if (score !== null) {
      best = best === null ? score : Math.max(best, score);
    }
  }
  return { count, bestScore: best };
}

function filterAnswersThrough(
  answers: readonly QuizAnswer[],
  cutoff: Date,
  now: Date,
): QuizAnswer[] {
  const cutoffMs = cutoff.getTime();
  return answers.filter((answer) => {
    const answeredAtMs = validAnswerTimestampMs(answer.answeredAt, now);
    return answeredAtMs !== null && answeredAtMs <= cutoffMs;
  });
}

function progressThrough(progress: UserProgress, cutoff: Date, now: Date): UserProgress {
  const cutoffMs = cutoff.getTime();
  const sessions = progressSessions(progress).flatMap((session) => {
    if (!isRecord(session)) return [];
    if (!Array.isArray(session.answers)) return [];

    const typedSession = session as unknown as QuizSession;
    if (typedSession.mode === 'exam') {
      const completedAtMs = validAnswerTimestampMs(typedSession.completedAt, now);
      return completedAtMs !== null && completedAtMs <= cutoffMs ? [typedSession] : [];
    }

    const answers = filterAnswersThrough(typedSession.answers, cutoff, now);
    if (answers.length === 0) return [];

    return [
      {
        ...typedSession,
        answers,
        questionIds: answers.map((answer) => answer.questionId),
      },
    ];
  });

  return {
    ...progress,
    questionProgress: {},
    sessions,
  };
}

function readinessDeltaForWindow(
  input: WeeklyRecapInput,
  previousEnd: Date,
  now: Date,
): number | null {
  if (!input.readinessChapters || !input.questionChapterIndex) return null;

  const currentReadiness = computeReadinessScore({
    progress: input.progress,
    chapters: input.readinessChapters,
    questionChapterIndex: input.questionChapterIndex,
    now,
  });
  const previousReadiness = computeReadinessScore({
    progress: progressThrough(input.progress, previousEnd, now),
    chapters: input.readinessChapters,
    questionChapterIndex: input.questionChapterIndex,
    now: previousEnd,
  });

  if (currentReadiness.isSparse || previousReadiness.isSparse) return null;
  return currentReadiness.score - previousReadiness.score;
}

export function generateWeeklyRecap(input: WeeklyRecapInput): WeeklyRecap {
  const now = input.now ?? new Date();
  const start = startOfWeek(now);
  const end = endOfWeek(now);
  const previousStart = new Date(start.getTime() - 7 * DAY_MS);
  const previousEnd = new Date(start.getTime() - 1);

  const sessions = progressSessions(input.progress);
  const questionProgress = progressQuestionMap(input.progress);

  const current = answersFromSessions(sessions, start, end, now);
  const previous = answersFromSessions(sessions, previousStart, previousEnd, now);

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
  const readinessDelta = readinessDeltaForWindow(input, previousEnd, now);

  const chapterNowMastered =
    input.chapterMasteryAtWeekStart && input.chapterMasteryNow
      ? findFirstNewlyMastered(
          input.chapterMasteryAtWeekStart,
          input.chapterMasteryNow,
          normalizedMasteryThreshold(input.masteryThreshold),
        )
      : null;

  const mocks = countMocks(sessions, start, end, now);
  const mistakesResolved = mistakesResolvedInWindow(questionProgress, start, end, now);

  return {
    weekStart: getLocalDateKey(start),
    weekEnd: getLocalDateKey(end),
    questionsAnswered: current.total,
    accuracy,
    chaptersTouched: [...current.chapterIdsTouched].sort(),
    chapterNowMastered,
    mistakesResolved,
    streakDays: normalizedStreakDays((input.progress as { currentStreak?: unknown }).currentStreak),
    mockExamsTaken: mocks.count,
    bestMockScore: mocks.bestScore,
    accuracyDeltaPoints,
    readinessDelta,
  };
}
