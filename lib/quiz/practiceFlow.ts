import type { PracticeQuestion } from '../../types/content';

export type PracticeScope =
  | { type: 'all' }
  | { type: 'quick' }
  | { type: 'chapter'; chapterId: string };

export function getPracticeQuestionForSession<TQuestion extends Pick<PracticeQuestion, 'id'>>(
  questions: TQuestion[],
  completedQuestionIds: string[],
  activeQuestionId: string | null,
  questionIdAllowlist: readonly string[] | null = null,
): TQuestion | undefined {
  const availableQuestions = filterQuestionsByIdAllowlist(questions, questionIdAllowlist);
  const activeQuestion = activeQuestionId
    ? availableQuestions.find((question) => question.id === activeQuestionId)
    : undefined;

  if (activeQuestion) return activeQuestion;
  if (availableQuestions.length === 0) return undefined;

  const nextQuestionIndex = completedQuestionIds.length % availableQuestions.length;
  return availableQuestions[nextQuestionIndex] ?? availableQuestions[0];
}

export function filterQuestionsByIdAllowlist<TQuestion extends Pick<PracticeQuestion, 'id'>>(
  questions: TQuestion[],
  questionIdAllowlist: readonly string[] | null,
): TQuestion[] {
  if (!questionIdAllowlist || questionIdAllowlist.length === 0) return questions;

  const allowedQuestionIds = new Set(questionIdAllowlist);
  return questions.filter((question) => allowedQuestionIds.has(question.id));
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
