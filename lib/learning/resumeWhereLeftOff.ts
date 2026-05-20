// "Continue where you left off" selector — competitive-teardown rec #12 (P1).
//
// Returns the most recently-engaged chapter (or question) so the home /
// chapter list can surface a "Resume Chapter X" CTA at the top instead of
// dumping the user back at a generic landing page.
//
// Pure function — no I/O. Deterministic given (progress, now).

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

export function resumeWhereLeftOff(input: ResumeInput): ResumeCandidate {
  const now = input.now ?? new Date();
  const maxAge = input.maxAgeDays ?? 60;
  const cutoffIso = new Date(now.getTime() - maxAge * DAY_MS).toISOString();

  let bestChapterId: string | null = null;
  let bestLastAt: string | null = null;
  let bestQuestionId: string | null = null;

  for (const session of input.progress.sessions ?? []) {
    for (const answer of session.answers) {
      if (answer.answeredAt < cutoffIso) continue;
      const chapterId = input.questionChapterIndex[answer.questionId];
      if (!chapterId) continue;
      if (!bestLastAt || answer.answeredAt > bestLastAt) {
        bestLastAt = answer.answeredAt;
        bestChapterId = chapterId;
        bestQuestionId = answer.questionId;
      }
    }
  }

  let questionsInChapter = 0;
  if (bestChapterId) {
    const seen = new Set<string>();
    for (const session of input.progress.sessions ?? []) {
      for (const answer of session.answers) {
        if (input.questionChapterIndex[answer.questionId] === bestChapterId) {
          seen.add(answer.questionId);
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
        subtitle:
          n === 1 ? '1 fråga avklarad i detta kapitel' : `${n} frågor avklarade i detta kapitel`,
      }
    : {
        title: 'Continue where you left off',
        subtitle: `${n} question${n === 1 ? '' : 's'} answered in this chapter`,
      };
}
