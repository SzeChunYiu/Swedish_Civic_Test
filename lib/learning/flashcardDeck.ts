import type { PracticeQuestion } from '../../types/content';
import type { QuestionProgress } from '../storage/progressStore';
import { getLocalDateKey } from './streaks';

const defaultFlashcardDeckLimit = 3;
const staleAfterDays = 7;
const dayMs = 24 * 60 * 60 * 1000;
const maxHydratedFutureDateMs = 10 * 366 * dayMs;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export type FlashcardDeckInput = {
  date?: Date;
  limit?: number;
  questionProgress?: Record<string, QuestionProgress | undefined>;
  questions: readonly PracticeQuestion[];
};

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function dateKeyToUtcNoon(dateKey: string): number {
  return Date.parse(`${dateKey}T12:00:00.000Z`);
}

function canonicalProgressTimestampMs(value: unknown, referenceDate: Date): number | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!isoTimestampPattern.test(trimmed)) return null;

  const timestamp = Date.parse(trimmed);
  const referenceTimestamp = referenceDate.getTime();
  if (!Number.isFinite(timestamp)) return null;
  if (
    Number.isFinite(referenceTimestamp) &&
    timestamp > referenceTimestamp + maxHydratedFutureDateMs
  ) {
    return null;
  }

  return new Date(timestamp).toISOString() === trimmed ? timestamp : null;
}

function daysBeforeDeckDate(
  isoTimestamp: unknown,
  deckDateKey: string,
  referenceDate: Date,
): number | null {
  const answeredAtMs = canonicalProgressTimestampMs(isoTimestamp, referenceDate);
  const deckDateMs = dateKeyToUtcNoon(deckDateKey);
  if (answeredAtMs === null || !Number.isFinite(deckDateMs)) return null;

  return Math.floor((deckDateMs - answeredAtMs) / dayMs);
}

function progressPriority(
  progress: QuestionProgress | undefined,
  deckDateKey: string,
  referenceDate: Date,
): number {
  if (!progress || progress.seenCount <= 0) return 40;
  if (progress.bookmarked === true) return 50;
  if ((progress.wrongCount ?? 0) > 0) return 45;

  const nextReviewAtMs = canonicalProgressTimestampMs(progress.nextReviewAt, referenceDate);
  if (nextReviewAtMs !== null && nextReviewAtMs <= dateKeyToUtcNoon(deckDateKey)) {
    return 35;
  }

  const daysSinceAnswer = daysBeforeDeckDate(progress.lastAnsweredAt, deckDateKey, referenceDate);
  if (daysSinceAnswer !== null && daysSinceAnswer >= staleAfterDays) return 30;

  return 0;
}

export function selectDailyFlashcardDeck({
  date = new Date(),
  limit = defaultFlashcardDeckLimit,
  questionProgress = {},
  questions,
}: FlashcardDeckInput): PracticeQuestion[] {
  const normalizedLimit = Number.isInteger(limit) ? Math.max(0, limit) : defaultFlashcardDeckLimit;
  const deckDateKey = getLocalDateKey(date);

  return [...questions]
    .map((question, index) => ({
      dailyRank: stableHash(`${deckDateKey}:${question.id}`),
      index,
      priority: progressPriority(questionProgress[question.id], deckDateKey, date),
      question,
    }))
    .sort((left, right) => {
      if (right.priority !== left.priority) return right.priority - left.priority;
      if (left.dailyRank !== right.dailyRank) return left.dailyRank - right.dailyRank;
      return left.index - right.index;
    })
    .slice(0, normalizedLimit)
    .map(({ question }) => question);
}
