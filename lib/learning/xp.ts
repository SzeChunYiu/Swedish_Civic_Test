export function calculateAnswerXp({
  isCorrect,
  explanationRead = true,
}: {
  isCorrect: boolean;
  explanationRead?: boolean;
}): number {
  if (typeof isCorrect !== 'boolean') return 0;

  return (isCorrect ? 10 : 2) + (explanationRead === true ? 2 : 0);
}

export function calculateQuizCompletionXp({
  answeredCount,
  correctCount,
}: {
  answeredCount: number;
  correctCount: number;
}): number {
  if (
    !Number.isInteger(answeredCount) ||
    !Number.isInteger(correctCount) ||
    answeredCount <= 0 ||
    correctCount < 0 ||
    correctCount > answeredCount
  ) {
    return 0;
  }

  const completionXp = 20;
  const perfectQuizBonus = answeredCount >= 10 && correctCount === answeredCount ? 50 : 0;
  return completionXp + perfectQuizBonus;
}

export function calculateLevel(totalXp: number): number {
  if (!Number.isFinite(totalXp)) return 1;
  return Math.floor(Math.sqrt(Math.max(0, totalXp) / 100)) + 1;
}
