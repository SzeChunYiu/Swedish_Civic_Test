const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
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
  assert.equal(summary.questionLargestLakesEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(
    summary.questionNationalMinoritiesEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
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
