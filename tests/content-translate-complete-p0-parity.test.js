const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
let cachedSummary;

function validateContentSummary() {
  if (cachedSummary) return cachedSummary;
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
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

test("TRANSLATE-COMPLETE q128 New Year's Eve date naturalness guard is summarized", () => {
  const summary = validateContentSummary();

  assert.equal(
    summary.questionNewYearsEveDateEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
});

test('TRANSLATE-COMPLETE rejects literal legal certainty in learner-facing English', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const source = String(contents);
    const mutated = source.replace("textEn: 'The rule of law'", "textEn: 'Legal certainty'");
    if (mutated === source) {
      throw new Error('rule-of-law mutation target not found');
    }
    return mutated;
  }
  return contents;
};
process.argv.push('--focus-translate-complete');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q014 uses literal legal certainty English for rättssäkerhet/i,
  );
});

test('TRANSLATE-COMPLETE q128 Lucia Day date naturalness guard is summarized', () => {
  const summary = validateContentSummary();

  assert.equal(summary.questionLuciaDayDateEnglishNaturalnessValidated, summary.publishedQuestions);
});
