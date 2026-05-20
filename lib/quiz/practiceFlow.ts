import type { PracticeQuestion } from '../../types/content';

export type PracticeScope =
  | { type: 'all' }
  | { type: 'quick' }
  | { type: 'chapter'; chapterId: string };

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

export function getMixedPracticeQuestionsByChapter<
  TQuestion extends Pick<PracticeQuestion, 'chapterId'>,
>(sourceQuestions: TQuestion[], limit: number): TQuestion[] {
  const chapterBuckets = new Map<string, TQuestion[]>();

  sourceQuestions.forEach((question) => {
    const chapterQuestions = chapterBuckets.get(question.chapterId) ?? [];
    chapterQuestions.push(question);
    chapterBuckets.set(question.chapterId, chapterQuestions);
  });

  const mixedQuestions: TQuestion[] = [];
  let bucketIndex = 0;
  while (mixedQuestions.length < limit) {
    let addedQuestion = false;

    chapterBuckets.forEach((chapterQuestions) => {
      const question = chapterQuestions[bucketIndex];
      if (!question || mixedQuestions.length >= limit) return;

      mixedQuestions.push(question);
      addedQuestion = true;
    });

    if (!addedQuestion) break;
    bucketIndex += 1;
  }

  return mixedQuestions;
}

export function getQuestionsForPracticeScope<
  TQuestion extends Pick<PracticeQuestion, 'id' | 'chapterId'>,
>(
  sourceQuestions: TQuestion[],
  completedQuestionIds: string[],
  scope: PracticeScope,
  quickRoundSize: number,
): TQuestion[] {
  if (scope.type === 'chapter') {
    return sourceQuestions.filter((question) => question.chapterId === scope.chapterId);
  }

  if (scope.type === 'quick') {
    const completedQuestionIdSet = new Set(completedQuestionIds);
    const unansweredQuestions = sourceQuestions.filter(
      (question) => !completedQuestionIdSet.has(question.id),
    );
    const answeredQuestions = sourceQuestions.filter((question) =>
      completedQuestionIdSet.has(question.id),
    );

    return [
      ...getMixedPracticeQuestionsByChapter(unansweredQuestions, quickRoundSize),
      ...getMixedPracticeQuestionsByChapter(answeredQuestions, quickRoundSize),
    ].slice(0, Math.min(quickRoundSize, sourceQuestions.length));
  }

  return sourceQuestions;
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
