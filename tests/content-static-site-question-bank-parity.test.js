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
const {
  findGeneratedSingleChoiceDuplicateStemOptions,
} = require('./helpers/generatedSingleChoiceDuplicateGuard.cjs');

const repoRoot = path.resolve(__dirname, '..');

function readStaticSiteQuestions() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);
  return context.window.SMT_QUESTIONS;
}

function guardQuestionFromStaticQuestion(question) {
  return {
    id: question.id,
    type: question.type,
    questionSv: question.q?.sv,
    questionEn: question.q?.en,
    options: (question.opts || []).map((option) => ({
      sv: option.sv,
      en: option.en,
    })),
    tags: question.tags || [],
  };
}

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
  const questions = readStaticSiteQuestions();

  const expectedProvenanceById = new Map(
    bank.questions.map((question) => [question.id, question.questionProvenance]),
  );
  const supported = new Set(['uhr', 'derived', 'editorial']);

  for (const question of questions) {
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

test('static site question bank has no generated single-choice duplicate stems', () => {
  const questions = readStaticSiteQuestions().map(guardQuestionFromStaticQuestion);
  const findings = findGeneratedSingleChoiceDuplicateStemOptions(questions, {
    artifactLabel: 'site/questions.js',
  });

  assert.deepEqual(findings, []);
});

test('static generated single-choice duplicate guard rejects q001 variant collapse', () => {
  const questions = readStaticSiteQuestions().map(guardQuestionFromStaticQuestion);
  const sectionPractice = questions.find((question) => question.id === 'q170');
  const judgement = questions.find((question) => question.id === 'q173');
  assert.ok(sectionPractice && judgement, 'expected q001 generated single-choice variants');

  judgement.questionSv = sectionPractice.questionSv;
  judgement.questionEn = sectionPractice.questionEn;
  judgement.options = sectionPractice.options.map((option) => ({ ...option }));

  const findings = findGeneratedSingleChoiceDuplicateStemOptions(questions, {
    artifactLabel: 'site/questions.js',
  });

  assert.equal(findings.length, 1);
  assert.match(findings[0], /site\/questions\.js: q173 duplicates q170/);
});
