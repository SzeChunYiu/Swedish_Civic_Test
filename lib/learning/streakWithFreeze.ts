// Streak with grace days — Duolingo-style streak freeze (competitive-teardown
// rec #5, P0).
//
// The classic "consecutive days answered" streak punishes one missed day by
// resetting to zero. Real users miss days for legitimate reasons (sick,
// travel, busy week). A free streak freeze absorbs one missed day per week.
//
// This module is a pure additive layer over the existing
// `calculateStreak(days, today)` in `streaks.ts`. It does NOT replace that
// helper — the v1.0 schema test pins `calculateStreak` behavior, so this
// ships alongside it.
//
// Freeze policy:
//   - 1 free freeze regenerates each Monday (week reset).
//   - Freeze auto-applies SILENTLY to the most recent missed day in the
//     current run. The user sees the streak continue.
//   - When applied, the day is treated as if the user studied that day
//     for streak purposes (does NOT affect XP / questionsAnswered counts).
//   - Freeze stockpile is capped at 4 (so the absent-for-4-weeks user
//     doesn't accidentally maintain a 30-day streak — honesty bar).

import { getLocalDateKey } from './streaks';

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FREEZE_LIFETIME_COUNT = 10000;

export interface StreakFreezeState {
  /** Number of freezes available right now. 0..MAX_STOCKPILE. */
  available: number;
  /** ISO date key when the freeze stockpile was last incremented. */
  lastEarnedAt: string;
  /** Total freezes ever earned (lifetime stat, never decreases). */
  lifetimeEarned: number;
  /** Total freezes ever spent. */
  lifetimeSpent: number;
  /**
   * Day keys that were rescued by a freeze application. Used to keep the
   * streak surface honest ("Streak of 12 days, 1 freeze used").
   */
  rescuedDayKeys: string[];
}

const MAX_STOCKPILE = 4;
const FREEZES_PER_WEEK = 1;

export function createInitialFreezeState(now: Date = new Date()): StreakFreezeState {
  const safeNow = safeDate(now);
  return {
    available: FREEZES_PER_WEEK,
    lastEarnedAt: getLocalDateKey(startOfWeek(safeNow)),
    lifetimeEarned: FREEZES_PER_WEEK,
    lifetimeSpent: 0,
    rescuedDayKeys: [],
  };
}

function safeDate(value: unknown): Date {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value : new Date();
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay();
  const offsetToMonday = (dayOfWeek + 6) % 7;
  d.setDate(d.getDate() - offsetToMonday);
  return d;
}

function normalizeDayKey(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return getLocalDateKey(value);
  if (typeof value !== 'string') return null;

  const dateKey = value.trim().slice(0, 10);
  if (!DATE_KEY_PATTERN.test(dateKey)) return null;

  const [year, month, day] = dateKey.split('-').map(Number);
  const normalized = new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  return normalized === dateKey ? dateKey : null;
}

function normalizeFreezeDayKey(value: unknown, now: Date): string | null {
  const dayKey = normalizeDayKey(value);
  if (!dayKey) return null;
  return dayKey <= getLocalDateKey(now) ? dayKey : null;
}

function normalizeDayKeyList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.map(normalizeDayKey).filter((key): key is string => !!key)));
}

function normalizeFreezeDayKeyList(values: unknown, now: Date): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => normalizeFreezeDayKey(value, now))
        .filter((key): key is string => !!key),
    ),
  );
}

function normalizeNonNegativeInteger(value: unknown, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(max, value));
}

export function normalizeStreakFreezeState(
  value: unknown,
  now: Date = new Date(),
): StreakFreezeState {
  const safeNow = safeDate(now);
  const fallback = createInitialFreezeState(safeNow);
  if (!value || typeof value !== 'object') return fallback;

  const candidate = value as Partial<StreakFreezeState>;
  return {
    available: normalizeNonNegativeInteger(candidate.available, fallback.available, MAX_STOCKPILE),
    lastEarnedAt: normalizeFreezeDayKey(candidate.lastEarnedAt, safeNow) ?? fallback.lastEarnedAt,
    lifetimeEarned: normalizeNonNegativeInteger(
      candidate.lifetimeEarned,
      fallback.lifetimeEarned,
      MAX_FREEZE_LIFETIME_COUNT,
    ),
    lifetimeSpent: normalizeNonNegativeInteger(
      candidate.lifetimeSpent,
      fallback.lifetimeSpent,
      MAX_FREEZE_LIFETIME_COUNT,
    ),
    rescuedDayKeys: normalizeFreezeDayKeyList(candidate.rescuedDayKeys, safeNow),
  };
}

function previousDayKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00.000Z`);
  return new Date(d.getTime() - DAY_MS).toISOString().slice(0, 10);
}

/**
 * Refill the freeze stockpile if at least one week has passed since the last
 * earn. Pure — returns a new state, does not mutate.
 */
export function refillFreezes(state: StreakFreezeState, now: Date = new Date()): StreakFreezeState {
  const safeNow = safeDate(now);
  const currentWeekStartKey = getLocalDateKey(startOfWeek(safeNow));
  const normalizedState = normalizeStreakFreezeState(state, safeNow);
  const lastEarnedAt = normalizedState.lastEarnedAt;

  if (currentWeekStartKey <= lastEarnedAt) {
    return normalizedState;
  }

  // Use noon UTC anchors so DST shifts don't change the rounded week count.
  const lastNoon = new Date(`${lastEarnedAt}T12:00:00.000Z`).getTime();
  const currentNoon = new Date(`${currentWeekStartKey}T12:00:00.000Z`).getTime();
  const weeksSince = Math.max(1, Math.round((currentNoon - lastNoon) / (7 * DAY_MS)));

  const earned = Math.min(weeksSince * FREEZES_PER_WEEK, MAX_STOCKPILE - normalizedState.available);
  if (earned <= 0) {
    return { ...normalizedState, lastEarnedAt: currentWeekStartKey };
  }
  return {
    ...normalizedState,
    available: normalizedState.available + earned,
    lastEarnedAt: currentWeekStartKey,
    lifetimeEarned: normalizedState.lifetimeEarned + earned,
  };
}

export interface StreakWithFreezeInput {
  /** Day keys when the user actually answered something. Order-independent. */
  activeDayKeys: string[];
  freezeState: StreakFreezeState;
  /** Effective "today" — local date key. Defaults to today. */
  today?: string;
  /** Date used for freeze refill computation. */
  now?: Date;
}

export interface StreakWithFreezeResult {
  /** Streak length INCLUDING days rescued by freeze application. */
  streakDays: number;
  /** Freeze state AFTER applying any auto-saves. */
  freezeState: StreakFreezeState;
  /** Rescued day keys that are part of the currently visible streak. */
  rescuedInCurrentStreak: string[];
  /** Day keys rescued during THIS computation. Empty when no save happened. */
  rescuedThisRun: string[];
}

/**
 * Compute a streak, applying freezes silently to absorb single-day gaps.
 * Walks backward from today; for each missing day, spends one freeze (if any
 * are available) and continues. Two consecutive missed days still break the
 * streak — freeze is for "I forgot one day", not "I disappeared for a week".
 *
 * Pure function — returns new state, does not mutate.
 */
export function calculateStreakWithFreeze(input: StreakWithFreezeInput): StreakWithFreezeResult {
  const refilled = refillFreezes(input.freezeState, input.now ?? new Date());
  const today =
    normalizeDayKey(input.today) ?? normalizeDayKey(input.now) ?? getLocalDateKey(new Date());
  const activeSet = new Set(normalizeDayKeyList(input.activeDayKeys));
  const previousRescuedDayKeys = normalizeDayKeyList(refilled.rescuedDayKeys);
  const previousRescuedSet = new Set(previousRescuedDayKeys);
  // Also include previously-rescued days so streaks stay intact across calls.
  for (const rescued of previousRescuedDayKeys) activeSet.add(rescued);

  let cursor = activeSet.has(today) ? today : previousDayKey(today);
  let streak = 0;
  let availableFreezes = refilled.available;
  let lifetimeSpent = refilled.lifetimeSpent;
  const rescuedInCurrentStreak: string[] = [];
  const rescuedThisRun: string[] = [];

  while (true) {
    if (activeSet.has(cursor)) {
      if (previousRescuedSet.has(cursor)) rescuedInCurrentStreak.push(cursor);
      streak += 1;
      cursor = previousDayKey(cursor);
      continue;
    }
    // Cursor day is inactive. Can we apply a freeze?
    if (availableFreezes <= 0) break;
    // Refuse to freeze TWO days in a row — disappearing-for-a-week guard.
    const previous = previousDayKey(cursor);
    if (!activeSet.has(previous)) break;
    availableFreezes -= 1;
    lifetimeSpent += 1;
    rescuedInCurrentStreak.push(cursor);
    rescuedThisRun.push(cursor);
    streak += 1;
    cursor = previous;
  }

  const newRescuedKeys = [...previousRescuedDayKeys, ...rescuedThisRun];

  return {
    streakDays: streak,
    freezeState: {
      ...refilled,
      available: availableFreezes,
      lifetimeSpent,
      rescuedDayKeys: newRescuedKeys,
    },
    rescuedInCurrentStreak,
    rescuedThisRun,
  };
}

// Surface helpers for the UI.

export function freezeBannerCopy(
  result: StreakWithFreezeResult,
  language: 'sv' | 'en',
): string | null {
  const rescuedInCurrentStreak = Array.isArray(result.rescuedInCurrentStreak)
    ? result.rescuedInCurrentStreak
    : [];
  if (result.rescuedThisRun.length === 0 && rescuedInCurrentStreak.length === 0) return null;
  const freezeLabel = result.freezeState.available === 1 ? 'freeze' : 'freezes';

  return language === 'sv'
    ? `Sviten är räddad — du har ${result.freezeState.available} svitskydd kvar.`
    : `Streak protected — ${result.freezeState.available} ${freezeLabel} left.`;
}
