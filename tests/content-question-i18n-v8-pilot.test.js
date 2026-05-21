const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

const {
  Q062_PUBLIC_SECTOR_NATURALNESS_IDS,
  checkQuestions,
  checkLocalizationSourceShape,
  checkQ062PublicSectorNaturalness,
  checkSomaliGeographyNaturalness,
  checkReviewMetadata,
  PUBLIC_SERVICE_LOANWORD_IDS,
  REQUIRED_LOCALES,
  SOMALI_GEOGRAPHY_NATURALNESS_IDS,
  summarizeQ062PublicSectorNaturalness,
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

function q062PublicSectorFixture({ stale = false } = {}) {
  if (stale) {
    const staleQuestion = completeMap('What is meant by the public sector in Sweden?');
    const staleOption = completeMap(
      'Activities for which the state, regions, and municipalities are responsible',
    );
    const staleExplanation = completeMap(
      'The public sector means activities for which the state, regions, and municipalities are responsible and that are financed by taxes.',
    );

    return {
      id: 'q062',
      questionSv: 'Vad menas med offentlig sektor i Sverige?',
      questionEn: staleQuestion.en,
      questionText: staleQuestion,
      explanationSv: 'Offentlig sektor är verksamheter som staten ansvarar för.',
      explanationEn: staleExplanation.en,
      explanationText: staleExplanation,
      options: [
        {
          id: 'a',
          textSv: 'Verksamheter som staten ansvarar för',
          textEn: staleOption.en,
          text: staleOption,
        },
      ],
      correctOptionId: 'a',
    };
  }

  return {
    id: 'q062',
    questionSv: 'Vad menas med offentlig sektor i Sverige?',
    questionEn: 'What is the public sector in Sweden?',
    questionText: {
      sv: 'Vad menas med offentlig sektor i Sverige?',
      en: 'What is the public sector in Sweden?',
      'zh-Hant': '服務和活動',
      'zh-Hans': '服务和活动',
      ar: 'الخدمات والأنشطة',
      ckb: 'خزمەتگوزاری و چالاکی',
      fa: 'خدمات و فعالیت',
      pl: 'usługi i działania',
      so: 'adeegyo iyo hawlo',
      ti: 'ኣገልግሎታትን ንጥፈታትን',
      tr: 'hizmet ve faaliyet',
      uk: 'послуги й види діяльності',
    },
    explanationSv: 'Offentlig sektor är verksamheter som finansieras med skatter.',
    explanationEn:
      'The public sector consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes.',
    explanationText: {
      sv: 'Offentlig sektor är verksamheter som finansieras med skatter.',
      en: 'The public sector consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes.',
      'zh-Hant': '服務、活動、稅收',
      'zh-Hans': '服务、活动、税收',
      ar: 'الخدمات والأنشطة والضرائب',
      ckb: 'خزمەتگوزاری و چالاکی و باج',
      fa: 'خدمات و فعالیت و مالیات',
      pl: 'usługi, działania i podatków',
      so: 'adeegyo, hawlo iyo canshuur',
      ti: 'ኣገልግሎታት፣ ንጥፈታትን ግብሪን',
      tr: 'hizmet, faaliyet ve vergiler',
      uk: 'послуги, діяльності та податків',
    },
    options: [
      {
        id: 'a',
        textSv: 'Tjänster och verksamheter som finansieras med skatter',
        textEn:
          'Services and activities that the state, regions, and municipalities are responsible for and fund through taxes',
        text: {
          sv: 'Tjänster och verksamheter som finansieras med skatter',
          en: 'Services and activities that the state, regions, and municipalities are responsible for and fund through taxes',
          'zh-Hant': '服務、活動、稅收',
          'zh-Hans': '服务、活动、税收',
          ar: 'الخدمات والأنشطة والضرائب',
          ckb: 'خزمەتگوزاری و چالاکی و باج',
          fa: 'خدمات و فعالیت و مالیات',
          pl: 'usługi, działania i podatków',
          so: 'adeegyo, hawlo iyo canshuur',
          ti: 'ኣገልግሎታት፣ ንጥፈታትን ግብሪን',
          tr: 'hizmet, faaliyet ve vergiler',
          uk: 'послуги, діяльності та податків',
        },
      },
    ],
    correctOptionId: 'a',
  };
}

test('question localization v8 rejects literal public-sector calques for q062', () => {
  const errors = checkQ062PublicSectorNaturalness([q062PublicSectorFixture({ stale: true })]);

  assert.ok(errors.includes('q062.questionText.en uses stale public-sector wording'));
  assert.ok(errors.includes('q062.correctOption.text.en uses stale public-sector wording'));
  assert.ok(errors.includes('q062.explanationText.en uses stale public-sector wording'));
  assert.ok(
    errors.some((error) =>
      error.startsWith('q062.correctOption.text.en missing public-sector concept term(s):'),
    ),
  );
});

test('question localization v8 summarizes q062 public-sector naturalness cases', () => {
  const summary = summarizeQ062PublicSectorNaturalness(
    [q062PublicSectorFixture()],
    Q062_PUBLIC_SECTOR_NATURALNESS_IDS,
  );

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.casesValidated, 1);
  assert.equal(summary.expectedCases, 1);
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
