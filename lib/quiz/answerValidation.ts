import type { PracticeQuestion } from '../../types/content';

export function isCorrectAnswer(question: PracticeQuestion, optionId: string): boolean {
  return question.correctOptionId === optionId;
}
