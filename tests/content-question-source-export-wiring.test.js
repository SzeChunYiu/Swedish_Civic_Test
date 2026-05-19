const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const generatedVariantsPerSource = 4;
const moduleCache = new Map();

function questionNumber(question) {
  return Number(String(question.id).replace(/^q/, ''));
}

function nextQuestionId(questionNumberValue) {
  return `q${String(questionNumberValue).padStart(3, '0')}`;
}

function generatedTrueFalseResidualQuestions(sourceQuestions, generatedPublishedQuestions) {
  const firstGeneratedQuestionNumber = sourceQuestions.length + 1;
  const lastGeneratedQuestionNumber =
    firstGeneratedQuestionNumber + generatedPublishedQuestions.length - 1;

  return generatedPublishedQuestions.filter((question) => {
    const idNumber = questionNumber(question);
    return (
      question.type === 'true_false' &&
      idNumber >= firstGeneratedQuestionNumber &&
      idNumber <= lastGeneratedQuestionNumber
    );
  });
}

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

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
      const resolvedPath = resolveLocalModule(filePath, request);
      return loadTs(path.relative(repoRoot, resolvedPath));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function assertQuestionSourceExportWiring(source) {
  assert.match(
    source,
    /import \{ additionalQuestions \} from '\.\/additionalQuestions';/,
    'questions source must import additionalQuestions explicitly',
  );
  assert.match(
    source,
    /import \{ derivePublishedQuestions, publishQuestions \} from '\.\.\/lib\/content\/derivedQuestions';/,
    'questions source must use the derived content helpers',
  );
  assert.ok(
    source.includes(
      `export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...additionalQuestions,
]);`,
    ),
    'sourceQuestions export must publish baseQuestions followed by additionalQuestions',
  );
  assert.ok(
    source.includes(
      `export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(
  sourceQuestions,
  sourceQuestions.length + 1,
);`,
    ),
    'generatedPublishedQuestions export must derive after the authored source question range',
  );
  assert.ok(
    source.includes(
      'export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];',
    ),
    'questions export must concatenate sourceQuestions before generatedPublishedQuestions',
  );
}

test('question source exports keep source/generated/published wiring parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'data/questions.ts'), 'utf8');
  const { additionalQuestions } = loadTs('data/additionalQuestions.ts');
  const { baseQuestions, sourceQuestions, generatedPublishedQuestions, questions } =
    loadTs('data/questions.ts');

  assertQuestionSourceExportWiring(source);

  assert.equal(summary.sourceQuestions, sourceQuestions.length);
  assert.equal(summary.generatedPublishedQuestions, generatedPublishedQuestions.length);
  assert.equal(summary.questions, questions.length);
  assert.equal(sourceQuestions.length, baseQuestions.length + additionalQuestions.length);
  assert.equal(
    generatedPublishedQuestions.length,
    sourceQuestions.length * generatedVariantsPerSource,
  );
  assert.deepEqual(
    questions.map((question) => question.id),
    [...sourceQuestions, ...generatedPublishedQuestions].map((question) => question.id),
  );
});

test('question source export wiring derives residual scan range after source expansion', () => {
  const { derivePublishedQuestions, publishQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const { sourceQuestions, questions } = loadTs('data/questions.ts');
  const currentPublishedTail = Math.max(...questions.map(questionNumber));
  const extraSourceQuestion = {
    ...sourceQuestions[0],
    id: nextQuestionId(sourceQuestions.length + 1),
    reviewStatus: 'reviewed',
  };
  const expandedSourceQuestions = publishQuestions([...sourceQuestions, extraSourceQuestion]);
  const expandedGeneratedQuestions = derivePublishedQuestions(
    expandedSourceQuestions,
    expandedSourceQuestions.length + 1,
  );
  const lastGeneratedTrueFalseQuestion = expandedGeneratedQuestions.findLast(
    (question) => question.type === 'true_false',
  );

  assert.ok(lastGeneratedTrueFalseQuestion);
  assert.ok(questionNumber(lastGeneratedTrueFalseQuestion) > currentPublishedTail);
  assert.ok(
    generatedTrueFalseResidualQuestions(expandedSourceQuestions, expandedGeneratedQuestions).some(
      (question) => question.id === lastGeneratedTrueFalseQuestion.id,
    ),
  );
});

test('question source export wiring guard rejects bypassed generated rows', () => {
  const source = fs
    .readFileSync(path.join(repoRoot, 'data/questions.ts'), 'utf8')
    .replace(
      'export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];',
      'export const questions: PracticeQuestion[] = sourceQuestions;',
    );

  assert.throws(
    () => assertQuestionSourceExportWiring(source),
    /questions export must concatenate sourceQuestions before generatedPublishedQuestions/,
  );
});

test('question source export wiring guard rejects reordered authored partitions', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'data/questions.ts'), 'utf8').replace(
    `export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...additionalQuestions,
]);`,
    `export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...additionalQuestions,
  ...baseQuestions,
]);`,
  );

  assert.throws(
    () => assertQuestionSourceExportWiring(source),
    /sourceQuestions export must publish baseQuestions followed by additionalQuestions/,
  );
});
