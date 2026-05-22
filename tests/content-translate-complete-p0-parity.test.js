const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
let cachedSummary;
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
  if (cachedSummary) return cachedSummary;
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-translate-complete-p0'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  cachedSummary = JSON.parse(match[0]);
  return cachedSummary;
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
  assert.equal(summary.questionOlderSickEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.questionSaltsjobadenEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(
    summary.questionCouncilOfEuropeWorkForEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.questionMayDayEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.questionPublicSectorEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(
    summary.questionPublicServiceBroadcasterEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.questionLargestLakesEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(
    summary.questionNationalMinoritiesEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(
    summary.questionNewYearsEveDateEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.questionLuciaDayDateEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.questionRecordYearsEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.questionSuffrage1921EnglishNaturalnessValidated, summary.publishedQuestions);
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
  assert.equal(
    summary.questionRuleOfLawEnglishNaturalnessValidated,
    summary.publishedQuestions * 3,
  );
  assert.equal(summary.somaliGeographyNaturalnessParityValidated, true);
  assert.equal(summary.somaliHolidayFoodNaturalnessParityValidated, true);
});

test('TRANSLATE-COMPLETE rejects q080 suffrage explanation meta wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
process.argv.push('--focus-translate-complete-p0');
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents).replace(
      'Almost all men had gained suffrage in 1909, and the decision on universal suffrage came in 1918, but the first Riksdag election held after those reforms was in 1921.',
      'Almost all men had gained suffrage in 1909 and the decision on universal suffrage came in 1918, but 1921 is the year of the election asked about here.',
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q080 uses meta suffrage-election English wording/,
  );
});
