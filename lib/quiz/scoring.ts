export function scoreAnswers(results?: readonly boolean[]): { correct: number; total: number };
export function scoreAnswers(results: unknown = []): { correct: number; total: number } {
  if (!Array.isArray(results)) {
    return { correct: 0, total: 0 };
  }

  return results.reduce(
    (score, result) => {
      if (typeof result !== 'boolean') return score;

      return {
        correct: score.correct + (result ? 1 : 0),
        total: score.total + 1,
      };
    },
    { correct: 0, total: 0 },
  );
}
