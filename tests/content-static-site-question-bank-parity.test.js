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
const {
  generatedQuestionId,
  generatedQuestionIdLiteralFindingsForSource,
} = require('../scripts/generated-question-fixture-ids');

const repoRoot = path.resolve(__dirname, '..');
const SOMALI_ENGLISH_GEOGRAPHY_TERM_PATTERN = /\b(?:Mediterranean|Baltic|Atlantic|Gulf Stream)\b/;
const PUBLIC_SERVICE_LOANWORD_LOCALES = ['pl', 'so', 'tr', 'uk'];
const PUBLIC_SERVICE_LOANWORD_PATTERN = /\bpublic service\b/i;

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

function staticSomaliSegments(question) {
  return [
    [`${question.id}.q.so`, question.q?.so],
    [`${question.id}.why.so`, question.why?.so],
    ...(question.opts || []).map((option, index) => [`${question.id}.opts.${index}.so`, option.so]),
  ];
}

function staticPublicServiceSegments(question) {
  const segments = [];

  for (const locale of PUBLIC_SERVICE_LOANWORD_LOCALES) {
    segments.push([`${question.id}.q.${locale}`, question.q?.[locale]]);
    segments.push([`${question.id}.why.${locale}`, question.why?.[locale]]);

    for (const [index, option] of (question.opts || []).entries()) {
      segments.push([`${question.id}.opts.${index}.${locale}`, option[locale]]);
    }
  }

  return segments;
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

test('static site question bank avoids English geography common terms in Somali text', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);

  const offenders = [];
  for (const question of context.window.SMT_QUESTIONS) {
    for (const [segment, value] of staticSomaliSegments(question)) {
      if (typeof value === 'string' && SOMALI_ENGLISH_GEOGRAPHY_TERM_PATTERN.test(value)) {
        offenders.push(segment);
      }
    }
  }

  assert.deepEqual(offenders, []);
});

test('static site question bank avoids English public service loanwords in target-language media text', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);

  const offenders = [];
  for (const question of context.window.SMT_QUESTIONS) {
    for (const [segment, value] of staticPublicServiceSegments(question)) {
      if (typeof value === 'string' && PUBLIC_SERVICE_LOANWORD_PATTERN.test(value)) {
        offenders.push(segment);
      }
    }
  }

  assert.deepEqual(offenders, []);
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
  const q020GeneratedVariantIds = [0, 1, 2, 3].map((variantOffset) =>
    generatedQuestionId(canonical.sourceQuestions, 'q020', variantOffset),
  );

  assert.equal(drift.hasSemanticDrift, true);
  assert.equal(drift.questionIds[0], 'q020');
  assert.deepEqual(drift.questionIds.slice(1), q020GeneratedVariantIds);
  assert.deepEqual(drift.chapterIds, []);
});

test('static question-bank drift fixture derives generated ids from source ids', () => {
  const canonical = loadCanonicalExportInputs();
  const source = fs.readFileSync(__filename, 'utf8');
  const findings = generatedQuestionIdLiteralFindingsForSource(
    'tests/content-static-site-question-bank-parity.test.js',
    source,
    canonical.sourceQuestions.length + 1,
  );

  assert.deepEqual(findings, []);
  assert.match(source, /generatedQuestionId\(canonical\.sourceQuestions, 'q020', variantOffset\)/);
  assert.match(source, /assert\.equal\(drift\.questionIds\[0\], 'q020'\)/);
});

test('static generated-id fixture guard rejects literal generated ids but allows source ids', () => {
  const firstGeneratedNumber = 900;
  const generatedLiteral = `q${String(firstGeneratedNumber).padStart(3, '0')}`;
  const nextGeneratedLiteral = `q${String(firstGeneratedNumber + 1).padStart(3, '0')}`;
  const findings = generatedQuestionIdLiteralFindingsForSource(
    'tests/content-static-site-question-bank-parity.test.js',
    [
      "assert.equal(drift.questionIds[0], 'q020');",
      `assert.deepEqual(drift.questionIds.slice(1), ['${generatedLiteral}']);`,
      'const expected = {',
      `  ${nextGeneratedLiteral}: { questionSv: 'stale generated fixture' },`,
      '};',
      "const derived = generatedQuestionId(canonical.sourceQuestions, 'q020', variantOffset);",
    ].join('\n'),
    firstGeneratedNumber,
  );

  assert.deepEqual(findings, [
    `tests/content-static-site-question-bank-parity.test.js:2 hardcodes generated question id literal ${generatedLiteral}`,
    `tests/content-static-site-question-bank-parity.test.js:4 hardcodes generated question id object key ${nextGeneratedLiteral}`,
  ]);
});
