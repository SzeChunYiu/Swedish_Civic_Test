type MasteryInput = {
  correctCount: number;
  seenCount: number;
  totalQuestions: number;
  recent?: boolean;
};

type QuestionLike = {
  id: string;
  chapterId: string;
};

type ProgressLike = {
  correctCount?: number;
  seenCount?: number;
  wrongCount?: number;
};

const DEFAULT_WEAK_MASTERY_THRESHOLD = 0.6;

function roundScore(score: number): number {
  return Math.round(score * 100) / 100;
}

function isFiniteNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0
  );
}

function clampUnitInterval(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeThreshold(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return DEFAULT_WEAK_MASTERY_THRESHOLD;
  }
  return clampUnitInterval(value);
}

function validProgressCounts(item: ProgressLike | undefined) {
  if (!item) {
    return { correctCount: 0, seenCount: 0 };
  }

  const correctCount = item.correctCount ?? 0;
  const seenCount = item.seenCount ?? 0;
  const wrongCount = item.wrongCount ?? 0;
  if (
    !isFiniteNonNegativeInteger(correctCount) ||
    !isFiniteNonNegativeInteger(seenCount) ||
    !isFiniteNonNegativeInteger(wrongCount)
  ) {
    return null;
  }

  return { correctCount, seenCount };
}

export function calculateMastery({
  correctCount,
  seenCount,
  totalQuestions,
  recent = false,
}: MasteryInput): number {
  if (
    !isFiniteNonNegativeInteger(correctCount) ||
    !isFiniteNonNegativeInteger(seenCount) ||
    !isFiniteNonNegativeInteger(totalQuestions) ||
    seenCount <= 0 ||
    totalQuestions <= 0
  ) {
    return 0;
  }

  const accuracyScore = clampUnitInterval(correctCount / seenCount);
  const coverageScore = clampUnitInterval(seenCount / totalQuestions);
  const recencyScore = recent === true ? 1 : 0;

  return roundScore(0.5 * accuracyScore + 0.3 * coverageScore + 0.2 * recencyScore);
}

export function calculateChapterMastery(
  chapterId: string,
  questions: QuestionLike[],
  progress: Record<string, ProgressLike>,
): number {
  const chapterQuestions = questions.filter((question) => question.chapterId === chapterId);
  const totals = chapterQuestions.reduce(
    (acc, question) => {
      const item = validProgressCounts(progress[question.id]);
      if (!item) return acc;
      acc.correctCount += item.correctCount;
      acc.seenCount += item.seenCount;
      if (item.seenCount > 0) acc.recent = true;
      return acc;
    },
    { correctCount: 0, seenCount: 0, recent: false },
  );

  return calculateMastery({
    correctCount: totals.correctCount,
    seenCount: totals.seenCount,
    totalQuestions: chapterQuestions.length,
    recent: totals.recent,
  });
}

export function findWeakChapterIds(
  questions: QuestionLike[],
  progress: Record<string, ProgressLike>,
  threshold = DEFAULT_WEAK_MASTERY_THRESHOLD,
): string[] {
  const safeThreshold = normalizeThreshold(threshold);
  const chapterIds = [...new Set(questions.map((question) => question.chapterId))];
  return chapterIds.filter((chapterId) => {
    const chapterQuestions = questions.filter((question) => question.chapterId === chapterId);
    const attempted = chapterQuestions.some((question) => {
      const item = validProgressCounts(progress[question.id]);
      return item !== null && item.seenCount > 0;
    });
    return attempted && calculateChapterMastery(chapterId, questions, progress) < safeThreshold;
  });
}
