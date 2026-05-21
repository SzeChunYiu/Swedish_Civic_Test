import type { PracticeQuestion } from '../../types/content';

export function getPracticeQuestionForSession<TQuestion extends Pick<PracticeQuestion, 'id'>>(
  questions: readonly TQuestion[],
  completedQuestionIds: readonly unknown[],
  activeQuestionId: string | null,
): TQuestion | undefined {
  const questionBank = Array.isArray(questions) ? questions : [];
  const activeQuestion = activeQuestionId
    ? questionBank.find((question) => question.id === activeQuestionId)
    : undefined;

  if (activeQuestion) return activeQuestion;
  if (questionBank.length === 0) return undefined;

  const visibleCompletedQuestionIds = getCompletedQuestionIdsForQuestionBank(
    questionBank,
    completedQuestionIds,
  );
  if (visibleCompletedQuestionIds.length >= questionBank.length) return questionBank[0];

  const completedInVisibleBank = new Set(visibleCompletedQuestionIds);
  return (
    questionBank.find((question) => !completedInVisibleBank.has(question.id)) ?? questionBank[0]
  );
}

export function getCompletedQuestionIdsForQuestionBank<
  TQuestion extends Pick<PracticeQuestion, 'id'>,
>(questions: readonly TQuestion[], completedQuestionIds: readonly unknown[]): string[] {
  const questionBank = Array.isArray(questions) ? questions : [];
  const questionIds = new Set(
    questionBank
      .map((question) => question.id)
      .filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
  );
  if (!Array.isArray(completedQuestionIds)) return [];

  const completedIds: string[] = [];
  const seen = new Set<string>();
  for (const id of completedQuestionIds) {
    if (typeof id !== 'string' || id.trim().length === 0) continue;
    if (!questionIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    completedIds.push(id);
  }

  return completedIds;
}

export function getFirstQuestionForChapter<
  TQuestion extends Pick<PracticeQuestion, 'id' | 'chapterId'>,
>(questions: readonly TQuestion[], chapterId: string | null | undefined): TQuestion | undefined {
  if (!chapterId) return undefined;

  return questions.find((question) => question.chapterId === chapterId);
}

export function getChapterQuizSessionId<
  TQuestion extends Pick<PracticeQuestion, 'id' | 'chapterId'>,
>(questions: readonly TQuestion[], chapterId: string | null | undefined): string | null {
  return getFirstQuestionForChapter(questions, chapterId)?.id ?? null;
}
