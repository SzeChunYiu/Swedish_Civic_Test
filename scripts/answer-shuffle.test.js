const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();
const displayOptionIds = ['a', 'b', 'c', 'd'];

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath, exportName) {
  const filePath = path.resolve(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function singleChoiceQuestions() {
  return loadTs('data/questions.ts', 'questions').filter(
    (question) => question.type === 'single_choice' && question.options.length === 4,
  );
}

function optionTexts(question) {
  return question.options.map((option) => `${option.textSv} / ${option.textEn}`);
}

test('seeded answer shuffle spreads correct display positions across the published bank', () => {
  const {
    answerShuffleDistributionIsBalanced,
    shuffleQuestionOptionsForSession,
    summarizeAnswerShuffleDistribution,
  } = loadTs('lib/quiz/answerOptionShuffle.ts');
  const { isCorrectAnswer } = loadTs('lib/quiz/answerValidation.ts');
  const questions = singleChoiceQuestions();
  const correctPositionCounts = Object.fromEntries(displayOptionIds.map((id) => [id, 0]));

  assert.ok(questions.length > 100, 'published bank should contain enough single-choice questions');

  for (const question of questions) {
    const originalCorrectOption = question.options.find(
      (option) => option.id === question.correctOptionId,
    );
    const shuffledQuestion = shuffleQuestionOptionsForSession(question, 'p0-answer-shuffle');
    const shuffledCorrectOption = shuffledQuestion.options.find(
      (option) => option.id === shuffledQuestion.correctOptionId,
    );

    assert.deepEqual(
      shuffledQuestion.options.map((option) => option.id),
      displayOptionIds,
    );
    assert.equal(isCorrectAnswer(shuffledQuestion, shuffledQuestion.correctOptionId), true);
    assert.equal(shuffledCorrectOption.textSv, originalCorrectOption.textSv);
    assert.equal(shuffledCorrectOption.textEn, originalCorrectOption.textEn);
    correctPositionCounts[shuffledQuestion.correctOptionId] += 1;
  }

  const maxPositionCount = Math.max(...Object.values(correctPositionCounts));
  assert.ok(
    maxPositionCount <= questions.length * 0.35,
    `correct-answer display positions are too concentrated: ${JSON.stringify(
      correctPositionCounts,
    )}`,
  );

  const distribution = summarizeAnswerShuffleDistribution(questions, 'p0-answer-shuffle');
  assert.equal(distribution.totalQuestions, questions.length);
  assert.deepEqual(distribution.correctPositionCounts, correctPositionCounts);
  assert.equal(answerShuffleDistributionIsBalanced(distribution), true);
});

test('seeded answer shuffle audit stays balanced across routed session seeds', () => {
  const { answerShuffleDistributionIsBalanced, summarizeAnswerShuffleDistribution } = loadTs(
    'lib/quiz/answerOptionShuffle.ts',
  );
  const questions = singleChoiceQuestions();

  assert.ok(questions.length > 100, 'published bank should contain enough single-choice questions');

  for (let index = 0; index < 50; index += 1) {
    const distribution = summarizeAnswerShuffleDistribution(questions, `p0-session-${index}`);

    assert.equal(distribution.totalQuestions, questions.length);
    assert.equal(
      answerShuffleDistributionIsBalanced(distribution),
      true,
      `correct-answer display positions are too concentrated for ${
        distribution.sessionId
      }: ${JSON.stringify(distribution.correctPositionCounts)}`,
    );
  }
});

test('seeded answer shuffle is stable per question and session without mutating source options', () => {
  const { shuffleQuestionOptionsForSession } = loadTs('lib/quiz/answerOptionShuffle.ts');
  const [question] = singleChoiceQuestions();
  const originalOptionTexts = optionTexts(question);
  const firstShuffle = shuffleQuestionOptionsForSession(question, 'stable-session');
  const secondShuffle = shuffleQuestionOptionsForSession(question, 'stable-session');

  assert.deepEqual(firstShuffle, secondShuffle);
  assert.deepEqual(optionTexts(question), originalOptionTexts);

  const hasSessionSpecificOrder = singleChoiceQuestions().some((candidate) => {
    const sessionOne = shuffleQuestionOptionsForSession(candidate, 'stable-session');
    const sessionTwo = shuffleQuestionOptionsForSession(candidate, 'different-session');
    return optionTexts(sessionOne).join('|') !== optionTexts(sessionTwo).join('|');
  });

  assert.equal(hasSessionSpecificOrder, true);
});

test('seeded answer shuffle leaves true false option order fixed', () => {
  const { shuffleQuestionOptionsForSession } = loadTs('lib/quiz/answerOptionShuffle.ts');
  const trueFalseQuestion = loadTs('data/questions.ts', 'questions').find(
    (question) => question.type === 'true_false',
  );

  assert.ok(trueFalseQuestion, 'published bank should include true/false questions');
  assert.deepEqual(
    shuffleQuestionOptionsForSession(trueFalseQuestion, 'any-session').options,
    trueFalseQuestion.options,
  );
  assert.equal(
    shuffleQuestionOptionsForSession(trueFalseQuestion, 'any-session').correctOptionId,
    trueFalseQuestion.correctOptionId,
  );
});
