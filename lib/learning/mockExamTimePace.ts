export type MockExamTimePace = 'rushed' | 'median' | 'overthought' | 'stuck';

export function classifyMockExamTimePace(
  seconds: number,
  medianSeconds: number | null,
): MockExamTimePace {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const safeMedian =
    typeof medianSeconds === 'number' && Number.isFinite(medianSeconds)
      ? Math.max(0, medianSeconds)
      : null;

  if (!safeMedian || safeMedian <= 0) return 'median';
  if (safeSeconds <= safeMedian * 0.5) return 'rushed';
  if (safeSeconds <= safeMedian * 1.5) return 'median';
  if (safeSeconds <= safeMedian * 2.5) return 'overthought';
  return 'stuck';
}
