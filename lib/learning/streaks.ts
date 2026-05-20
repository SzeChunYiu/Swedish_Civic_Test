const dayInMs = 24 * 60 * 60 * 1000;

type AnsweredProgress = {
  lastAnsweredAt?: string;
};

type AnswerAttempt = {
  answeredAt?: string;
};

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function previousDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return toUtcDateKey(new Date(date.getTime() - dayInMs));
}

export function calculateStreak(days: string[] = [], today = getLocalDateKey()): number {
  const uniqueDays = new Set(days.map((day) => day.slice(0, 10)));
  let cursor = uniqueDays.has(today) ? today : previousDateKey(today);
  let streak = 0;

  while (uniqueDays.has(cursor)) {
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

  return Object.values(questionProgress).filter((progress) => {
    if (!progress?.lastAnsweredAt) return false;

    const answeredAt = new Date(progress.lastAnsweredAt);
    if (Number.isNaN(answeredAt.getTime())) return false;

    return getLocalDateKey(answeredAt) === targetDate;
  }).length;
}

function countAttemptsForLocalDate(
  answerAttempts: readonly AnswerAttempt[] = [],
  date: Date = new Date(),
): number {
  const targetDate = getLocalDateKey(date);

  return answerAttempts.filter((attempt) => {
    if (!attempt?.answeredAt) return false;

    const answeredAt = new Date(attempt.answeredAt);
    if (Number.isNaN(answeredAt.getTime())) return false;

    return getLocalDateKey(answeredAt) === targetDate;
  }).length;
}

export function countAnswerAttemptsForLocalDate({
  answerAttempts = [],
  questionProgress = {},
  date = new Date(),
}: {
  answerAttempts?: readonly AnswerAttempt[];
  questionProgress?: Record<string, AnsweredProgress | undefined>;
  date?: Date;
}): number {
  const persistedAttempts = countAttemptsForLocalDate(answerAttempts, date);
  return persistedAttempts > 0
    ? persistedAttempts
    : countAnswersForLocalDate(questionProgress, date);
}
