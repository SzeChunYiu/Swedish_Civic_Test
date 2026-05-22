const dayInMs = 24 * 60 * 60 * 1000;

type AnsweredProgress = {
  lastAnsweredAt?: string;
};

type AnswerAttempt = {
  answeredAt?: string;
  questionId?: string;
};

function isOnLocalDate(
  isoDate: string | undefined,
  targetDate: string,
  maxTimeMs: number,
): boolean {
  if (!isoDate) return false;

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  if (date.getTime() > maxTimeMs) return false;

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
  const maxTimeMs = Number.isFinite(date.getTime()) ? date.getTime() : Date.now();

  return Object.values(questionProgress).filter((progress) =>
    isOnLocalDate(progress?.lastAnsweredAt, targetDate, maxTimeMs),
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
  const maxTimeMs = Number.isFinite(date.getTime()) ? date.getTime() : Date.now();

  if (Array.isArray(answerAttempts) && answerAttempts.length > 0) {
    return answerAttempts.filter((attempt) =>
      isOnLocalDate(attempt?.answeredAt, targetDate, maxTimeMs),
    ).length;
  }

  return countAnswersForLocalDate(questionProgress, date);
}
