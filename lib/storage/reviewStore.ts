// FSRS card persistence + due-queue store (blueprint 14).
//
// Holds one ReviewCard per question, persisted via MMKV. The selectors are
// pure (don't touch the store) so they're unit-testable.
//
// Gating policy (read from a hook in the UI lane, NOT enforced here — this
// store is shape-only; the cap is applied by the consumer):
//   Free: 3 due cards per local day
//   Pro:  unlimited

import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';

import type { ReviewCard, ReviewGrade } from '../learning/spacedRepetition';
import { createNewCard, gradeCard, isDue, sortByDueAscending } from '../learning/spacedRepetition';
import { getLocalDateKey } from '../learning/streaks';
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { writeRecoverably } from './persistenceWarning';

export const REVIEW_STORE_KEY = 'learning.reviews.cards.v1';
export const FREE_DAILY_REVIEW_CAP = 3;
const reviewStorageId = 'reviews';

let reviewStorage: MMKV | null = null;
try {
  reviewStorage = createMMKV({ id: reviewStorageId });
} catch {
  reviewStorage = null;
}

interface PersistedReviews {
  byId: Record<string, ReviewCard>;
  /** Day key → number of reviews graded that day. Caps the Free tier. */
  gradedPerDay: Record<string, number>;
}

const EMPTY: PersistedReviews = { byId: {}, gradedPerDay: {} };
const REVIEW_CARD_STATES = new Set<ReviewCard['state']>([
  'new',
  'learning',
  'review',
  'relearning',
]);
const minReviewDifficulty = 1;
const maxReviewDifficulty = 10;
const minReviewStabilityDays = 1;
const maxReviewStabilityDays = 365 * 5;
const maxPersistedReviewCounter = 10000;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function isLocalDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isFiniteNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function isNonNegativeInteger(value: unknown, max = Number.MAX_SAFE_INTEGER): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= max
  );
}

function isReviewCard(id: string, value: unknown): value is ReviewCard {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ReviewCard>;
  return (
    isNonEmptyString(id) &&
    v.questionId === id &&
    isFiniteNumberInRange(v.difficulty, minReviewDifficulty, maxReviewDifficulty) &&
    isFiniteNumberInRange(v.stability, minReviewStabilityDays, maxReviewStabilityDays) &&
    isNonNegativeInteger(v.reps, maxPersistedReviewCounter) &&
    isNonNegativeInteger(v.lapses, maxPersistedReviewCounter) &&
    v.state !== undefined &&
    REVIEW_CARD_STATES.has(v.state) &&
    (v.lastReviewAt === null || isIsoTimestamp(v.lastReviewAt)) &&
    isIsoTimestamp(v.dueAt)
  );
}

function normalize(value: unknown): PersistedReviews {
  if (!value || typeof value !== 'object') return EMPTY;
  const candidate = value as Partial<PersistedReviews>;
  const byId: Record<string, ReviewCard> = {};
  if (candidate.byId && typeof candidate.byId === 'object') {
    for (const [id, card] of Object.entries(candidate.byId)) {
      if (isReviewCard(id, card)) byId[id] = card;
    }
  }
  const gradedPerDay: Record<string, number> = {};
  if (candidate.gradedPerDay && typeof candidate.gradedPerDay === 'object') {
    for (const [day, count] of Object.entries(candidate.gradedPerDay)) {
      if (isLocalDateKey(day) && isNonNegativeInteger(count, maxPersistedReviewCounter)) {
        gradedPerDay[day] = count;
      }
    }
  }
  return { byId, gradedPerDay };
}

function read(): PersistedReviews {
  const raw = reviewStorage?.getString(REVIEW_STORE_KEY);
  if (!raw) return EMPTY;
  try {
    return normalize(JSON.parse(raw));
  } catch {
    return EMPTY;
  }
}

function write(state: PersistedReviews): RecoverablePersistenceWarning | null {
  return writeRecoverably(reviewStorage, reviewStorageId, REVIEW_STORE_KEY, JSON.stringify(state));
}

type ReviewState = PersistedReviews & {
  persistenceWarning: RecoverablePersistenceWarning | null;
  /** Get-or-create a card for the question. */
  ensureCard: (questionId: string, now?: string) => ReviewCard;
  /** Grade a card; returns the new card. */
  grade: (questionId: string, grade: ReviewGrade, now?: string) => ReviewCard;
  /** Reset all reviews (used by "clear progress" in settings). */
  clearAll: () => void;
  clearPersistenceWarning: () => void;
};

const initial = read();

export const useReviewStore = create<ReviewState>((set, get) => ({
  ...initial,
  persistenceWarning: null,
  ensureCard: (questionId, now) => {
    const existing = get().byId[questionId];
    if (existing) return existing;
    const card = createNewCard(questionId, now);
    set((state) => {
      const next: PersistedReviews = {
        byId: { ...state.byId, [questionId]: card },
        gradedPerDay: state.gradedPerDay,
      };
      const persistenceWarning = write(next);
      return { ...next, persistenceWarning };
    });
    return card;
  },
  grade: (questionId, grade, now = new Date().toISOString()) => {
    const state = get();
    const existing = state.byId[questionId] ?? createNewCard(questionId, now);
    const next = gradeCard(existing, grade, now);
    const dayKey = getLocalDateKey(new Date(now));
    const nextState: PersistedReviews = {
      byId: { ...state.byId, [questionId]: next },
      gradedPerDay: { ...state.gradedPerDay, [dayKey]: (state.gradedPerDay[dayKey] ?? 0) + 1 },
    };
    const persistenceWarning = write(nextState);
    set({ ...nextState, persistenceWarning });
    return next;
  },
  clearAll: () => {
    const persistenceWarning = write(EMPTY);
    set({ ...EMPTY, persistenceWarning });
  },
  clearPersistenceWarning: () => set({ persistenceWarning: null }),
}));

// ---- Pure selectors (usable outside React) ---------------------------------

export interface DueQueueOptions {
  /** Hard cap on returned cards. Default = unlimited. */
  limit?: number;
  /** Frozen clock for tests; defaults to new Date(). */
  now?: string;
  /** Restrict to specific question ids (e.g. only mistakes). */
  questionIdAllowlist?: ReadonlySet<string>;
}

export function dueCards(
  state: Pick<PersistedReviews, 'byId'>,
  options: DueQueueOptions = {},
): ReviewCard[] {
  const now = options.now ?? new Date().toISOString();
  const list = Object.values(state.byId).filter((card) => {
    if (options.questionIdAllowlist && !options.questionIdAllowlist.has(card.questionId)) {
      return false;
    }
    return isDue(card, now);
  });
  list.sort(sortByDueAscending);
  return options.limit !== undefined ? list.slice(0, options.limit) : list;
}

export function dueCount(state: Pick<PersistedReviews, 'byId'>, now?: string): number {
  return dueCards(state, { now }).length;
}

/**
 * Remaining reviews the Free tier can grade today. Returns
 * Number.POSITIVE_INFINITY for Pro callers (or any unlimited config).
 */
export function remainingDailyReviews(
  state: Pick<PersistedReviews, 'gradedPerDay'>,
  options: { now?: Date; isPro?: boolean; freeCap?: number } = {},
): number {
  if (options.isPro) return Number.POSITIVE_INFINITY;
  const cap = options.freeCap ?? FREE_DAILY_REVIEW_CAP;
  const dayKey = getLocalDateKey(options.now ?? new Date());
  const used = state.gradedPerDay[dayKey] ?? 0;
  return Math.max(0, cap - used);
}

/** Aggregate stats for the dashboard "review streak" + mastery surface. */
export interface ReviewStats {
  totalCards: number;
  /** Cards in 'review' state with stability >= 21 days. Loose proxy for "mastered". */
  masteredCards: number;
  /** Number of distinct days the user graded at least one card. */
  reviewDaysCount: number;
}

export function reviewStats(state: PersistedReviews): ReviewStats {
  const totalCards = Object.keys(state.byId).length;
  let masteredCards = 0;
  for (const card of Object.values(state.byId)) {
    if (card.state === 'review' && card.stability >= 21) masteredCards += 1;
  }
  const reviewDaysCount = Object.values(state.gradedPerDay).filter((n) => n > 0).length;
  return { totalCards, masteredCards, reviewDaysCount };
}
