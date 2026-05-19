const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

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

function firstWrongOptionId(question) {
  return question.options.find((option) => option.id !== question.correctOptionId)?.id;
}

test('default mock exam review rows preserve answers, explanations, and UHR sources', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const { questions } = loadTs('data/questions.ts');
  const config = loadTs('data/mockExamConfig.ts', 'defaultMockExamConfig');
  const { buildExamReviewItems, generateExam } = loadTs('lib/quiz/examGenerator.ts');
  const examQuestions = generateExam(questions, { questionCount: config.questionCount });
  const answers = Object.fromEntries(
    examQuestions.map((question, index) => [
      question.id,
      index % 2 === 0 ? question.correctOptionId : firstWrongOptionId(question),
    ]),
  );
  const reviewItems = buildExamReviewItems(examQuestions, answers);

  assert.equal(summary.examReviewItemsValidated, config.questionCount);
  assert.equal(summary.examReviewSourceParityValidated, true);
  assert.equal(reviewItems.length, examQuestions.length);
  assert.ok(reviewItems.some((item) => item.isCorrect));
  assert.ok(reviewItems.some((item) => !item.isCorrect));

  reviewItems.forEach((item, index) => {
    const question = examQuestions[index];
    const selectedOption = question.options.find((option) => option.id === answers[question.id]);
    const correctOption = question.options.find((option) => option.id === question.correctOptionId);

    assert.equal(item.questionId, question.id);
    assert.equal(item.questionSv, question.questionSv);
    assert.equal(item.chapterId, question.chapterId);
    assert.equal(item.selectedOptionTextSv, selectedOption.textSv);
    assert.equal(item.correctOptionTextSv, correctOption.textSv);
    assert.equal(item.explanationSv, question.explanationSv);
    assert.deepEqual(item.uhrReference, question.uhrReference);
    assert.equal(item.isCorrect, answers[question.id] === question.correctOptionId);
  });
});
