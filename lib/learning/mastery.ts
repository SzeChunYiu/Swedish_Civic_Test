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

function roundScore(score: number): number {
  return Math.round(score * 100) / 100;
}

export function calculateMastery({
  correctCount,
  seenCount,
  totalQuestions,
  recent = false,
}: MasteryInput): number {
  if (seenCount <= 0 || totalQuestions <= 0) return 0;

  const accuracyScore = Math.max(0, Math.min(1, correctCount / seenCount));
  const coverageScore = Math.max(0, Math.min(1, seenCount / totalQuestions));
  const recencyScore = recent ? 1 : 0;

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
      const item = progress[question.id];
      acc.correctCount += item?.correctCount ?? 0;
      acc.seenCount += item?.seenCount ?? 0;
      if (item?.seenCount) acc.recent = true;
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
  threshold = 0.6,
): string[] {
  const chapterIds = [...new Set(questions.map((question) => question.chapterId))];
  return chapterIds.filter((chapterId) => {
    const chapterQuestions = questions.filter((question) => question.chapterId === chapterId);
    const attempted = chapterQuestions.some(
      (question) => (progress[question.id]?.seenCount ?? 0) > 0,
    );
    return attempted && calculateChapterMastery(chapterId, questions, progress) < threshold;
  });
}
