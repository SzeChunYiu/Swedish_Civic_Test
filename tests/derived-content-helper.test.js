const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('single-choice judgement prompts call defined completion helpers', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'lib/content/derivedQuestions.ts'), 'utf8');
  const judgementPromptIndex = source.indexOf('function judgementPromptSv');
  const svHelperIndex = source.indexOf('function singleChoiceCompletionPromptSv');
  const enHelperIndex = source.indexOf('function singleChoiceCompletionPromptEn');

  assert.notEqual(judgementPromptIndex, -1, 'judgementPromptSv must be defined');
  assert.notEqual(svHelperIndex, -1, 'singleChoiceCompletionPromptSv must be defined');
  assert.notEqual(enHelperIndex, -1, 'singleChoiceCompletionPromptEn must be defined');
});
