import type { PracticeQuestion } from '../../types/content';

export type AnswerOptionFeedbackTone = 'idle' | 'correct' | 'incorrect';
export type AnswerOptionFeedbackLanguage = 'sv' | 'en';

export interface AnswerOptionFeedback {
  resultLabel?: string;
  tone: AnswerOptionFeedbackTone;
}

const answerOptionFeedbackCopy: Record<
  AnswerOptionFeedbackLanguage,
  {
    correct: string;
    correctAnswer: string;
    wrong: string;
  }
> = {
  sv: {
    correct: 'Rätt',
    correctAnswer: 'Rätt svar',
    wrong: 'Fel',
  },
  en: {
    correct: 'Correct',
    correctAnswer: 'Correct answer',
    wrong: 'Wrong',
  },
};

function normalizeAnswerOptionFeedbackLanguage(language: unknown): AnswerOptionFeedbackLanguage {
  return language === 'sv' || language === 'en' ? language : 'sv';
}

export function isCorrectAnswer(question: PracticeQuestion, optionId: string): boolean {
  return question.correctOptionId === optionId;
}

export function getAnswerOptionFeedback(
  question: PracticeQuestion,
  optionId: string,
  selectedOptionId: string | null | undefined,
  language: unknown = 'sv',
): AnswerOptionFeedback {
  if (!selectedOptionId) return { tone: 'idle' };

  const copy = answerOptionFeedbackCopy[normalizeAnswerOptionFeedbackLanguage(language)];
  const optionIsCorrect = isCorrectAnswer(question, optionId);
  const optionIsSelected = selectedOptionId === optionId;

  if (optionIsSelected && optionIsCorrect) {
    return { resultLabel: copy.correct, tone: 'correct' };
  }

  if (optionIsSelected) {
    return { resultLabel: copy.wrong, tone: 'incorrect' };
  }

  if (optionIsCorrect) {
    return { resultLabel: copy.correctAnswer, tone: 'correct' };
  }

  return { tone: 'idle' };
}
