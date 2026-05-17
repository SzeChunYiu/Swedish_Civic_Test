import type { PracticeQuestion, QuestionOption } from '../../types/content';

const SINGLE_CHOICE_OPTION_IDS = ['a', 'b', 'c', 'd'] as const;

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

export function shuffleQuestionOptionsForSession<
  TQuestion extends Pick<PracticeQuestion, 'id' | 'type' | 'options' | 'correctOptionId'>,
>(question: TQuestion, sessionId: string): TQuestion {
  if (
    question.type !== 'single_choice' ||
    question.options.length !== SINGLE_CHOICE_OPTION_IDS.length
  ) {
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
