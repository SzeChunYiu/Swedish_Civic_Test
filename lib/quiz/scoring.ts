export function scoreAnswers(results: boolean[] = []): { correct: number; total: number } {
  return { correct: results.filter(Boolean).length, total: results.length };
}
