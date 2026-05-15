export function calculateAnswerXp({
  isCorrect,
  explanationRead = true,
}: {
  isCorrect: boolean;
  explanationRead?: boolean;
}): number {
  return (isCorrect ? 10 : 2) + (explanationRead ? 2 : 0);
}

export function calculateQuizCompletionXp({
  answeredCount,
  correctCount,
}: {
  answeredCount: number;
  correctCount: number;
}): number {
  if (answeredCount <= 0) return 0;

  const completionXp = 20;
  const perfectQuizBonus = answeredCount >= 10 && correctCount === answeredCount ? 50 : 0;
  return completionXp + perfectQuizBonus;
}

export function calculateLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, totalXp) / 100)) + 1;
}
