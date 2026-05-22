const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();
const learnerFacingLegalCertaintyPattern = /\blegal certainty\b/i;

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
  const filePath = path.join(repoRoot, relativePath);
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

function loadStaticQuestions() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site/questions.js'), 'utf8'), context, {
    filename: 'site/questions.js',
    timeout: 3000,
  });
  assert.ok(Array.isArray(context.window.SMT_QUESTIONS), 'site/questions.js exposes questions');
  return context.window.SMT_QUESTIONS;
}

function pushCanonicalQuestionOffenders(offenders, question) {
  const fields = [
    ['questionEn', question.questionEn],
    ['explanationEn', question.explanationEn],
  ];

  (question.options ?? []).forEach((option) => {
    fields.push([`option ${option.id} textEn`, option.textEn]);
  });

  fields.forEach(([field, value]) => {
    if (learnerFacingLegalCertaintyPattern.test(value)) {
      offenders.push(`${question.id} ${field}: ${value}`);
    }
  });
}

function pushStaticQuestionOffenders(offenders, question) {
  const fields = [
    ['q.en', question.q?.en],
    ['why.en', question.why?.en],
  ];

  (question.opts ?? []).forEach((option, index) => {
    fields.push([`opts.${index}.en`, option.en]);
  });

  fields.forEach(([field, value]) => {
    if (learnerFacingLegalCertaintyPattern.test(String(value ?? ''))) {
      offenders.push(`${question.id} ${field}: ${value}`);
    }
  });
}

function validateContentSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('TRANSLATE-COMPLETE P0 has explicit SV/EN completeness and naturalness closure evidence', () => {
  const summary = validateContentSummary();

  assert.equal(summary.translationCompletenessParityValidated, true);
  assert.equal(summary.translationNaturalnessGuardParityValidated, true);
  assert.equal(summary.questionBilingualTextPairsValidated, summary.publishedQuestions);
  assert.equal(summary.questionOptionBilingualTextPairsValidated, summary.publishedQuestions);
  assert.equal(summary.questionGeneratedTrueFalseNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.questionLuciaRoleEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(
    summary.questionEuCooperationEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(
    summary.questionCouncilOfEuropeWorkForEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.questionMayDayEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.questionPublicSectorEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.questionLuciaExplanationRoleScaffoldValidated, summary.publishedQuestions);
  assert.equal(summary.questionGoodFridayEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(
    summary.questionReferendumAdvisorySwedishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(
    summary.questionSourceCriticismEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.somaliGeographyNaturalnessParityValidated, true);
  assert.equal(summary.somaliHolidayFoodNaturalnessParityValidated, true);
});

test('TRANSLATE-COMPLETE keeps rule-of-law English natural while allowing internal tags', () => {
  const questions = loadTs('data/questions.ts', 'questions');
  const staticQuestions = loadStaticQuestions();
  const offenders = [];

  questions.forEach((question) => pushCanonicalQuestionOffenders(offenders, question));
  staticQuestions.forEach((question) => pushStaticQuestionOffenders(offenders, question));

  assert.ok(
    questions.some((question) => question.tags.includes('legal-certainty')),
    'internal legal-certainty tag remains allowed',
  );
  assert.deepEqual(offenders, []);
});
