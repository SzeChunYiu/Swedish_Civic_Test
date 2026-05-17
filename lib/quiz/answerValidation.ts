import type { PracticeQuestion } from '../../types/content';

export type AnswerOptionFeedbackTone = 'idle' | 'correct' | 'incorrect';

export interface AnswerOptionFeedback {
  resultLabel?: string;
  tone: AnswerOptionFeedbackTone;
}

export function isCorrectAnswer(question: PracticeQuestion, optionId: string): boolean {
  return question.correctOptionId === optionId;
}

export function getAnswerOptionFeedback(
  question: PracticeQuestion,
  optionId: string,
  selectedOptionId: string | null | undefined,
): AnswerOptionFeedback {
  if (!selectedOptionId) return { tone: 'idle' };

  const optionIsCorrect = isCorrectAnswer(question, optionId);
  const optionIsSelected = selectedOptionId === optionId;

  if (optionIsSelected && optionIsCorrect) {
    return { resultLabel: 'Rätt', tone: 'correct' };
  }

  if (optionIsSelected) {
    return { resultLabel: 'Fel', tone: 'incorrect' };
  }

  if (optionIsCorrect) {
    return { resultLabel: 'Rätt svar', tone: 'correct' };
  }

  return { tone: 'idle' };
}
