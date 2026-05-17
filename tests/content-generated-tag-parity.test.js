const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

test('generated question tags exactly match source tags plus variant convention tags', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.generatedTagTemplateParityValidated, summary.generatedPublishedQuestions);
  assert.equal(summary.generatedTagTemplateParityValidated, summary.generatedPublishedQuestions);
});
