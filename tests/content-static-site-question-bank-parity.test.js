const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const {
  buildSiteQuestionBank,
  generateStaticSiteQuestionBankJs,
} = require('../scripts/export-site-question-bank');

const repoRoot = path.resolve(__dirname, '..');

test('static site question bank is generated from canonical content', () => {
  const expected = generateStaticSiteQuestionBankJs();
  const actual = fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8');

  assert.equal(actual, expected);
});

test('static site question bank exposes the canonical question and chapter counts', () => {
  const bank = buildSiteQuestionBank();
  const context = { window: {} };
  vm.runInNewContext(generateStaticSiteQuestionBankJs(), context);

  assert.equal(context.window.SMT_QUESTIONS.length, bank.questions.length);
  assert.equal(context.window.SMT_CHAPTERS_META.length, bank.chapters.length);
  assert.equal(context.window.SMT_CHAPTERS_META.length, 13);
});

test('static site question bank preserves canonical question provenance', () => {
  const bank = buildSiteQuestionBank();
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);

  const expectedProvenanceById = new Map(
    bank.questions.map((question) => [question.id, question.questionProvenance]),
  );
  const supported = new Set(['uhr', 'derived', 'editorial']);

  for (const question of context.window.SMT_QUESTIONS) {
    assert.equal(
      question.questionProvenance,
      expectedProvenanceById.get(question.id),
      `${question.id} should mirror canonical questionProvenance`,
    );
    assert.ok(
      supported.has(question.questionProvenance),
      `${question.id} should expose supported questionProvenance`,
    );
  }
});
