import type { Chapter, PracticeQuestion } from '../../types/content';
import { isUhrQuestion } from '../content/provenance';
import { hashString, shuffleQuestionOptionsForSession } from './answerOptionShuffle';

export type ExamOptions = {
  questionCount?: number;
  sessionId?: string;
};

export type ExamAnswerMap = Record<string, string>;

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
  uhrReference: PracticeQuestion['uhrReference'];
};

export type ExamAutoSubmitState = {
  examActive: boolean;
  remainingSeconds: number;
  submitted: boolean;
  questionCount: number;
};

export function formatExamTime(remainingSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(remainingSeconds));
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
  return examActive && !submitted && questionCount > 0 && remainingSeconds <= 0;
}

function isReviewedUhrQuestion(question: PracticeQuestion): boolean {
  return (
    ['reviewed', 'published'].includes(question.reviewStatus) &&
    Boolean(question.uhrReference?.chapter) &&
    isUhrQuestion(question)
  );
}

function rotateBucketForSession(
  bucket: PracticeQuestion[],
  chapterId: string,
  sessionId: string,
): PracticeQuestion[] {
  if (bucket.length < 2) return bucket;

  const offset = hashString(`${sessionId}:${chapterId}:question-rotation`) % bucket.length;
  if (offset === 0) return bucket;

  return [...bucket.slice(offset), ...bucket.slice(0, offset)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isScorableExamQuestion(question: unknown): question is PracticeQuestion {
  return (
    isRecord(question) &&
    typeof question.id === 'string' &&
    question.id.length > 0 &&
    typeof question.chapterId === 'string' &&
    question.chapterId.length > 0 &&
    typeof question.correctOptionId === 'string' &&
    question.correctOptionId.length > 0
  );
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

  const sessionBuckets = [...chapterBuckets.entries()].map(([chapterId, bucket]) =>
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
  const safeQuestions = Array.isArray(questions) ? questions.filter(isScorableExamQuestion) : [];
  const safeAnswers = isRecord(answers) ? answers : {};
  const chapterMap = new Map<string, ExamChapterResult>();
  let correctCount = 0;

  for (const question of safeQuestions) {
    const candidateAnswer = safeAnswers[question.id];
    const isCorrect =
      typeof candidateAnswer === 'string' && candidateAnswer === question.correctOptionId;
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
    totalCount: safeQuestions.length,
    percent: safeQuestions.length > 0 ? Math.round((correctCount / safeQuestions.length) * 100) : 0,
    chapterBreakdown: [...chapterMap.values()],
  };
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
      selectedOptionTextSv: selectedOption?.textSv ?? 'Inte besvarad',
      selectedOptionTextEn: selectedOption?.textEn ?? 'Not answered',
      correctOptionTextSv: correctOption?.textSv ?? 'Rätt svar saknas',
      correctOptionTextEn: correctOption?.textEn ?? 'Correct answer missing',
      isCorrect: answers[question.id] === question.correctOptionId,
      explanationSv: question.explanationSv,
      explanationEn: question.explanationEn,
      uhrReference: question.uhrReference,
    };
  });
}
