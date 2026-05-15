export function calculateMastery(correct: number, total: number): number {
  return total === 0 ? 0 : correct / total;
}
