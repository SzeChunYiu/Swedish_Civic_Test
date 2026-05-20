// Adaptive practice selector — competitive-teardown rec #15 (P1).
//
// "Implement a Quizlet-Learn-style adaptive drill in Practice: start with
// recently-wrong + unseen items, escalate difficulty as accuracy rises,
// instead of pure random."
//
// Pure function — given UserProgress + a question bank + a target session
// size, returns the ordered question ids for the session. Deterministic
// given the inputs.

import { validAnswerTimestampMs } from './answerDates';
import type { UserProgress } from '../../types/progress';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AdaptiveQuestion {
  id: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  chapterId?: string;
}

export interface AdaptivePracticeInput {
  progress: UserProgress;
  bank: ReadonlyArray<AdaptiveQuestion>;
  /** Session size. Default 10. */
  size?: number;
  /** Frozen clock for tests. */
  now?: Date;
  /** Optional chapter filter — only pick questions whose chapterId matches. */
  chapterId?: string;
  /**
   * 0..1 rolling-accuracy proxy used to escalate difficulty. When provided,
   * skips the computation below. Otherwise the selector derives it from the
   * last 30 answers in `progress`.
   */
  recentAccuracyOverride?: number;
}

interface ScoredQuestion {
  question: AdaptiveQuestion;
  /** Higher → ship sooner. */
  score: number;
  /** For deterministic tiebreaking. */
  bucket: 'recently-wrong' | 'unseen' | 'mastered' | 'stale';
}

type AdaptiveBucket = ScoredQuestion['bucket'];

function recentAccuracy(progress: UserProgress, now: Date): number {
  const cutoff = now.getTime() - 30 * DAY_MS;
  let total = 0;
  let correct = 0;
  for (const session of progress.sessions ?? []) {
    for (const answer of session.answers) {
      const answeredAtMs = validAnswerTimestampMs(answer.answeredAt, now);
      if (answeredAtMs === null || answeredAtMs < cutoff) continue;
      total += 1;
      if (answer.isCorrect) correct += 1;
    }
  }
  if (total === 0) return 0.5; // neutral until we have data
  return correct / total;
}

function lastSeenMap(
  progress: UserProgress,
  now: Date,
): Record<string, { lastAtMs: number; correctStreak: number }> {
  const out: Record<string, { lastAtMs: number; correctStreak: number }> = {};
  for (const session of progress.sessions ?? []) {
    for (const answer of session.answers) {
      const answeredAtMs = validAnswerTimestampMs(answer.answeredAt, now);
      if (answeredAtMs === null) continue;
      const prior = out[answer.questionId];
      if (!prior || answeredAtMs > prior.lastAtMs) {
        const streak =
          prior && answer.isCorrect ? prior.correctStreak + 1 : answer.isCorrect ? 1 : 0;
        out[answer.questionId] = { lastAtMs: answeredAtMs, correctStreak: streak };
      }
    }
  }
  return out;
}

const DIFFICULTY_WEIGHT: Record<NonNullable<AdaptiveQuestion['difficulty']>, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

function scoreAdaptiveQuestions(input: AdaptivePracticeInput): ScoredQuestion[] {
  const now = input.now ?? new Date();
  const accuracy = input.recentAccuracyOverride ?? recentAccuracy(input.progress, now);
  const seen = lastSeenMap(input.progress, now);

  // Difficulty preference shifts with accuracy:
  //   < 0.5 → bias toward easy (rebuild confidence)
  //   0.5-0.8 → mix
  //   > 0.8 → bias toward hard
  const idealDifficulty = accuracy < 0.5 ? 0 : accuracy < 0.8 ? 1 : 2;

  const eligible = input.chapterId
    ? input.bank.filter((q) => q.chapterId === input.chapterId)
    : input.bank.slice();

  const scored = eligible.map((question): ScoredQuestion => {
    const last = seen[question.id];
    let score = 0;
    let bucket: AdaptiveBucket;

    if (!last) {
      // Unseen — high priority, especially when accuracy is decent.
      score = 80 + (accuracy > 0.5 ? 10 : 0);
      bucket = 'unseen';
    } else if (last.correctStreak === 0) {
      // Recently wrong (most recent answer was wrong) — highest priority.
      score = 100;
      bucket = 'recently-wrong';
    } else {
      const daysSince = (now.getTime() - last.lastAtMs) / DAY_MS;
      if (last.correctStreak >= 3 && daysSince < 14) {
        // Recently mastered — deprioritize, but include if pool small.
        score = 30;
        bucket = 'mastered';
      } else {
        // Stale-ish — moderate priority.
        score = 50 + Math.min(daysSince, 30);
        bucket = 'stale';
      }
    }

    // Difficulty proximity adjustment.
    if (question.difficulty) {
      const dist = Math.abs(DIFFICULTY_WEIGHT[question.difficulty] - idealDifficulty);
      score -= dist * 5;
    }

    return { question, score, bucket };
  });

  // Sort descending score; ties break on question id for determinism.
  scored.sort((a, b) => b.score - a.score || a.question.id.localeCompare(b.question.id));

  return scored;
}

export function pickAdaptiveSession(input: AdaptivePracticeInput): string[] {
  const size = input.size ?? 10;
  return scoreAdaptiveQuestions(input)
    .slice(0, size)
    .map((s) => s.question.id);
}

/** Visibility helper for the practice screen: how many of the picked items are recently-wrong / unseen / etc. */
export function explainAdaptivePick(input: AdaptivePracticeInput): Record<AdaptiveBucket, number> {
  const size = input.size ?? 10;
  const picked = scoreAdaptiveQuestions(input).slice(0, size);
  const counts: Record<AdaptiveBucket, number> = {
    'recently-wrong': 0,
    unseen: 0,
    mastered: 0,
    stale: 0,
  };
  for (const p of picked) counts[p.bucket] += 1;
  return counts;
}
