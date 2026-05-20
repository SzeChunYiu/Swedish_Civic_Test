import type { PracticeQuestion } from '../../types/content';

type QuestionProgressLike = {
  correctCount?: number;
  seenCount?: number;
};

export type PracticeChapterStats = {
  answeredCount: number;
  correctCount: number;
  totalCount: number;
};

export function getPracticeQuestionForSession<TQuestion extends Pick<PracticeQuestion, 'id'>>(
  questions: TQuestion[],
  completedQuestionIds: string[],
  activeQuestionId: string | null,
): TQuestion | undefined {
  const activeQuestion = activeQuestionId
    ? questions.find((question) => question.id === activeQuestionId)
    : undefined;

  if (activeQuestion) return activeQuestion;
  if (questions.length === 0) return undefined;

  const visibleCompletedQuestionIds = getCompletedQuestionIdsForQuestionBank(
    questions,
    completedQuestionIds,
  );
  if (visibleCompletedQuestionIds.length >= questions.length) return questions[0];

  const completedInVisibleBank = new Set(visibleCompletedQuestionIds);
  return questions.find((question) => !completedInVisibleBank.has(question.id)) ?? questions[0];
}

export function getCompletedQuestionIdsForQuestionBank<
  TQuestion extends Pick<PracticeQuestion, 'id'>,
>(questions: TQuestion[], completedQuestionIds: string[]): string[] {
  const questionIds = new Set(questions.map((question) => question.id));
  return [...new Set(completedQuestionIds.filter((id) => questionIds.has(id)))];
}

export function getFirstQuestionForChapter<
  TQuestion extends Pick<PracticeQuestion, 'id' | 'chapterId'>,
>(questions: TQuestion[], chapterId: string | null | undefined): TQuestion | undefined {
  if (!chapterId) return undefined;

  return questions.find((question) => question.chapterId === chapterId);
}

export function getPracticeQuestionsForChapter<
  TQuestion extends Pick<PracticeQuestion, 'chapterId'>,
>(questions: TQuestion[], chapterId: string | null | undefined): TQuestion[] {
  if (!chapterId) return [];

  return questions.filter((question) => question.chapterId === chapterId);
}

export function getMixedPracticeRoundQuestions<TQuestion extends Pick<PracticeQuestion, 'id'>>(
  questions: TQuestion[],
  completedQuestionIds: string[],
  limit = 10,
): TQuestion[] {
  if (!Number.isFinite(limit) || limit <= 0) return [];

  const safeLimit = Math.floor(limit);
  const completedIds = new Set(completedQuestionIds);
  const unansweredQuestions = questions.filter((question) => !completedIds.has(question.id));
  const answeredQuestions = questions.filter((question) => completedIds.has(question.id));

  return [...unansweredQuestions, ...answeredQuestions].slice(0, safeLimit);
}

export function getPracticeChapterStats<
  TQuestion extends Pick<PracticeQuestion, 'id' | 'chapterId'>,
>(
  questions: TQuestion[],
  chapterId: string,
  questionProgress: Record<string, QuestionProgressLike | undefined>,
): PracticeChapterStats {
  const chapterQuestions = getPracticeQuestionsForChapter(questions, chapterId);

  return chapterQuestions.reduce<PracticeChapterStats>(
    (stats, question) => {
      const progress = questionProgress[question.id];
      const answered = (progress?.seenCount ?? 0) > 0;

      return {
        answeredCount: stats.answeredCount + (answered ? 1 : 0),
        correctCount: stats.correctCount + (progress?.correctCount ?? 0),
        totalCount: stats.totalCount + 1,
      };
    },
    { answeredCount: 0, correctCount: 0, totalCount: 0 },
  );
}

export function getChapterQuizSessionId<
  TQuestion extends Pick<PracticeQuestion, 'id' | 'chapterId'>,
>(questions: TQuestion[], chapterId: string | null | undefined): string | null {
  return getFirstQuestionForChapter(questions, chapterId)?.id ?? null;
}
