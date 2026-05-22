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
const {
  Q050_SOURCE_CRITICISM_NATURALNESS_IDS,
  Q062_PUBLIC_SECTOR_NATURALNESS_IDS,
  Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS,
  SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS,
  summarizeQ050SourceCriticismNaturalness,
  summarizeQ062PublicSectorNaturalness,
  summarizeQ166Q169KommunRegionNaturalness,
  summarizeSomaliHolidayFoodNaturalness,
} = require('../scripts/check-question-i18n-v8');

const repoRoot = path.resolve(__dirname, '..');
const SOMALI_ENGLISH_GEOGRAPHY_TERM_PATTERN = /\b(?:Mediterranean|Baltic|Atlantic|Gulf Stream)\b/;
const SOMALI_HOLIDAY_FOOD_ENGLISH_TOKEN_PATTERN = /\b(?:herring|strawberries|Easter)\b/i;
const CHAPTER_LOCALIZATION_ENGLISH_WELFARE_GLOSS_PATTERN = /\(welfare\)/i;
const PUBLIC_SERVICE_LOANWORD_PATTERN = /\bpublic service\b|\(welfare\)/i;
const PUBLIC_SECTOR_STALE_STATIC_PATTERN =
  /\bWhat is meant by the public sector in Sweden\b|\bWhich fact is correct regarding what the public sector in Sweden is\b|\bActivities for which the state, regions, and municipalities are responsible\b|\bThe public sector(?: in Sweden)? means\b/i;
const SUFFRAGE_1921_STALE_STATIC_PATTERN =
  /\b1921 is the year of the election asked about here\b|\bthe year of the election asked about here\b/i;
const SUFFRAGE_1921_EXPECTED_STATIC_EXPLANATION =
  "the first Riksdag election with both women's and men's voting rights and women's eligibility was held in 1921";
const SOURCE_CRITICISM_STALE_STATIC_PATTERN =
  /具有(?:來|来)源批判意識|أن تكون ناقدًا للمصادر|سەرچاوە-ڕەخنەیی|منبع‌سنج بودن|krytyczne podejście do źródeł|si naqdineed loo eego ilaha|ንምንጭታት ብነቐፌታዊ መንገዲ ምርኣይ|kaynaklara eleştirel yaklaşmak|критично ставитися до джерел/i;
const KOMMUN_REGION_STATIC_LOCALE_PATTERNS = {
  'zh-Hant': /\b(?:kommun|region)\b/i,
  'zh-Hans': /\b(?:kommun|region)\b/i,
  pl: /\bkommun\b/i,
  so: /\b(?:kommun|region)\b/i,
  ti: /\b(?:kommun|region)\b/i,
  tr: /\b(?:kommun|region)\b/i,
  uk: /\b(?:kommun|region)\b/i,
};
const NEW_YEARS_EVE_DATE_STALE_PATTERN = /\bNew Year(?:’|')s Eve on 31 December\b/i;
const LUCIA_DAY_DATE_STALE_PATTERN = /\bLucia Day on 13 December\b/i;
const BASE_LOCALES = new Set(['sv', 'en']);

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
  return [
    ...Object.entries(question.q || {}).map(([locale, value]) => [
      `${question.id}.q.${locale}`,
      value,
    ]),
    ...Object.entries(question.why || {}).map(([locale, value]) => [
      `${question.id}.why.${locale}`,
      value,
    ]),
    ...(question.opts || []).flatMap((option, index) =>
      Object.entries(option || {}).map(([locale, value]) => [
        `${question.id}.opts.${index}.${locale}`,
        value,
      ]),
    ),
  ].filter(([segment]) => {
    const locale = String(segment).split('.').at(-1);
    return !BASE_LOCALES.has(locale);
  });
}

function staticLocalizedSegments(question, locales) {
  return [
    ...locales.map((locale) => [`${question.id}.q.${locale}`, question.q?.[locale]]),
    ...locales.map((locale) => [`${question.id}.why.${locale}`, question.why?.[locale]]),
    ...(question.opts || []).flatMap((option, index) =>
      locales.map((locale) => [`${question.id}.opts.${index}.${locale}`, option?.[locale]]),
    ),
  ];
}

function staticQuestionToI18nQuestion(question) {
  return {
    id: question.id,
    questionText: question.q,
    explanationText: question.why,
    options: (question.opts || []).map((option, index) => ({
      id: String(index),
      text: option,
    })),
    correctOptionId: String(question.answer),
  };
}

function staticQuestionVisibleText(question) {
  return JSON.stringify([question.q, question.why, question.opts]);
}

function chapterLocalizationWelfareGlossOffenders(chapters, scope) {
  const offenders = [];
  for (const chapter of chapters) {
    for (const field of ['title', 'description']) {
      const localized = chapter[field] || {};
      for (const [locale, value] of Object.entries(localized)) {
        if (BASE_LOCALES.has(locale)) continue;
        if (
          typeof value === 'string' &&
          CHAPTER_LOCALIZATION_ENGLISH_WELFARE_GLOSS_PATTERN.test(value)
        ) {
          offenders.push(`${scope}.chapter${chapter.id}.${field}.${locale}`);
        }
      }
    }
  }

  return offenders;
}

test('static site question bank is semantically generated from canonical content', () => {
  const expectedBank = buildSiteQuestionBank();
  const generated = generateStaticSiteQuestionBankJs();
  const actual = fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8');
  const drift = summarizeStaticQuestionBankDrift(actual, expectedBank, generated);

  assert.equal(drift.hasSemanticDrift, false);
  assert.deepEqual(drift.questionIds, []);
  assert.deepEqual(drift.chapterIds, []);
  assert.equal(drift.sourceMatchesGenerated, true, formatStaticQuestionBankDrift(drift));
  assert.equal(drift.formatOnly, false);
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

test('static site question bank avoids English holiday-food tokens in Somali text', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);
  const questionsById = new Map(
    context.window.SMT_QUESTIONS.map((question) => [question.id, question]),
  );

  const sourceQuestions = SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS.map((id) =>
    staticQuestionToI18nQuestion(questionsById.get(id)),
  );
  assert.deepEqual(
    summarizeSomaliHolidayFoodNaturalness(sourceQuestions, SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS)
      .errors,
    [],
  );

  const offenders = [];
  for (const question of context.window.SMT_QUESTIONS) {
    for (const [segment, value] of staticSomaliSegments(question)) {
      if (typeof value === 'string' && SOMALI_HOLIDAY_FOOD_ENGLISH_TOKEN_PATTERN.test(value)) {
        offenders.push(segment);
      }
    }
  }

  assert.deepEqual(offenders, []);
});

test('static site question bank keeps q062 public-sector i18n and generated variants direct', () => {
  const expectedBank = buildSiteQuestionBank();
  const sourceQuestions = expectedBank.questions.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const publicSectorIds = [
    'q062',
    generatedQuestionId(sourceQuestions, 'q062', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q062', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q062', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q062', 'judgement'),
  ];
  const localizedOptionIds = [
    'q062',
    generatedQuestionId(sourceQuestions, 'q062', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q062', 'judgement'),
  ];
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);
  const questionsById = new Map(
    context.window.SMT_QUESTIONS.map((question) => [question.id, question]),
  );
  const q062 = questionsById.get('q062');

  assert.ok(q062, 'q062 should be present in static question bank');
  assert.deepEqual(
    summarizeQ062PublicSectorNaturalness(
      [staticQuestionToI18nQuestion(q062)],
      Q062_PUBLIC_SECTOR_NATURALNESS_IDS,
    ).errors,
    [],
  );

  for (const id of publicSectorIds) {
    const question = questionsById.get(id);
    assert.ok(question, `${id} should be present in static question bank`);
    assert.doesNotMatch(staticQuestionVisibleText(question), PUBLIC_SECTOR_STALE_STATIC_PATTERN);
  }

  const localizedCorrectOptionTerms = {
    en: 'fund through taxes',
    'zh-Hant': '稅收',
    'zh-Hans': '税收',
    ar: 'الضرائب',
    ckb: 'باج',
    fa: 'مالیات',
    pl: 'podatków',
    so: 'canshuur',
    ti: 'ግብሪ',
    tr: 'vergiler',
    uk: 'податків',
  };

  for (const id of localizedOptionIds) {
    const question = questionsById.get(id);
    const correctOption = question.opts[question.answer];
    for (const [locale, term] of Object.entries(localizedCorrectOptionTerms)) {
      assert.ok(
        String(correctOption[locale] || '').includes(term),
        `${id}.opts.${question.answer}.${locale} should include ${term}`,
      );
    }
  }
});

test('static site question bank keeps q166/q169 kommun-region i18n target-language first', () => {
  const expectedBank = buildSiteQuestionBank();
  const sourceQuestions = expectedBank.questions.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const ids = [
    'q166',
    generatedQuestionId(sourceQuestions, 'q166', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q166', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q166', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q166', 'judgement'),
    'q169',
    generatedQuestionId(sourceQuestions, 'q169', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q169', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q169', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q169', 'judgement'),
  ];
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);
  const questionsById = new Map(
    context.window.SMT_QUESTIONS.map((question) => [question.id, question]),
  );
  const sourceRows = Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS.map((id) =>
    staticQuestionToI18nQuestion(questionsById.get(id)),
  );

  assert.deepEqual(
    summarizeQ166Q169KommunRegionNaturalness(sourceRows, Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS)
      .errors,
    [],
  );

  const offenders = [];
  for (const id of ids) {
    const question = questionsById.get(id);
    assert.ok(question, `${id} should be present in static question bank`);

    for (const [locale, pattern] of Object.entries(KOMMUN_REGION_STATIC_LOCALE_PATTERNS)) {
      for (const [segment, value] of staticLocalizedSegments(question, [locale])) {
        if (typeof value === 'string' && pattern.test(value)) {
          offenders.push(segment);
        }
      }
    }
  }

  assert.deepEqual(offenders, []);
});

test('static site question bank keeps q080 suffrage explanations learner-facing', () => {
  const expectedBank = buildSiteQuestionBank();
  const sourceQuestions = expectedBank.questions.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const suffrageIds = [
    'q080',
    generatedQuestionId(sourceQuestions, 'q080', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q080', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q080', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q080', 'judgement'),
  ];
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);
  const questionsById = new Map(
    context.window.SMT_QUESTIONS.map((question) => [question.id, question]),
  );

  for (const id of suffrageIds) {
    const question = questionsById.get(id);
    assert.ok(question, `${id} should be present in static question bank`);
    const visibleText = staticQuestionVisibleText(question);
    assert.ok(visibleText.includes(SUFFRAGE_1921_EXPECTED_STATIC_EXPLANATION));
    assert.doesNotMatch(visibleText, SUFFRAGE_1921_STALE_STATIC_PATTERN);
  }
});

test('static site question bank keeps q128 holiday date options appositive', () => {
  const expectedBank = buildSiteQuestionBank();
  const sourceQuestions = expectedBank.questions.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const singleChoiceId = generatedQuestionId(sourceQuestions, 'q128', 'singleChoice');
  const trueStatementId = generatedQuestionId(sourceQuestions, 'q128', 'trueStatement');
  const falseStatementId = generatedQuestionId(sourceQuestions, 'q128', 'falseStatement');
  const judgementId = generatedQuestionId(sourceQuestions, 'q128', 'judgement');
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);
  const questionsById = new Map(
    context.window.SMT_QUESTIONS.map((question) => [question.id, question]),
  );

  for (const id of ['q128', singleChoiceId, trueStatementId, falseStatementId, judgementId]) {
    assert.ok(questionsById.get(id), `${id} should be present in static question bank`);
  }

  for (const id of ['q128', singleChoiceId, judgementId]) {
    const question = questionsById.get(id);
    assert.equal(question.opts[2].en, "On New Year's Eve, 31 December");
    assert.equal(question.opts[3].en, 'On Lucia Day, 13 December');
    assert.doesNotMatch(staticQuestionVisibleText(question), NEW_YEARS_EVE_DATE_STALE_PATTERN);
    assert.doesNotMatch(staticQuestionVisibleText(question), LUCIA_DAY_DATE_STALE_PATTERN);
  }

  assert.equal(questionsById.get('q128').answer, 0);
  assert.equal(questionsById.get(trueStatementId).answer, 0);
  assert.equal(questionsById.get(falseStatementId).answer, 1);
});

test('static site question bank keeps q050 source-criticism i18n noun-based', () => {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);
  const questionsById = new Map(
    context.window.SMT_QUESTIONS.map((question) => [question.id, question]),
  );
  const q050 = questionsById.get('q050');

  assert.ok(q050, 'q050 should be present in static question bank');
  assert.deepEqual(
    summarizeQ050SourceCriticismNaturalness(
      [staticQuestionToI18nQuestion(q050)],
      Q050_SOURCE_CRITICISM_NATURALNESS_IDS,
    ).errors,
    [],
  );
  assert.doesNotMatch(staticQuestionVisibleText(q050), SOURCE_CRITICISM_STALE_STATIC_PATTERN);
});

test('static site question bank keeps q080 suffrage explanation learner-facing', () => {
  const expectedBank = buildSiteQuestionBank();
  const sourceQuestions = expectedBank.questions.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const expectedIds = [
    'q080',
    generatedQuestionId(sourceQuestions, 'q080', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q080', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q080', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q080', 'judgement'),
  ];
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);
  const questionsById = new Map(
    context.window.SMT_QUESTIONS.map((question) => [question.id, question]),
  );

  for (const id of expectedIds) {
    const question = questionsById.get(id);
    assert.ok(question, `${id} should be present in static question bank`);
    assert.doesNotMatch(question.why.en, Q080_SUFFRAGE_STALE_STATIC_PATTERN);
    assert.match(question.why.en, Q080_SUFFRAGE_REVISED_STATIC_PATTERN);
  }
});

test('chapter localization metadata avoids parenthetical English welfare glosses', () => {
  const bank = buildSiteQuestionBank();
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site', 'questions.js'), 'utf8'), context);

  assert.deepEqual(chapterLocalizationWelfareGlossOffenders(bank.chapters, 'canonical'), []);
  assert.deepEqual(
    chapterLocalizationWelfareGlossOffenders(context.window.SMT_CHAPTERS_META, 'static'),
    [],
  );
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
  const touchedSource = generateStaticSiteQuestionBankJs({
    questions: touchedQuestions,
    chapters: canonical.chapters,
    getQuestionProvenance: canonical.getQuestionProvenance,
  });

  const drift = summarizeStaticQuestionBankDrift(baselineSource, expectedBank, touchedSource);
  const q020GeneratedVariantIds = [0, 1, 2, 3].map((variantOffset) =>
    generatedQuestionId(canonical.sourceQuestions, 'q020', variantOffset),
  );

  assert.equal(drift.hasSemanticDrift, true);
  assert.equal(drift.formatOnly, false);
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
