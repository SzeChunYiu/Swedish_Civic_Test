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
const supportedQuestionProvenance = new Set(['uhr', 'derived', 'editorial']);

function runStaticQuestionBank(source) {
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SMT_QUESTIONS;
}

function expectedQuestionProvenance(question) {
  if (question.tags?.includes('editorial')) return 'editorial';
  if (question.tags?.includes('published-variant')) return 'derived';
  return 'uhr';
}

function countQuestionProvenance(questions) {
  return questions.reduce(
    (counts, question) => {
      counts[question.questionProvenance] += 1;
      return counts;
    },
    { uhr: 0, derived: 0, editorial: 0 },
  );
}

test('static site question bank is generated from canonical content', () => {
  const expected = generateStaticSiteQuestionBankJs();
  const actual = fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8');

  assert.equal(actual, expected);
});

test('static site question bank exposes the canonical question and chapter counts', () => {
  const bank = buildSiteQuestionBank();
  const questions = runStaticQuestionBank(generateStaticSiteQuestionBankJs());

  assert.equal(questions.length, bank.questions.length);
  const context = { window: {} };
  vm.runInNewContext(generateStaticSiteQuestionBankJs(), context);
  assert.equal(context.window.SMT_CHAPTERS_META.length, bank.chapters.length);
  assert.equal(context.window.SMT_CHAPTERS_META.length, 13);
});

test('static site question bank mirrors question provenance for every row', () => {
  const generatedBank = buildSiteQuestionBank();
  const shippedQuestions = runStaticQuestionBank(
    fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'),
  );
  const generatedQuestionsById = new Map(
    generatedBank.questions.map((question) => [question.id, question]),
  );

  assert.equal(shippedQuestions.length, generatedBank.questions.length);

  for (const question of generatedBank.questions) {
    assert.ok(
      supportedQuestionProvenance.has(question.questionProvenance),
      `${question.id} generated bank should expose supported questionProvenance`,
    );
    assert.equal(question.questionProvenance, expectedQuestionProvenance(question));
  }

  for (const question of shippedQuestions) {
    const generatedQuestion = generatedQuestionsById.get(question.id);
    assert.ok(generatedQuestion, `${question.id} should exist in generated canonical bank`);
    assert.equal(
      question.questionProvenance,
      generatedQuestion.questionProvenance,
      `${question.id} static bank provenance should match canonical export`,
    );
  }

  const counts = countQuestionProvenance(shippedQuestions);
  assert.ok(counts.uhr > 0, 'static bank should include direct UHR provenance rows');
  assert.ok(counts.derived > 0, 'static bank should include generated derived rows');
});
