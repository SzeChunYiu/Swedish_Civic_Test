const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return mod.exports;
}

test('answer validation accepts only the exact correct option id', () => {
  const { isCorrectAnswer } = loadTs('lib/quiz/answerValidation.ts');
  const question = {
    id: 'q1',
    correctOptionId: 'option-b',
  };

  assert.equal(isCorrectAnswer(question, 'option-b'), true);
  assert.equal(isCorrectAnswer(question, 'option-a'), false);
  assert.equal(isCorrectAnswer(question, ''), false);
  assert.equal(isCorrectAnswer(question, ' option-b '), false);
});

test('answer scoring accepts only strict boolean result arrays', () => {
  const { scoreAnswers } = loadTs('lib/quiz/scoring.ts');

  assert.deepEqual(scoreAnswers(), { correct: 0, total: 0 });
  assert.deepEqual(scoreAnswers(null), { correct: 0, total: 0 });
  assert.deepEqual(scoreAnswers('true,false'), { correct: 0, total: 0 });
  assert.deepEqual(scoreAnswers([true, false, true]), { correct: 2, total: 3 });
  assert.deepEqual(scoreAnswers(['yes', 1, {}, null]), { correct: 0, total: 0 });
  assert.deepEqual(scoreAnswers([true, 'yes', false, 1, {}, true]), { correct: 2, total: 3 });
});

test('answer option feedback reveals the correct answer after a wrong selection', () => {
  const { getAnswerOptionFeedback } = loadTs('lib/quiz/answerValidation.ts');
  const question = {
    id: 'q1',
    correctOptionId: 'option-b',
  };

  assert.deepEqual(getAnswerOptionFeedback(question, 'option-a', null), {
    tone: 'idle',
  });
  assert.deepEqual(getAnswerOptionFeedback(question, 'option-b', 'option-b'), {
    resultLabel: 'Rätt',
    tone: 'correct',
  });
  assert.deepEqual(getAnswerOptionFeedback(question, 'option-a', 'option-a'), {
    resultLabel: 'Fel',
    tone: 'incorrect',
  });
  assert.deepEqual(getAnswerOptionFeedback(question, 'option-b', 'option-a'), {
    resultLabel: 'Rätt svar',
    tone: 'correct',
  });
  assert.deepEqual(getAnswerOptionFeedback(question, 'option-c', 'option-a'), {
    tone: 'idle',
  });
});

test('answer option feedback labels follow the selected question language', () => {
  const { getAnswerOptionFeedback } = loadTs('lib/quiz/answerValidation.ts');
  const question = {
    id: 'q1',
    correctOptionId: 'option-b',
  };

  assert.deepEqual(getAnswerOptionFeedback(question, 'option-b', 'option-b', 'en'), {
    resultLabel: 'Correct',
    tone: 'correct',
  });
  assert.deepEqual(getAnswerOptionFeedback(question, 'option-a', 'option-a', 'en'), {
    resultLabel: 'Wrong',
    tone: 'incorrect',
  });
  assert.deepEqual(getAnswerOptionFeedback(question, 'option-b', 'option-a', 'en'), {
    resultLabel: 'Correct answer',
    tone: 'correct',
  });
});
