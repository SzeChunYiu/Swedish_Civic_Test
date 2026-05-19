import type { PracticeQuestion, QuestionOption } from '../../types/content';

const SINGLE_CHOICE_OPTION_IDS = ['a', 'b', 'c', 'd'] as const;
export const ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE = 0.35;

export type AnswerShuffleCorrectPosition = (typeof SINGLE_CHOICE_OPTION_IDS)[number];

export type AnswerShuffleDistribution = {
  correctPositionCounts: Record<AnswerShuffleCorrectPosition, number>;
  maxCorrectPositionShare: number;
  sessionId: string;
  totalQuestions: number;
};

type ShuffleQuestion = Pick<PracticeQuestion, 'id' | 'type' | 'options' | 'correctOptionId'>;

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function optionMatches(left: QuestionOption, right: QuestionOption): boolean {
  return left.id === right.id && left.textSv === right.textSv && left.textEn === right.textEn;
}

function isShufflableSingleChoice(question: ShuffleQuestion): boolean {
  return (
    question.type === 'single_choice' && question.options.length === SINGLE_CHOICE_OPTION_IDS.length
  );
}

function isCorrectPosition(value: string): value is AnswerShuffleCorrectPosition {
  return SINGLE_CHOICE_OPTION_IDS.includes(value as AnswerShuffleCorrectPosition);
}

function emptyCorrectPositionCounts(): Record<AnswerShuffleCorrectPosition, number> {
  return { a: 0, b: 0, c: 0, d: 0 };
}

export function shuffleQuestionOptionsForSession<TQuestion extends ShuffleQuestion>(
  question: TQuestion,
  sessionId: string,
): TQuestion {
  if (!isShufflableSingleChoice(question)) {
    return question;
  }

  const correctOption = question.options.find((option) => option.id === question.correctOptionId);
  if (!correctOption) return question;

  const random = seededRandom(hashString(`${question.id}:${sessionId}`));
  const shuffledOptions = question.options.map((option) => ({ ...option }));

  for (let index = shuffledOptions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffledOptions[index], shuffledOptions[swapIndex]] = [
      shuffledOptions[swapIndex],
      shuffledOptions[index],
    ];
  }

  const correctIndex = shuffledOptions.findIndex((option) => optionMatches(option, correctOption));
  if (correctIndex < 0) return question;

  return {
    ...question,
    options: shuffledOptions.map((option, index) => ({
      ...option,
      id: SINGLE_CHOICE_OPTION_IDS[index],
    })),
    correctOptionId: SINGLE_CHOICE_OPTION_IDS[correctIndex],
  };
}

export function summarizeAnswerShuffleDistribution<TQuestion extends ShuffleQuestion>(
  questions: TQuestion[],
  sessionId: string,
): AnswerShuffleDistribution {
  const correctPositionCounts = emptyCorrectPositionCounts();
  let totalQuestions = 0;

  for (const question of questions) {
    if (!isShufflableSingleChoice(question)) continue;

    const shuffledQuestion = shuffleQuestionOptionsForSession(question, sessionId);
    if (!isCorrectPosition(shuffledQuestion.correctOptionId)) continue;

    correctPositionCounts[shuffledQuestion.correctOptionId] += 1;
    totalQuestions += 1;
  }

  const maxCorrectPositionCount = Math.max(...Object.values(correctPositionCounts));

  return {
    correctPositionCounts,
    maxCorrectPositionShare: totalQuestions > 0 ? maxCorrectPositionCount / totalQuestions : 0,
    sessionId,
    totalQuestions,
  };
}

export function answerShuffleDistributionIsBalanced(
  distribution: AnswerShuffleDistribution,
  maxShare = ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE,
): boolean {
  return distribution.totalQuestions > 0 && distribution.maxCorrectPositionShare <= maxShare;
}
