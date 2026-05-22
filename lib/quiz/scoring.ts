export function scoreAnswers(results: unknown = []): { correct: number; total: number } {
  const safeResults = Array.isArray(results) ? results : [];
  let correct = 0;

  for (const result of safeResults) {
    if (result === true) correct += 1;
  }

  return { correct, total: safeResults.length };
}
