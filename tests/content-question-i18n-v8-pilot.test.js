const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  checkQuestions,
  checkLocalizationSourceShape,
  checkPublicServiceLoanwordNaturalness,
  checkSomaliGeographyNaturalness,
  checkReviewMetadata,
  PUBLIC_SERVICE_LOANWORD_IDS,
  REQUIRED_LOCALES,
  SOMALI_GEOGRAPHY_NATURALNESS_IDS,
  summarizePublicServiceLoanwordNaturalness,
  summarizeSomaliGeographyNaturalness,
} = require('../scripts/check-question-i18n-v8');

function completeMap(value = 'x') {
  return Object.fromEntries(REQUIRED_LOCALES.map((locale) => [locale, value]));
}

test('question localization v8 pilot covers the current pilot ids in every picker locale', () => {
  const output = execFileSync(process.execPath, ['scripts/check-question-i18n-v8.js'], {
    encoding: 'utf8',
  });
  assert.match(output, /Question i18n pilot OK \(181 questions, 12 locales\)/);
});

test('question localization v8 pilot rejects missing target-language option text', () => {
  const optionText = completeMap('option');
  optionText.uk = '';
  const errors = checkQuestions(
    [
      {
        id: 'q001',
        questionSv: 'Fråga?',
        questionEn: 'Question?',
        questionText: completeMap('question'),
        explanationSv: 'Förklaring.',
        explanationEn: 'Explanation.',
        explanationText: completeMap('explanation'),
        options: [{ id: 'a', textSv: 'Svar', textEn: 'Answer', text: optionText }],
        correctOptionId: 'a',
      },
    ],
    ['q001'],
  );

  assert.ok(errors.includes('q001.options.a.text.uk missing'));
});

test('question localization v8 review metadata marks every target locale machine-assisted only', () => {
  const errors = checkReviewMetadata(
    {
      q001: Object.fromEntries(
        REQUIRED_LOCALES.filter((locale) => !['sv', 'en'].includes(locale)).map((locale) => [
          locale,
          {
            status: 'machine_assisted',
            nativeReviewStatus: 'pending_native_review',
            source: 'question_localization_v8',
          },
        ]),
      ),
    },
    ['q001'],
  );

  assert.deepEqual(errors, []);
});

test('question localization v8 review metadata rejects missing or prematurely approved locale status', () => {
  const errors = checkReviewMetadata(
    {
      q001: {
        ar: {
          status: 'native_reviewed',
          nativeReviewStatus: 'reviewed',
          source: 'question_localization_v8',
        },
      },
    },
    ['q001'],
    ['ar', 'pl'],
  );

  assert.ok(errors.includes('q001.review.ar.status must be machine_assisted before native review'));
  assert.ok(errors.includes('q001.review.ar.nativeReviewStatus must be pending_native_review'));
  assert.ok(errors.includes('q001.review.pl missing'));
});

test('question localization v8 rejects inconsistent true-false target labels', () => {
  const trueText = completeMap('True');
  const falseText = completeMap('False');
  trueText.pl = 'Tak';
  falseText.pl = 'Nie';

  const errors = checkQuestions(
    [
      {
        id: 'q002',
        type: 'true_false',
        questionSv: 'Påstående.',
        questionEn: 'Statement.',
        questionText: completeMap('question'),
        explanationSv: 'Förklaring.',
        explanationEn: 'Explanation.',
        explanationText: completeMap('explanation'),
        options: [
          { id: 'true', textSv: 'Sant', textEn: 'True', text: trueText },
          { id: 'false', textSv: 'Falskt', textEn: 'False', text: falseText },
        ],
        correctOptionId: 'true',
      },
    ],
    ['q002'],
  );

  assert.ok(errors.includes('q002.options.true.text.pl must be Prawda'));
  assert.ok(errors.includes('q002.options.false.text.pl must be Fałsz'));
});

test('question localization v8 rejects stale source option ids outside the locked source shape', () => {
  const errors = checkLocalizationSourceShape(
    [
      {
        id: 'q001',
        options: [{ id: 'a' }, { id: 'b' }],
        correctOptionId: 'a',
      },
    ],
    {
      q001: {
        questionText: completeMap('question'),
        explanationText: completeMap('explanation'),
        options: {
          a: completeMap('a'),
          b: completeMap('b'),
          c: completeMap('stale extra option'),
        },
      },
    },
    ['q001'],
  );

  assert.ok(errors.includes('q001.localization.options.c stale option id not in source'));
});

test('question localization v8 rejects English geography terms in Somali sea and current names', () => {
  const errors = checkSomaliGeographyNaturalness([
    {
      id: 'q004',
      questionText: { so: 'Badda ku teedsan xeebta bari ee Iswiidhan maxaa la yiraahdaa?' },
      explanationText: {
        so: 'Badda ku teedsan xeebta bari ee Iswiidhan waa Badda Baltic.',
      },
      options: [
        { id: 'a', text: { so: 'Badda Waqooyi' } },
        { id: 'b', text: { so: 'Badda Mediterranean' } },
      ],
    },
    {
      id: 'q006',
      questionText: { so: 'Gulf Stream waxay ka qayb qaadataa cimilada.' },
      explanationText: { so: 'Qulqulka Waqooyiga Atlantic ayaa biyo diirran keena.' },
      options: [],
    },
    {
      id: 'q008',
      questionText: { so: 'Saddexda haro waa kuwee?' },
      explanationText: { so: 'Harooyinka ugu waaweyn waa Vänern, Vättern iyo Mälaren.' },
      options: [{ id: 'b', text: { so: 'Badda Baltic, Kattegat iyo Skagerrak' } }],
    },
  ]);

  assert.deepEqual(errors, [
    'q004.explanationText.so contains English geography term',
    'q004.options.b.text.so contains English geography term',
    'q006.questionText.so contains English geography term',
    'q006.explanationText.so contains English geography term',
    'q008.options.b.text.so contains English geography term',
  ]);
});

test('question localization v8 summarizes Somali geography naturalness cases', () => {
  const questions = [
    {
      id: 'q004',
      questionText: { so: 'Badda ku teedsan xeebta bari ee Iswiidhan maxaa la yiraahdaa?' },
      explanationText: {
        so: 'Badda ku teedsan xeebta bari ee Iswiidhan waa Badda Baltiga.',
      },
      options: [
        { id: 'a', text: { so: 'Badda Waqooyi' } },
        { id: 'b', text: { so: 'Badda Dhexe' } },
        { id: 'c', text: { so: 'Badda Baltiga' } },
        { id: 'd', text: { so: 'Badweynta Atlaantiga' } },
      ],
    },
    {
      id: 'q006',
      questionText: {
        so: 'Qulqulka Gacanka iyo qulqulka Waqooyiga Atlaantiga waxay dejiyaan cimilada.',
      },
      explanationText: {
        so: 'Labada qulqul badeed waxay biyo diirran u qaadaan Yurub.',
      },
      options: [],
    },
    {
      id: 'q008',
      questionText: { so: 'Saddexda haro ee ugu waaweyn Iswiidhan waa kuwee?' },
      explanationText: { so: 'Harooyinka ugu waaweyn waa Vänern, Vättern iyo Mälaren.' },
      options: [{ id: 'b', text: { so: 'Badda Baltiga, Kattegat iyo Skagerrak' } }],
    },
  ];

  const summary = summarizeSomaliGeographyNaturalness(questions, SOMALI_GEOGRAPHY_NATURALNESS_IDS);

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.casesValidated, 3);
  assert.equal(summary.expectedCases, 3);
  assert.equal(summary.parityValidated, true);
});

test('question localization v8 rejects English public service loanwords in target media text', () => {
  const errors = checkPublicServiceLoanwordNaturalness(
    [
      {
        id: 'q048',
        questionText: {
          pl: 'Firmy public service w Szwecji',
          so: 'Shirkadaha public service ee Iswiidhan',
          tr: 'Kamu hizmeti yayıncıları',
          uk: 'Компанії суспільного мовлення',
        },
        explanationText: {
          pl: 'Media publiczne',
          so: 'Warbaahinta adeegga dadweynaha',
          tr: 'Public service şirketleri',
          uk: 'Компанії public service',
        },
        options: [
          {
            id: 'a',
            text: {
              pl: 'Sveriges Radio',
              so: 'Sveriges Radio',
              tr: 'Sveriges Radio',
              uk: 'Sveriges Radio',
            },
          },
        ],
      },
    ],
    ['q048'],
  );

  assert.deepEqual(errors, [
    'q048.questionText.pl contains English public service loanword',
    'q048.questionText.so contains English public service loanword',
    'q048.explanationText.tr contains English public service loanword',
    'q048.explanationText.uk contains English public service loanword',
  ]);
});

test('question localization v8 summarizes public service loanword naturalness cases', () => {
  const cleanMediaMaps = {
    pl: 'Media publiczne powinny być niezależne.',
    so: 'Warbaahinta adeegga dadweynaha waa inay madax-bannaanaataa.',
    tr: 'Kamu hizmeti yayıncılığı bağımsız olmalıdır.',
    uk: 'Суспільне мовлення має бути незалежним.',
  };
  const questions = PUBLIC_SERVICE_LOANWORD_IDS.map((id) => ({
    id,
    questionText: cleanMediaMaps,
    explanationText: cleanMediaMaps,
    options: [{ id: 'a', text: cleanMediaMaps }],
  }));

  const summary = summarizePublicServiceLoanwordNaturalness(
    questions,
    PUBLIC_SERVICE_LOANWORD_IDS,
  );

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.casesValidated, 8);
  assert.equal(summary.expectedCases, 8);
  assert.equal(summary.parityValidated, true);
});

test('question localization v8 rejects missing protected Swedish civic terms in target text', () => {
  const errors = checkQuestions(
    [
      {
        id: 'q001',
        questionSv: 'Vad gör Riksdagen?',
        questionEn: 'What does the Riksdag do?',
        questionText: completeMap('What does parliament do?'),
        explanationSv: 'Riksdagen beslutar om lagar.',
        explanationEn: 'The Riksdag decides on laws.',
        explanationText: completeMap('Parliament decides on laws.'),
        options: [{ id: 'a', textSv: 'Lagar', textEn: 'Laws', text: completeMap('laws') }],
        correctOptionId: 'a',
      },
    ],
    ['q001'],
  );

  assert.ok(errors.includes('q001.protectedTerm.Riksdag missing from localized text'));
});

test('question localization v8 rejects missing numeric facts while accepting localized digits', () => {
  const questionText = completeMap('How many members?');
  const explanationText = completeMap('There are ۳۴۹ members, not 21.');
  const optionA = completeMap('۳۴۹');
  const optionB = completeMap('۲۱');

  const errors = checkQuestions(
    [
      {
        id: 'q001',
        questionSv: 'Hur många ledamöter har Riksdagen?',
        questionEn: 'How many members does the Riksdag have?',
        questionText,
        explanationSv: 'Riksdagen har 349 ledamöter, inte 21.',
        explanationEn: 'The Riksdag has 349 members, not 21.',
        explanationText,
        options: [
          { id: 'a', textSv: '349', textEn: '349', text: optionA },
          { id: 'b', textSv: '21', textEn: '21', text: optionB },
        ],
        correctOptionId: 'a',
      },
    ],
    ['q001'],
  );

  assert.ok(errors.includes('q001.protectedTerm.Riksdag missing from localized text'));
  assert.ok(!errors.includes('q001.numericFact.349 missing from localized text'));
  assert.ok(!errors.includes('q001.numericFact.21 missing from localized text'));

  explanationText.pl = 'There are members, not the smaller number.';
  const missingErrors = checkQuestions(
    [
      {
        id: 'q001',
        questionSv: 'Hur många ledamöter har Riksdagen?',
        questionEn: 'How many members does the Riksdag have?',
        questionText,
        explanationSv: 'Riksdagen har 349 ledamöter, inte 21.',
        explanationEn: 'The Riksdag has 349 members, not 21.',
        explanationText,
        options: [
          { id: 'a', textSv: '349', textEn: '349', text: optionA },
          { id: 'b', textSv: '21', textEn: '21', text: optionB },
        ],
        correctOptionId: 'a',
      },
    ],
    ['q001'],
  );

  assert.ok(missingErrors.includes('q001.numericFact.349 missing from localized text'));
});
