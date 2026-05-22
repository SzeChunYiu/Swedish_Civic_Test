import { validAnswerDate } from './answerDates';

const dayInMs = 24 * 60 * 60 * 1000;

type AnsweredProgress = {
  lastAnsweredAt?: unknown;
};

type AnswerAttempt = {
  answeredAt?: unknown;
  questionId?: string;
};

function endOfLocalDate(date: Date): Date {
  const safeDate = date instanceof Date && Number.isFinite(date.getTime()) ? date : new Date();

  return new Date(safeDate.getFullYear(), safeDate.getMonth(), safeDate.getDate(), 23, 59, 59, 999);
}

function validationNowForTargetDate(date: Date): Date {
  const now = new Date();
  const targetDate = getLocalDateKey(date);
  const today = getLocalDateKey(now);

  return targetDate < today ? endOfLocalDate(date) : now;
}

function isOnLocalDate(value: unknown, targetDate: string, validationNow: Date): boolean {
  const date = validAnswerDate(value, validationNow);
  if (!date) return false;

  return getLocalDateKey(date) === targetDate;
}

export function getLocalDateKey(date: Date = new Date()): string {
  const safeDate = date instanceof Date && Number.isFinite(date.getTime()) ? date : new Date();
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, '0');
  const day = String(safeDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isValidDateKey(dateKey: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false;
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && toUtcDateKey(date) === dateKey;
}

function normalizeDateKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const dateKey = value.slice(0, 10);
  return isValidDateKey(dateKey) ? dateKey : undefined;
}

function previousDateKey(dateKey: string): string | undefined {
  if (!isValidDateKey(dateKey)) return undefined;
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return toUtcDateKey(new Date(date.getTime() - dayInMs));
}

export function calculateStreak(days: string[] = [], today = getLocalDateKey()): number {
  const todayKey = normalizeDateKey(today);
  if (!todayKey) return 0;

  const uniqueDays = new Set(
    (Array.isArray(days) ? days : []).map(normalizeDateKey).filter((day): day is string => !!day),
  );
  let cursor = uniqueDays.has(todayKey) ? todayKey : previousDateKey(todayKey);
  let streak = 0;

  while (cursor && uniqueDays.has(cursor)) {
    streak += 1;
    cursor = previousDateKey(cursor);
  }

  return streak;
}

export function countAnswersForLocalDate(
  questionProgress: Record<string, AnsweredProgress | undefined> = {},
  date: Date = new Date(),
): number {
  const targetDate = getLocalDateKey(date);
  const validationNow = validationNowForTargetDate(date);

  return Object.values(questionProgress).filter((progress) =>
    isOnLocalDate(progress?.lastAnsweredAt, targetDate, validationNow),
  ).length;
}

export function countAnswerAttemptsForLocalDate({
  answerAttempts,
  questionProgress = {},
  date = new Date(),
}: {
  answerAttempts?: AnswerAttempt[];
  questionProgress?: Record<string, AnsweredProgress | undefined>;
  date?: Date;
}): number {
  const targetDate = getLocalDateKey(date);
  const validationNow = validationNowForTargetDate(date);

  if (Array.isArray(answerAttempts)) {
    return answerAttempts.filter((attempt) =>
      isOnLocalDate(attempt?.answeredAt, targetDate, validationNow),
    ).length;
  }

  return countAnswersForLocalDate(questionProgress, date);
}
