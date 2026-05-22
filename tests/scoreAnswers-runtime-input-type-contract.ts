import { scoreAnswers } from '../lib/quiz/scoring';

const objectRuntimeInput: unknown = { 0: true };
const stringRuntimeInput: unknown = 'true,false';
const nullRuntimeInput: unknown = null;
const undefinedRuntimeInput: unknown = undefined;

const objectScore: { correct: number; total: number } = scoreAnswers(objectRuntimeInput);
const stringScore: { correct: number; total: number } = scoreAnswers(stringRuntimeInput);
const nullScore: { correct: number; total: number } = scoreAnswers(nullRuntimeInput);
const undefinedScore: { correct: number; total: number } = scoreAnswers(undefinedRuntimeInput);
const omittedScore: { correct: number; total: number } = scoreAnswers();
const arrayScore: { correct: number; total: number } = scoreAnswers([true, false, true]);

void objectScore;
void stringScore;
void nullScore;
void undefinedScore;
void omittedScore;
void arrayScore;
