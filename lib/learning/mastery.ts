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

type ChapterMasteryTotals = {
  correctCount: number;
  seenCount: number;
  totalQuestions: number;
  recent: boolean;
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

function emptyChapterMasteryTotals(): ChapterMasteryTotals {
  return { correctCount: 0, seenCount: 0, totalQuestions: 0, recent: false };
}

function chapterMasteryTotalsById(
  questions: QuestionLike[],
  progress: Record<string, ProgressLike>,
): Map<string, ChapterMasteryTotals> {
  const totalsByChapter = new Map<string, ChapterMasteryTotals>();

  for (const question of questions) {
    const totals = totalsByChapter.get(question.chapterId) ?? emptyChapterMasteryTotals();
    totals.totalQuestions += 1;

    const item = validProgressCounts(progress[question.id]);
    if (item) {
      totals.correctCount += item.correctCount;
      totals.seenCount += item.seenCount;
      if (item.seenCount > 0) totals.recent = true;
    }

    totalsByChapter.set(question.chapterId, totals);
  }

  return totalsByChapter;
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
  const totals = chapterMasteryTotalsById(questions, progress).get(chapterId);

  return calculateMastery({
    correctCount: totals?.correctCount ?? 0,
    seenCount: totals?.seenCount ?? 0,
    totalQuestions: totals?.totalQuestions ?? 0,
    recent: totals?.recent ?? false,
  });
}

export function findWeakChapterIds(
  questions: QuestionLike[],
  progress: Record<string, ProgressLike>,
  threshold = DEFAULT_WEAK_MASTERY_THRESHOLD,
): string[] {
  const safeThreshold = normalizeThreshold(threshold);
  const weakChapterIds: string[] = [];

  for (const [chapterId, totals] of chapterMasteryTotalsById(questions, progress)) {
    if (totals.seenCount <= 0) continue;
    const mastery = calculateMastery({
      correctCount: totals.correctCount,
      seenCount: totals.seenCount,
      totalQuestions: totals.totalQuestions,
      recent: totals.recent,
    });
    if (mastery < safeThreshold) weakChapterIds.push(chapterId);
  }

  return weakChapterIds;
}
