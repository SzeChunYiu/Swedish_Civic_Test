const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const {
  buildPublishedQuestionListFromSourceQuestions,
  buildSiteQuestionBank,
  formatStaticQuestionBankDrift,
  generateStaticSiteQuestionBankJs,
  loadCanonicalExportInputs,
  summarizeStaticQuestionBankDrift,
} = require('../scripts/export-site-question-bank');

const repoRoot = path.resolve(__dirname, '..');

function withSvEn(localizedText, sv, en) {
  return localizedText ? { ...localizedText, sv, en } : localizedText;
}

function withQ020AdvisoryFixture(question) {
  const explanationSv =
    'Folkomröstningar kan hållas om en särskild fråga nationellt, i en region eller i en kommun. De är rådgivande, så politikerna behöver inte följa resultatet.';
  const explanationEn =
    'Referendums can be held on a specific issue nationally, in a region, or in a municipality. They are advisory, so politicians are not required to follow the result.';

  return {
    ...question,
    explanationSv,
    explanationEn,
    explanationText: withSvEn(question.explanationText, explanationSv, explanationEn),
    options: question.options.map((option) => {
      if (option.id !== 'a') return option;
      const textSv = 'Politikerna behöver inte följa resultatet';
      const textEn = 'Politicians are not required to follow the result';
      return {
        ...option,
        textSv,
        textEn,
        text: withSvEn(option.text, textSv, textEn),
      };
    }),
  };
}

test('static site question bank is semantically generated from canonical content', () => {
  const expectedBank = buildSiteQuestionBank();
  const generated = generateStaticSiteQuestionBankJs();
  const actual = fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8');
  const drift = summarizeStaticQuestionBankDrift(actual, expectedBank, generated);

  assert.equal(drift.hasSemanticDrift, false);
  assert.deepEqual(drift.questionIds, []);
  assert.deepEqual(drift.chapterIds, []);
  assert.equal(drift.formatOnly || drift.sourceMatchesGenerated, true);
});

test('static site question bank exposes the canonical question and chapter counts', () => {
  const bank = buildSiteQuestionBank();
  const context = { window: {} };
  vm.runInNewContext(generateStaticSiteQuestionBankJs(), context);

  assert.equal(context.window.SMT_QUESTIONS.length, bank.questions.length);
  assert.equal(context.window.SMT_CHAPTERS_META.length, bank.chapters.length);
  assert.equal(context.window.SMT_CHAPTERS_META.length, 13);
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.window.SMT_QUESTION_BANK_META)),
    bank.metadata,
  );
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

test('static site question bank drift report classifies format-only mismatches', () => {
  const expectedBank = buildSiteQuestionBank();
  const generated = generateStaticSiteQuestionBankJs();
  const drift = summarizeStaticQuestionBankDrift(`${generated}\n`, expectedBank, generated);

  assert.equal(drift.hasSemanticDrift, false);
  assert.equal(drift.formatOnly, true);
  assert.match(formatStaticQuestionBankDrift(drift), /Format-only drift: yes/);
  assert.match(formatStaticQuestionBankDrift(drift), /Changed question ids: none/);
});

test('static site question bank source fixture limits one-question localization churn', () => {
  const canonical = loadCanonicalExportInputs();
  const touchedSourceQuestions = canonical.sourceQuestions.map((question) =>
    question.id === 'q020' ? withQ020AdvisoryFixture(question) : question,
  );
  const touchedQuestions = buildPublishedQuestionListFromSourceQuestions(touchedSourceQuestions);
  const expectedBank = buildSiteQuestionBank({
    questions: touchedQuestions,
    chapters: canonical.chapters,
    getQuestionProvenance: canonical.getQuestionProvenance,
  });
  const baselineSource = generateStaticSiteQuestionBankJs({
    questions: canonical.questions,
    chapters: canonical.chapters,
    getQuestionProvenance: canonical.getQuestionProvenance,
  });

  const drift = summarizeStaticQuestionBankDrift(baselineSource, expectedBank);

  assert.equal(drift.hasSemanticDrift, true);
  assert.equal(drift.questionIds[0], 'q020');
  assert.equal(drift.questionIds.length, 5);
  assert.ok(
    drift.questionIds.slice(1).every((questionId) => /^q\d{3}$/.test(questionId)),
    `expected only generated q020 variants to drift, got ${drift.questionIds.join(', ')}`,
  );
  assert.deepEqual(drift.chapterIds, []);
});
