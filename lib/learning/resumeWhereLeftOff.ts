// "Continue where you left off" selector — competitive-teardown rec #12 (P1).
//
// Returns the most recently-engaged chapter (or question) so the home /
// chapter list can surface a "Resume Chapter X" CTA at the top instead of
// dumping the user back at a generic landing page.
//
// Pure function — no I/O. Deterministic given (progress, now).

import { validAnswerTimestampMs } from './answerDates';
import type { UserProgress } from '../../types/progress';

export interface ResumeCandidate {
  /** Chapter id of the most recently-answered question. */
  chapterId: string | null;
  /** Specific question id within that chapter, if useful. */
  lastQuestionId: string | null;
  /** ISO8601 timestamp of the most recent answer in this chapter. */
  lastAnsweredAt: string | null;
  /** Count of distinct questions answered in this chapter. */
  questionsAnsweredInChapter: number;
}

export interface ResumeInput {
  progress: UserProgress;
  questionChapterIndex: Record<string, string>;
  /** Cutoff in days — answers older than this are ignored (default 60). */
  maxAgeDays?: number;
  /** Frozen clock for tests. */
  now?: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_AGE_DAYS = 60;

interface ResumeAnswerCandidate {
  questionId: string;
  answeredAt: string;
  answeredAtMs: number;
}

function finiteNow(value: Date | undefined): Date {
  return value instanceof Date && Number.isFinite(value.getTime()) ? value : new Date();
}

function finiteMaxAgeDays(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : DEFAULT_MAX_AGE_DAYS;
}

function cutoffFor(now: Date, maxAgeDays: number): number {
  const maxAgeMs = maxAgeDays * DAY_MS;
  return now.getTime() - (Number.isFinite(maxAgeMs) ? maxAgeMs : DEFAULT_MAX_AGE_DAYS * DAY_MS);
}

function progressSessions(progress: UserProgress): readonly unknown[] {
  const sessions = (progress as { sessions?: unknown } | null | undefined)?.sessions;
  return Array.isArray(sessions) ? sessions : [];
}

function sessionAnswers(session: unknown): readonly unknown[] {
  if (!session || typeof session !== 'object') return [];
  const answers = (session as { answers?: unknown }).answers;
  return Array.isArray(answers) ? answers : [];
}

function resumeAnswerCandidate(answer: unknown, now: Date): ResumeAnswerCandidate | null {
  if (!answer || typeof answer !== 'object') return null;
  const maybeAnswer = answer as { answeredAt?: unknown; questionId?: unknown };
  if (typeof maybeAnswer.questionId !== 'string' || typeof maybeAnswer.answeredAt !== 'string') {
    return null;
  }

  const answeredAtMs = validAnswerTimestampMs(maybeAnswer.answeredAt, now);
  if (answeredAtMs === null) return null;

  return {
    questionId: maybeAnswer.questionId,
    answeredAt: maybeAnswer.answeredAt,
    answeredAtMs,
  };
}

export function resumeWhereLeftOff(input: ResumeInput): ResumeCandidate {
  const now = finiteNow(input.now);
  const cutoffMs = cutoffFor(now, finiteMaxAgeDays(input.maxAgeDays));
  const sessions = progressSessions(input.progress);

  let bestChapterId: string | null = null;
  let bestLastAt: string | null = null;
  let bestLastAtMs: number | null = null;
  let bestQuestionId: string | null = null;

  for (const session of sessions) {
    for (const answer of sessionAnswers(session)) {
      const candidate = resumeAnswerCandidate(answer, now);
      if (!candidate || candidate.answeredAtMs < cutoffMs) continue;
      const chapterId = input.questionChapterIndex[candidate.questionId];
      if (!chapterId) continue;
      if (bestLastAtMs === null || candidate.answeredAtMs > bestLastAtMs) {
        bestLastAtMs = candidate.answeredAtMs;
        bestLastAt = candidate.answeredAt;
        bestChapterId = chapterId;
        bestQuestionId = candidate.questionId;
      }
    }
  }

  let questionsInChapter = 0;
  if (bestChapterId) {
    const seen = new Set<string>();
    for (const session of sessions) {
      for (const answer of sessionAnswers(session)) {
        const candidate = resumeAnswerCandidate(answer, now);
        if (!candidate || candidate.answeredAtMs < cutoffMs) continue;
        if (input.questionChapterIndex[candidate.questionId] === bestChapterId) {
          seen.add(candidate.questionId);
        }
      }
    }
    questionsInChapter = seen.size;
  }

  return {
    chapterId: bestChapterId,
    lastQuestionId: bestQuestionId,
    lastAnsweredAt: bestLastAt,
    questionsAnsweredInChapter: questionsInChapter,
  };
}

/**
 * Localized banner copy for the resume CTA. Falls back to the generic
 * "Pick a chapter" message when there is nothing to resume.
 */
export function resumeBannerCopy(
  candidate: ResumeCandidate,
  language: 'sv' | 'en',
): { title: string; subtitle: string | null } {
  if (!candidate.chapterId) {
    return {
      title: language === 'sv' ? 'Välj ett kapitel' : 'Pick a chapter',
      subtitle: null,
    };
  }
  const n = candidate.questionsAnsweredInChapter;
  return language === 'sv'
    ? {
        title: 'Fortsätt där du slutade',
        subtitle: `${n} fråga${n === 1 ? '' : 'r'} avklarade i detta kapitel`,
      }
    : {
        title: 'Continue where you left off',
        subtitle: `${n} question${n === 1 ? '' : 's'} answered in this chapter`,
      };
}
