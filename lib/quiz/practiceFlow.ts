import type { PracticeQuestion } from '../../types/content';

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

  const nextQuestionIndex = completedQuestionIds.length % questions.length;
  return questions[nextQuestionIndex] ?? questions[0];
}

export function getFirstQuestionForChapter<
  TQuestion extends Pick<PracticeQuestion, 'id' | 'chapterId'>,
>(questions: TQuestion[], chapterId: string | null | undefined): TQuestion | undefined {
  if (!chapterId) return undefined;

  return questions.find((question) => question.chapterId === chapterId);
}

export function getChapterQuizSessionId<
  TQuestion extends Pick<PracticeQuestion, 'id' | 'chapterId'>,
>(questions: TQuestion[], chapterId: string | null | undefined): string | null {
  return getFirstQuestionForChapter(questions, chapterId)?.id ?? null;
}
