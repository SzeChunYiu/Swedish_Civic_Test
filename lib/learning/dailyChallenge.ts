// Daily Challenge selector — competitive-teardown rec #23 (P1).
//
// "Add Quick 5 and Daily mix one-tap practice launchers on home for
// low-friction sessions (vs. always configuring a practice run)."
//
// Daily Challenge variant: 5 questions, 60-second timer, deterministic
// per local day so every user gets the same challenge today (lets us
// run "did you do today's challenge?" social moments later without a
// server).

import { getLocalDateKey } from './streaks';

export const DAILY_CHALLENGE_QUESTIONS = 5;
export const DAILY_CHALLENGE_TIME_LIMIT_SECONDS = 60;

export interface DailyChallengeQuestion {
  id: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  chapterId?: string;
}

export interface DailyChallengeInput {
  bank: ReadonlyArray<DailyChallengeQuestion>;
  /** Date used to derive the day-stable seed. */
  now?: Date;
  /** Override the per-day seed (useful for tests, or for "yesterday's challenge"). */
  seedOverride?: number;
}

export interface DailyChallenge {
  dayKey: string;
  seed: number;
  questionIds: string[];
  timeLimitSeconds: number;
}

// Mulberry32 PRNG — small, fast, deterministic given a seed.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a local-day key like "2026-05-19" into a stable 32-bit seed. */
export function seedForDay(dayKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dayKey.length; i += 1) {
    h ^= dayKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function normalizeCompletedDayKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

/**
 * Build today's challenge. Same input + same local day → identical output
 * for every user, every device. The bank may grow between days; that's
 * fine, the seed is just a starting permutation.
 */
export function buildDailyChallenge(input: DailyChallengeInput): DailyChallenge {
  const now = input.now ?? new Date();
  const dayKey = getLocalDateKey(now);
  const seed = input.seedOverride ?? seedForDay(dayKey);
  const rand = mulberry32(seed);

  const shuffled = shuffle(input.bank, rand);
  // Bias toward medium difficulty: take the first 3 medium-or-anything,
  // then top up with whatever else. Keeps the challenge accessible.
  const medium: DailyChallengeQuestion[] = [];
  const rest: DailyChallengeQuestion[] = [];
  for (const q of shuffled) {
    if (q.difficulty === 'medium' && medium.length < 3) medium.push(q);
    else rest.push(q);
  }
  const picked = medium.concat(rest).slice(0, DAILY_CHALLENGE_QUESTIONS);

  return {
    dayKey,
    seed,
    questionIds: picked.map((q) => q.id),
    timeLimitSeconds: DAILY_CHALLENGE_TIME_LIMIT_SECONDS,
  };
}

/** True when the user has already completed today's daily challenge. */
export function isDailyChallengeCompleted(
  completedDayKeys: unknown,
  now: Date = new Date(),
): boolean {
  if (!Array.isArray(completedDayKeys)) return false;

  const today = getLocalDateKey(now);
  return completedDayKeys.some((dayKey) => normalizeCompletedDayKey(dayKey) === today);
}

/** Localized banner copy for the home CTA. */
export function dailyChallengeBannerCopy(
  completed: boolean,
  language: 'sv' | 'en',
): { title: string; subtitle: string } {
  if (completed) {
    return language === 'sv'
      ? { title: 'Dagens utmaning klar', subtitle: 'Kom tillbaka i morgon för en ny.' }
      : { title: "Today's challenge done", subtitle: 'Come back tomorrow for a new one.' };
  }
  return language === 'sv'
    ? {
        title: 'Dagens utmaning',
        subtitle: `${DAILY_CHALLENGE_QUESTIONS} frågor på ${DAILY_CHALLENGE_TIME_LIMIT_SECONDS} sekunder`,
      }
    : {
        title: 'Daily challenge',
        subtitle: `${DAILY_CHALLENGE_QUESTIONS} questions in ${DAILY_CHALLENGE_TIME_LIMIT_SECONDS} seconds`,
      };
}
