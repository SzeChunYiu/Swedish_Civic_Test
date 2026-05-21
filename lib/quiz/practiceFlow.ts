import type { Chapter, PracticeQuestion } from '../../types/content';

export type ChapterQuizRouteParams = {
  chapterId: string;
  sessionId: string;
};

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

export function getAvailableQuestionsForPracticeSession<
  TQuestion extends Pick<PracticeQuestion, 'id'>,
>(questions: TQuestion[], sessionAnsweredQuestionIds: string[]): TQuestion[] {
  if (questions.length === 0) return questions;

  const answeredQuestionIds = new Set(sessionAnsweredQuestionIds);
  const unansweredQuestions = questions.filter((question) => !answeredQuestionIds.has(question.id));
  return unansweredQuestions.length > 0 ? unansweredQuestions : questions;
}

export function getPracticeQuestionFromAdaptiveOrder<
  TQuestion extends Pick<PracticeQuestion, 'id'>,
>(
  questions: TQuestion[],
  adaptiveQuestionIds: string[],
  activeQuestionId: string | null,
): TQuestion | undefined {
  const activeQuestion = activeQuestionId
    ? questions.find((question) => question.id === activeQuestionId)
    : undefined;

  if (activeQuestion) return activeQuestion;
  if (questions.length === 0) return undefined;

  const questionsById = new Map(questions.map((question) => [question.id, question]));
  for (const questionId of adaptiveQuestionIds) {
    const question = questionsById.get(questionId);
    if (question) return question;
  }

  return questions[0];
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

export function getChapterQuizRouteParams<
  TQuestion extends Pick<PracticeQuestion, 'id' | 'chapterId'>,
>(
  questions: readonly TQuestion[],
  chapterId: string | null | undefined,
): ChapterQuizRouteParams | null {
  const sessionId = getChapterQuizSessionId(questions, chapterId);
  if (!sessionId || !chapterId) return null;

  return { chapterId, sessionId };
}

export function getChapterContextForQuizSession<
  TChapter extends Pick<Chapter, 'id'>,
  TQuestion extends Pick<PracticeQuestion, 'chapterId'>,
>(
  chapters: readonly TChapter[],
  question: TQuestion | null | undefined,
  chapterId: string | null | undefined,
): TChapter | null {
  if (!question || !chapterId) return null;

  return (
    chapters.find((chapter) => chapter.id === chapterId && chapter.id === question.chapterId) ??
    null
  );
}
