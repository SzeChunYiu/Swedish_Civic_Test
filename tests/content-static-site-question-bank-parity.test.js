const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const {
  buildSiteQuestionBank,
  classifyStaticSiteQuestionBankDrift,
  generateStaticSiteQuestionBankJs,
  generateUnformattedStaticSiteQuestionBankJs,
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

test('static site question bank drift classifier separates formatting from semantics', () => {
  const expected = generateStaticSiteQuestionBankJs();
  const formatOnly = generateUnformattedStaticSiteQuestionBankJs();
  const semanticDrift = expected.replace("id: 'q001'", "id: 'q999'");

  assert.notEqual(formatOnly, expected, 'fixture should differ only by generated JS formatting');
  assert.notEqual(semanticDrift, expected, 'fixture should change the exported question data');
  assert.equal(classifyStaticSiteQuestionBankDrift(expected, expected).kind, 'none');
  assert.equal(classifyStaticSiteQuestionBankDrift(formatOnly, expected).kind, 'format');
  assert.equal(classifyStaticSiteQuestionBankDrift(semanticDrift, expected).kind, 'semantic');
});

test('static site chapter metadata exposes canonical sv/en localized text', () => {
  const bank = buildSiteQuestionBank();
  const context = { window: {} };
  vm.runInNewContext(generateStaticSiteQuestionBankJs(), context);

  assert.equal(context.window.SMT_CHAPTERS_META.length, bank.chapters.length);
  context.window.SMT_CHAPTERS_META.forEach((chapter, index) => {
    const expected = bank.chapters[index];
    assert.equal(chapter.title.sv, expected.title.sv, `${chapter.id} title.sv should export`);
    assert.equal(chapter.title.en, expected.title.en, `${chapter.id} title.en should export`);
    assert.equal(
      chapter.description.sv,
      expected.description.sv,
      `${chapter.id} description.sv should export`,
    );
    assert.equal(
      chapter.description.en,
      expected.description.en,
      `${chapter.id} description.en should export`,
    );
  });
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

test('static site q831 names the non-citizen voting subject', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);

  const q831 = context.window.SMT_QUESTIONS.find((question) => question.id === 'q831');
  const q832 = context.window.SMT_QUESTIONS.find((question) => question.id === 'q832');

  assert.ok(q831, 'q831 should be present in the static question bank');
  assert.equal(q831.type, 'true_false');
  assert.equal(q831.answer, 0);
  assert.match(q831.q.sv, /personer som inte är svenska medborgare/);
  assert.match(q831.q.sv, /kommun- och regionval/);
  assert.match(q831.q.en, /people who are not Swedish citizens/);
  assert.match(q831.q.en, /municipal and regional elections/);
  assert.doesNotMatch(q831.q.sv, /^Vissa kan rösta om/);
  assert.doesNotMatch(q831.q.en, /^Some may vote if/);

  assert.ok(q832, 'q832 should remain paired with q831');
  assert.equal(q832.type, 'true_false');
  assert.equal(q832.answer, 1);
  assert.match(q832.q.en, /^No one without Swedish citizenship/);
});
