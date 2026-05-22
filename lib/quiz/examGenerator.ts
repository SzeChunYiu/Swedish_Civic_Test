import type { Chapter, PracticeQuestion } from '../../types/content';
import type { QuizAnswer, QuizSession } from '../../types/progress';
import { isUhrQuestion } from '../content/provenance';
import { shuffleQuestionOptionsForSession } from './answerOptionShuffle';
import { getQuestionExplanationText, getQuestionOptionText } from './questionText';

export type ExamOptions = {
  questionCount?: number;
  sessionId?: string;
};

export type ExamAnswerMap = Record<string, string>;
export type ExamQuestionTimingMap = Record<string, number>;

export type ExamChapterResult = {
  chapterId: string;
  correctCount: number;
  totalCount: number;
};

export type ExamResult = {
  correctCount: number;
  totalCount: number;
  percent: number;
  chapterBreakdown: ExamChapterResult[];
};

export type ExamChapterBreakdownItem = ExamChapterResult & {
  chapterNameSv: string;
  chapterNameEn: string;
};

export type ExamReviewItem = {
  questionId: string;
  questionSv: string;
  questionEn: string;
  chapterId: string;
  selectedOptionTextSv: string;
  selectedOptionTextEn: string;
  correctOptionTextSv: string;
  correctOptionTextEn: string;
  isCorrect: boolean;
  explanationSv: string;
  explanationEn: string;
  explanationText?: PracticeQuestion['explanationText'];
  uhrReference: PracticeQuestion['uhrReference'];
};

export type ExamAutoSubmitState = {
  examActive?: boolean;
  remainingSeconds: number;
  submitted: boolean;
  questionCount: number;
};

export type MockExamTimerUrgency = 'steady' | 'warning' | 'danger';

export type MockExamTimerUrgencyInput = {
  remainingSeconds: unknown;
  totalSeconds: unknown;
};

export type BuildMockExamQuizSessionInput = {
  answers: ExamAnswerMap;
  completedAt: string;
  questionTimings?: ExamQuestionTimingMap;
  questions: PracticeQuestion[];
  sessionId: string;
  startedAt: string;
};

function normalizeRemainingSeconds(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatExamTime(remainingSeconds: unknown): string {
  const safeSeconds = normalizeRemainingSeconds(remainingSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function shouldAutoSubmitExam({
  examActive,
  remainingSeconds,
  submitted,
  questionCount,
}: ExamAutoSubmitState): boolean {
  if (examActive !== true || submitted !== false) return false;
  if (!isFiniteNumber(remainingSeconds) || !isFiniteNumber(questionCount)) return false;
  return questionCount > 0 && remainingSeconds <= 0;
}

export function getMockExamTimerUrgency({
  remainingSeconds,
  totalSeconds,
}: MockExamTimerUrgencyInput): MockExamTimerUrgency {
  if (!isFiniteNumber(totalSeconds) || totalSeconds <= 0) return 'danger';
  if (!isFiniteNumber(remainingSeconds)) return 'danger';

  const ratio = normalizeRemainingSeconds(remainingSeconds) / Math.max(1, Math.floor(totalSeconds));
  if (ratio < 0.25) return 'danger';
  if (ratio <= 0.5) return 'warning';
  return 'steady';
}

function normalizeTimeSpentSeconds(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function isReviewedUhrQuestion(question: PracticeQuestion): boolean {
  return (
    ['reviewed', 'published'].includes(question.reviewStatus) &&
    Boolean(question.uhrReference?.chapter) &&
    isUhrQuestion(question)
  );
}

function hashSessionValue(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function rotateBucketForSession(
  bucket: PracticeQuestion[],
  chapterId: string,
  sessionId: string,
): PracticeQuestion[] {
  if (bucket.length <= 1) return bucket;
  const offset = hashSessionValue(`${sessionId}:${chapterId}`) % bucket.length;
  return [...bucket.slice(offset), ...bucket.slice(0, offset)];
}

export function generateExam(
  questions: PracticeQuestion[] = [],
  { questionCount = 20, sessionId = 'mock-exam' }: ExamOptions = {},
): PracticeQuestion[] {
  const targetCount = Math.max(0, Math.floor(questionCount));
  const chapterBuckets = new Map<string, PracticeQuestion[]>();

  for (const question of questions.filter(isReviewedUhrQuestion)) {
    const bucket = chapterBuckets.get(question.chapterId) ?? [];
    bucket.push(question);
    chapterBuckets.set(question.chapterId, bucket);
  }

  const sessionBuckets = Array.from(chapterBuckets.entries()).map(([chapterId, bucket]) =>
    rotateBucketForSession(bucket, chapterId, sessionId),
  );
  const selected: PracticeQuestion[] = [];
  let round = 0;

  while (selected.length < targetCount) {
    let addedQuestionThisRound = false;

    for (const bucket of sessionBuckets) {
      const question = bucket[round];
      if (!question) continue;

      selected.push(question);
      addedQuestionThisRound = true;
      if (selected.length >= targetCount) break;
    }

    if (!addedQuestionThisRound) break;
    round += 1;
  }

  return selected.map((question) => shuffleQuestionOptionsForSession(question, sessionId));
}

export function scoreExam(questions: PracticeQuestion[], answers: ExamAnswerMap): ExamResult {
  const chapterMap = new Map<string, ExamChapterResult>();
  let correctCount = 0;

  for (const question of questions) {
    const isCorrect = answers[question.id] === question.correctOptionId;
    if (isCorrect) correctCount += 1;

    const existing = chapterMap.get(question.chapterId) ?? {
      chapterId: question.chapterId,
      correctCount: 0,
      totalCount: 0,
    };
    existing.totalCount += 1;
    if (isCorrect) existing.correctCount += 1;
    chapterMap.set(question.chapterId, existing);
  }

  return {
    correctCount,
    totalCount: questions.length,
    percent: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
    chapterBreakdown: [...chapterMap.values()],
  };
}

export function buildMockExamQuizSession({
  answers,
  completedAt,
  questionTimings = {},
  questions,
  sessionId,
  startedAt,
}: BuildMockExamQuizSessionInput): QuizSession {
  const quizAnswers: QuizAnswer[] = questions.map((question) => {
    const selectedOptionId = answers[question.id];

    return {
      answeredAt: completedAt,
      isCorrect: selectedOptionId === question.correctOptionId,
      questionId: question.id,
      selectedOptionIds: selectedOptionId ? [selectedOptionId] : [],
      timeSpentSeconds: normalizeTimeSpentSeconds(questionTimings[question.id]),
    };
  });
  const correctCount = quizAnswers.filter((answer) => answer.isCorrect).length;
  const totalCount = questions.length;

  return {
    answers: quizAnswers,
    completedAt,
    id: sessionId,
    mode: 'exam',
    questionIds: questions.map((question) => question.id),
    score: totalCount > 0 ? correctCount / totalCount : 0,
    startedAt,
  };
}

export function countUnansweredExamQuestions(
  questions: PracticeQuestion[],
  answers: ExamAnswerMap,
): number {
  return questions.reduce((count, question) => (answers[question.id] ? count : count + 1), 0);
}

export function buildExamChapterBreakdownItems(
  chapterBreakdown: ExamChapterResult[],
  chapters: Chapter[],
): ExamChapterBreakdownItem[] {
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));

  return chapterBreakdown.map((result) => {
    const chapter = chapterById.get(result.chapterId);

    return {
      ...result,
      chapterNameSv: chapter?.nameSv ?? result.chapterId,
      chapterNameEn: chapter?.nameEn ?? result.chapterId,
    };
  });
}

export function buildExamReviewItems(
  questions: PracticeQuestion[],
  answers: ExamAnswerMap,
): ExamReviewItem[] {
  return questions.map((question) => {
    const selectedOption = question.options.find((option) => option.id === answers[question.id]);
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);

    return {
      questionId: question.id,
      questionSv: question.questionSv,
      questionEn: question.questionEn,
      chapterId: question.chapterId,
      selectedOptionTextSv: selectedOption
        ? getQuestionOptionText(selectedOption, 'sv')
        : 'Inte besvarad',
      selectedOptionTextEn: selectedOption
        ? getQuestionOptionText(selectedOption, 'en')
        : 'Not answered',
      correctOptionTextSv: correctOption
        ? getQuestionOptionText(correctOption, 'sv')
        : 'Rätt svar saknas',
      correctOptionTextEn: correctOption
        ? getQuestionOptionText(correctOption, 'en')
        : 'Correct answer missing',
      isCorrect: answers[question.id] === question.correctOptionId,
      explanationSv: getQuestionExplanationText(question, 'sv', question.explanationSv),
      explanationEn: getQuestionExplanationText(question, 'en', question.explanationEn),
      explanationText: question.explanationText,
      uhrReference: question.uhrReference,
    };
  });
}
