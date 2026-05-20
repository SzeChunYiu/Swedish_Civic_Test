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
import { isSafeImportedMapKey } from './importKeySafety';
import type { RecoverablePersistenceWarning } from './persistenceWarning';
import { parseJsonRecoverably, readRecoverably, writeRecoverably } from './persistenceWarning';

export const REVIEW_STORE_KEY = 'learning.reviews.cards.v1';
export const FREE_DAILY_REVIEW_CAP = 3;
const reviewStorageId = 'reviews';

let reviewStorage: MMKV | null = null;
try {
  reviewStorage = createMMKV({ id: reviewStorageId });
} catch {
  reviewStorage = null;
}

export interface PersistedReviews {
  byId: Record<string, ReviewCard>;
  /** Day key → number of reviews graded that day. Caps the Free tier. */
  gradedPerDay: Record<string, number>;
}

const EMPTY: PersistedReviews = { byId: {}, gradedPerDay: {} };
const MAX_GRADED_REVIEWS_PER_DAY = 10000;
const reviewStates = new Set(['new', 'learning', 'review', 'relearning']);

function isCanonicalIsoTimestamp(value: string): boolean {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function isCanonicalDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isSafeReviewQuestionId(questionId: unknown): questionId is string {
  return (
    typeof questionId === 'string' &&
    questionId.trim() === questionId &&
    questionId.length > 0 &&
    isSafeImportedMapKey(questionId)
  );
}

function assertSafeReviewQuestionId(questionId: string): void {
  if (!isSafeReviewQuestionId(questionId)) {
    throw new TypeError('Review questionId must be a non-empty safe string.');
  }
}

function isReviewCardForId(id: string, value: unknown): value is ReviewCard {
  if (!isSafeReviewQuestionId(id)) return false;
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<ReviewCard>;
  return (
    v.questionId === id &&
    isSafeReviewQuestionId(v.questionId) &&
    typeof v.difficulty === 'number' &&
    Number.isFinite(v.difficulty) &&
    v.difficulty >= 1 &&
    v.difficulty <= 10 &&
    typeof v.stability === 'number' &&
    Number.isFinite(v.stability) &&
    v.stability >= 1 &&
    v.stability <= 365 * 5 &&
    typeof v.reps === 'number' &&
    Number.isInteger(v.reps) &&
    v.reps >= 0 &&
    typeof v.lapses === 'number' &&
    Number.isInteger(v.lapses) &&
    v.lapses >= 0 &&
    typeof v.state === 'string' &&
    reviewStates.has(v.state) &&
    (v.lastReviewAt === null ||
      (typeof v.lastReviewAt === 'string' && isCanonicalIsoTimestamp(v.lastReviewAt))) &&
    typeof v.dueAt === 'string' &&
    isCanonicalIsoTimestamp(v.dueAt)
  );
}

function normalize(value: unknown): PersistedReviews {
  if (!value || typeof value !== 'object') return EMPTY;
  const candidate = value as Partial<PersistedReviews>;
  const byId: Record<string, ReviewCard> = {};
  if (candidate.byId && typeof candidate.byId === 'object') {
    for (const [id, card] of Object.entries(candidate.byId)) {
      if (isReviewCardForId(id, card)) byId[id] = card;
    }
  }
  const gradedPerDay: Record<string, number> = {};
  if (candidate.gradedPerDay && typeof candidate.gradedPerDay === 'object') {
    for (const [day, count] of Object.entries(candidate.gradedPerDay)) {
      if (!isSafeImportedMapKey(day)) continue;
      if (
        isCanonicalDayKey(day) &&
        typeof count === 'number' &&
        Number.isInteger(count) &&
        count >= 0 &&
        count <= MAX_GRADED_REVIEWS_PER_DAY
      ) {
        gradedPerDay[day] = count;
      }
    }
  }
  return { byId, gradedPerDay };
}

export function normalizeImportedReviewState(value: unknown): PersistedReviews {
  return normalize(value);
}

type InitialReviewState = PersistedReviews & {
  persistenceWarning: RecoverablePersistenceWarning | null;
};

function read(): InitialReviewState {
  const result = readRecoverably(reviewStorage, reviewStorageId, REVIEW_STORE_KEY, () =>
    reviewStorage?.getString(REVIEW_STORE_KEY),
  );
  if (!result.value) return { ...EMPTY, persistenceWarning: result.warning };
  const parsed = parseJsonRecoverably(
    result.value,
    reviewStorageId,
    REVIEW_STORE_KEY,
    (rawValue) => normalize(JSON.parse(rawValue)),
    EMPTY,
  );
  return { ...parsed.value, persistenceWarning: parsed.warning ?? result.warning };
}

function write(state: PersistedReviews): RecoverablePersistenceWarning | null {
  return writeRecoverably(reviewStorage, reviewStorageId, REVIEW_STORE_KEY, JSON.stringify(state));
}

function mergeReviews(current: PersistedReviews, imported: PersistedReviews): PersistedReviews {
  const gradedPerDay = { ...current.gradedPerDay };
  for (const [day, count] of Object.entries(imported.gradedPerDay)) {
    gradedPerDay[day] = Math.max(gradedPerDay[day] ?? 0, count);
  }

  return {
    byId: { ...current.byId, ...imported.byId },
    gradedPerDay,
  };
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
  ensureCard: (questionId, now) => {
    assertSafeReviewQuestionId(questionId);
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
    assertSafeReviewQuestionId(questionId);
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

function normalizeDailyReviewCount(value: unknown, fallback: number): number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : fallback;
}

/**
 * Remaining reviews the Free tier can grade today. Returns
 * Number.POSITIVE_INFINITY for Pro callers (or any unlimited config).
 */
export function remainingDailyReviews(
  state: Pick<PersistedReviews, 'gradedPerDay'>,
  options: { now?: Date; isPro?: boolean; freeCap?: number } = {},
): number {
  if (options.isPro === true) return Number.POSITIVE_INFINITY;
  const cap = normalizeDailyReviewCount(options.freeCap, FREE_DAILY_REVIEW_CAP);
  const dayKey = getLocalDateKey(options.now ?? new Date());
  const used = normalizeDailyReviewCount(state.gradedPerDay[dayKey], 0);
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

export function importReviewSnapshot(value: unknown): PersistedReviews {
  const importedReviews = normalizeImportedReviewState(value);
  const currentReviews = normalize(useReviewStore.getState());
  const nextReviews = mergeReviews(currentReviews, importedReviews);
  const persistenceWarning = write(nextReviews);
  useReviewStore.setState({ ...nextReviews, persistenceWarning });
  return nextReviews;
}
