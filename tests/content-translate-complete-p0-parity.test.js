const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

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
  assert.equal(
    summary.questionPublicServiceBroadcasterEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(
    summary.questionAgriculturalSwedenEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.questionLargestLakesEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.questionRecordYearsEnglishNaturalnessValidated, summary.publishedQuestions);
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

test('TRANSLATE-COMPLETE rejects q075 agricultural Sweden comma-splice English', () => {
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
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents).replace(
      'Almost the whole population lived in the countryside and worked on farms, growing crops and caring for animals. Cities were small, and Sweden was poor compared with other European countries.',
      'Almost the whole population lived in the countryside and worked by farming and caring for animals, cities were small, and Sweden was poor compared with other European countries.',
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
    /q075 uses stilted agricultural Sweden English wording/,
  );
});
