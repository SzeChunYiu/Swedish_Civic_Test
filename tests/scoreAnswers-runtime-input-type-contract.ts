import { scoreAnswers } from '../lib/quiz/scoring';

const objectRuntimeScore = scoreAnswers({ 0: true, length: 1 });
const stringRuntimeScore = scoreAnswers('yes');
const nullRuntimeScore = scoreAnswers(null);
const undefinedRuntimeScore = scoreAnswers();
const arrayRuntimeScore = scoreAnswers([true, false, 'yes']);

export const scoreAnswersRuntimeInputTypeContract: Array<{ correct: number; total: number }> = [
  objectRuntimeScore,
  stringRuntimeScore,
  nullRuntimeScore,
  undefinedRuntimeScore,
  arrayRuntimeScore,
];
