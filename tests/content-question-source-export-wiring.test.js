const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const generatedVariantsPerSource = 4;
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
    /import \{ applyQuestionLocalizationPilot \} from '\.\/questionLocalizations';/,
    'questions source must import the question localization pilot explicitly',
  );
  assert.match(
    source,
    /import \{ derivePublishedQuestions, publishQuestions \} from '\.\.\/lib\/content\/derivedQuestions';/,
    'questions source must use the derived content helpers',
  );
  assert.ok(
    source.includes(
      `export const baseQuestions: PracticeQuestion[] = rawBaseQuestions.map(
  applyQuestionLocalizationPilot,
);`,
    ),
    'baseQuestions export must apply the localization pilot before publishing',
  );
  assert.ok(
    source.includes(
      `const localizedAdditionalQuestions: PracticeQuestion[] = additionalQuestions.map(
  applyQuestionLocalizationPilot,
);`,
    ),
    'additionalQuestions must apply the localization pilot before publishing',
  );
  assert.ok(
    source.includes(
      `export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...baseQuestions,
  ...localizedAdditionalQuestions,
]);`,
    ),
    'sourceQuestions export must publish localized baseQuestions followed by localizedAdditionalQuestions',
  );
  assert.ok(
    source.includes(
      `export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(
  sourceQuestions,
  sourceQuestions.length + 1,
).map(applyQuestionLocalizationPilot);`,
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
  const source = fs.readFileSync(path.join(repoRoot, 'data/questions.ts'), 'utf8');
  const { additionalQuestions } = loadTs('data/additionalQuestions.ts');
  const { baseQuestions, sourceQuestions, generatedPublishedQuestions, questions } =
    loadTs('data/questions.ts');

  assertQuestionSourceExportWiring(source);

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
  ...localizedAdditionalQuestions,
]);`,
    `export const sourceQuestions: PracticeQuestion[] = publishQuestions([
  ...localizedAdditionalQuestions,
  ...baseQuestions,
]);`,
  );

  assert.throws(
    () => assertQuestionSourceExportWiring(source),
    /sourceQuestions export must publish localized baseQuestions followed by localizedAdditionalQuestions/,
  );
});
