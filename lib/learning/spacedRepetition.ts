const dayInMs = 24 * 60 * 60 * 1000;

export const spacedRepetitionSchedule: number[] = [1, 3, 7, 15, 30];

export function getNextReviewAt({
  isCorrect,
  correctStreak,
  answeredAt = new Date().toISOString(),
}: {
  isCorrect: boolean;
  correctStreak: number;
  answeredAt?: string;
}): string {
  const baseDate = new Date(answeredAt);
  const scheduleIndex = isCorrect
    ? Math.max(0, Math.min(correctStreak, spacedRepetitionSchedule.length - 1))
    : 0;
  const daysUntilReview = isCorrect ? spacedRepetitionSchedule[scheduleIndex] : 1;
  return new Date(baseDate.getTime() + daysUntilReview * dayInMs).toISOString();
}
