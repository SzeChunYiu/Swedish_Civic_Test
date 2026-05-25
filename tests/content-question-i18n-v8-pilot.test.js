const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function loadTs(relativePath) {
  return require(path.join(repoRoot, relativePath));
}

const {
  Q050_SOURCE_CRITICISM_NATURALNESS_IDS,
  Q062_PUBLIC_SECTOR_NATURALNESS_IDS,
  Q093_RELIGIOUS_FREEDOM_1951_NATURALNESS_IDS,
  Q115_RELIGIOUS_FREEDOM_1860_NATURALNESS_IDS,
  Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS,
  checkQuestions,
  checkLocalizationSourceShape,
  checkQ050SourceCriticismNaturalness,
  checkQ062PublicSectorNaturalness,
  checkQ093ReligiousFreedom1951Naturalness,
  checkQ115ReligiousFreedom1860Naturalness,
  checkQ166Q169KommunRegionNaturalness,
  checkSomaliGeographyNaturalness,
  checkSomaliHolidayFoodNaturalness,
  checkReviewMetadata,
  PUBLIC_SERVICE_LOANWORD_IDS,
  REQUIRED_LOCALES,
  SOMALI_GEOGRAPHY_NATURALNESS_IDS,
  SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS,
  summarizeQ050SourceCriticismNaturalness,
  summarizeQ062PublicSectorNaturalness,
  summarizeQ093ReligiousFreedom1951Naturalness,
  summarizeQ115ReligiousFreedom1860Naturalness,
  summarizeQ166Q169KommunRegionNaturalness,
  summarizeSomaliGeographyNaturalness,
  summarizeSomaliHolidayFoodNaturalness,
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

test('question localization v8 explanation availability stays closed until native review', () => {
  const { getReviewedExplanationLocales, getReviewedNativeExplanationLocales } = loadTs(
    'lib/content/explanationLanguageAvailability.ts',
  );
  const { QUESTION_LOCALIZATION_REVIEW_STATUS } = loadTs('data/questionLocalizations.ts');
  const { questions } = loadTs('data/questions.ts');
  const question = questions.find((candidate) => candidate.id === 'q001');

  assert.ok(question, 'q001 exists in the published bank');
  assert.deepEqual(getReviewedExplanationLocales(question), ['sv', 'en']);
  assert.deepEqual(getReviewedNativeExplanationLocales(question), []);

  const reviewedStatus = {
    ...QUESTION_LOCALIZATION_REVIEW_STATUS,
    q001: {
      ...QUESTION_LOCALIZATION_REVIEW_STATUS.q001,
      ar: {
        status: 'native_reviewed',
        nativeReviewStatus: 'reviewed',
        source: 'question_localization_v8',
        reviewer: 'native-review-fixture',
        reviewedAt: '2026-05-23',
      },
    },
  };

  assert.deepEqual(getReviewedNativeExplanationLocales(question, reviewedStatus), ['ar']);

  const fallbackQuestion = {
    ...question,
    explanationText: {
      ...question.explanationText,
      ar: question.explanationText.en,
    },
  };
  assert.deepEqual(getReviewedNativeExplanationLocales(fallbackQuestion, reviewedStatus), []);
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

test('question localization v8 rejects English holiday-food tokens in Somali text', () => {
  const errors = checkSomaliHolidayFoodNaturalness(
    [
      {
        id: 'q099',
        questionText: { so: 'Goorma ayaa Habeenka Midsommar la xusaa?' },
        explanationText: {
          so: 'Cuntada Midsommar waxaa ka mid ah herring, baradho cusub iyo strawberries.',
        },
        options: [],
      },
      {
        id: 'q101',
        questionText: { so: 'Ciiddee ayaa la xiriirta Easter?' },
        explanationText: { so: 'Easter waxaa lagu dabaaldegaa Maarso ama Abriil.' },
        options: [{ id: 'a', text: { so: 'Easter' } }],
      },
    ],
    ['q099', 'q101'],
  );

  assert.deepEqual(errors, [
    'q099.explanationText.so contains English holiday-food token',
    'q101.questionText.so contains English holiday-food token',
    'q101.explanationText.so contains English holiday-food token',
    'q101.options.a.text.so contains English holiday-food token',
  ]);
});

test('question localization v8 summarizes Somali holiday-food naturalness cases', () => {
  const questions = SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS.map((id) => ({
    id,
    questionText: { so: 'Su’aal ku saabsan ciidaha Iswiidhan.' },
    explanationText: {
      so: 'Qoraalku wuxuu isticmaalaa Iistar, sill iyo istarooberi halkii uu ka isticmaali lahaa erayo Ingiriisi ah.',
    },
    options: [{ id: 'a', text: { so: 'Iistar iyo sill' } }],
  }));

  const summary = summarizeSomaliHolidayFoodNaturalness(
    questions,
    SOMALI_HOLIDAY_FOOD_NATURALNESS_IDS,
  );

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.casesValidated, 6);
  assert.equal(summary.expectedCases, 6);
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

function q093ReligiousFreedomFixture({ stale = false } = {}) {
  return {
    id: 'q093',
    questionSv: 'Vilken lag markerade religionsfrihetens slutliga genombrott 1951?',
    questionEn: 'Which law marked the final breakthrough for religious freedom in 1951?',
    explanationSv: 'Religionsfrihetslagen från 1951 markerade religionsfrihetens genombrott.',
    explanationEn:
      'The Religious Freedom Act of 1951 marked the breakthrough for religious freedom.',
    explanationText: stale
      ? {
          'zh-Hant': '該法律使人們可以完全自由地選擇宗教，或完全不屬於任何宗教。',
          'zh-Hans': '该法律使人们可以完全自由地选择宗教，或完全不属于任何宗教。',
          ar: 'جعل القانون من الممكن اختيار أي دين بحرية كاملة أو عدم الانتماء إلى أي دين إطلاقًا.',
          ckb: 'ئەم یاسایە وای کرد بە تەواوی ئازادانە هەر ئایینێک هەڵبژێردرێت.',
          fa: 'این قانون امکان داد که افراد کاملاً آزادانه هر دینی را انتخاب کنند.',
          pl: 'Ustawa umożliwiła całkowicie swobodny wybór religii.',
          so: 'Sharcigu wuxuu suurto geliyay in si buuxda xor loogu doorto diin.',
          ti: 'እቲ ሕጊ ሃይማኖት ብሙሉእ ናጽነት ክትመርጽ ኣኽኢሉ።',
          tr: 'Yasa, herhangi bir dini tamamen özgürce seçmeyi mümkün kıldı.',
          uk: 'Закон дав змогу повністю вільно обирати будь-яку релігію.',
        }
      : {
          'zh-Hant': '該法律讓人們可以選擇任何宗教，也可以不屬於任何宗教。',
          'zh-Hans': '该法律让人们可以选择任何宗教，也可以不属于任何宗教。',
          ar: 'جعل القانون من الممكن اختيار أي دين أو عدم الانتماء إلى أي دين.',
          ckb: 'ئەم یاسایە وای کرد هەر ئایینێک هەڵبژێردرێت یان کەس سەر بە هیچ ئایینێک نەبێت.',
          fa: 'این قانون امکان داد افراد هر دینی را انتخاب کنند یا به هیچ دینی تعلق نداشته باشند.',
          pl: 'Ustawa pozwoliła wybierać dowolną religię albo nie należeć do żadnej.',
          so: 'Sharcigu wuxuu suurtageliyay in qofku doorto diin kasta ama uusan diin ka tirsanaan.',
          ti: 'እቲ ሕጊ ሰባት ዝኾነ ሃይማኖት ክመርጹ ወይ ናብ ምንም ሃይማኖት ከይጽንበሩ ኣኽኢሉ።',
          tr: 'Yasa, herhangi bir dini seçmeyi ya da hiçbir dine mensup olmamayı mümkün kıldı.',
          uk: 'Закон дав змогу обирати будь-яку релігію або не належати до жодної релігії.',
        },
    options: [{ id: 'a', textSv: 'Religionsfrihetslagen', textEn: 'The Religious Freedom Act' }],
    correctOptionId: 'a',
  };
}

test('question localization v8 rejects over-intensified q093 religious-freedom wording', () => {
  const errors = checkQ093ReligiousFreedom1951Naturalness([
    q093ReligiousFreedomFixture({ stale: true }),
  ]);

  assert.ok(
    errors.includes(
      'q093.explanationText.zh-Hant uses over-intensified 1951 religious-freedom wording',
    ),
  );
  assert.ok(
    errors.includes('q093.explanationText.ar uses over-intensified 1951 religious-freedom wording'),
  );
  assert.ok(
    errors.includes('q093.explanationText.tr uses over-intensified 1951 religious-freedom wording'),
  );
});

test('question localization v8 summarizes q093 religious-freedom naturalness cases', () => {
  const summary = summarizeQ093ReligiousFreedom1951Naturalness(
    [q093ReligiousFreedomFixture()],
    Q093_RELIGIOUS_FREEDOM_1951_NATURALNESS_IDS,
  );

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.casesValidated, 1);
  assert.equal(summary.expectedCases, 1);
  assert.equal(summary.parityValidated, true);
});

function q115ReligiousFreedomFixture({ stale = false } = {}) {
  return {
    id: 'q115',
    questionSv: 'Vad blev tillåtet för svenskar år 1860?',
    questionEn: 'What became permitted for Swedes in 1860?',
    explanationSv:
      'År 1860 blev det tillåtet att lämna Svenska kyrkan om man gick med i ett annat kristet samfund.',
    explanationEn:
      'In 1860, it became permitted to leave the Church of Sweden if you joined another Christian community.',
    explanationText: stale
      ? {
          'zh-Hant': '完全自由選擇宗教或不選宗教要到 1951 年才實現。',
          'zh-Hans': '完全自由选择宗教或不选宗教要到 1951 年才实现。',
          ar: 'أما الحرية الكاملة في اختيار دين فجاءت عام 1951.',
          ckb: 'ئازادی تەواو بۆ هەڵبژاردنی ئایین لە 1951دا هات.',
          fa: 'آزادی کامل برای انتخاب دین در سال ۱۹۵۱ آمد.',
          pl: 'Pełna wolność wyboru religii przyszła w 1951 roku.',
          so: 'Xorriyadda buuxda ee doorashada diin waxay timid 1951.',
          ti: 'ሙሉእ ናጽነት ሃይማኖት ምምራጽ ብ1951 መጺኡ።',
          tr: 'Tamamen özgürce din seçme hakkı 1951’de geldi.',
          uk: 'Повна свобода обирати релігію з’явилася у 1951 році.',
        }
      : {
          'zh-Hant': '選擇宗教或不屬於任何宗教的權利要到 1951 年後才有。',
          'zh-Hans': '选择宗教或不属于任何宗教的权利要到 1951 年后才有。',
          ar: 'أما حق اختيار دين أو عدم الانتماء إلى أي دين فجاء عام 1951.',
          ckb: 'مافی هەڵبژاردنی ئایین یان سەر بە هیچ ئایینێک نەبوون لە 1951دا هات.',
          fa: 'حق انتخاب دین یا نداشتن دین در سال ۱۹۵۱ آمد.',
          pl: 'Prawo wyboru religii albo braku przynależności do religii przyszło w 1951 roku.',
          so: 'Xuquuqda doorashada diin ama inaan diin lagu tirsan waxay timid 1951.',
          ti: 'መሰል ሃይማኖት ምምራጽ ወይ ናብ ምንም ሃይማኖት ዘይምጽንባር ብ1951 መጺኡ።',
          tr: 'Bir dini seçme ya da hiçbir dine mensup olmama hakkı 1951’de geldi.',
          uk: 'Право обирати релігію або не належати до жодної релігії з’явилося у 1951 році.',
        },
    options: [
      {
        id: 'a',
        textSv: 'Att lämna Svenska kyrkan om man gick med i ett annat kristet samfund',
        textEn: 'To leave the Church of Sweden if you joined another Christian community',
      },
      {
        id: 'b',
        textSv: 'Att välja vilken religion som helst eller ingen religion',
        textEn: 'To choose any religion or no religion',
        text: stale
          ? {
              'zh-Hant': '完全自由選擇任何宗教或完全不選宗教',
              'zh-Hans': '完全自由选择任何宗教或完全不选宗教',
              ar: 'اختيار أي دين أو عدم اختيار أي دين بحرية كاملة',
              ckb: 'بە تەواوی ئازادانە هەڵبژاردنی هەر ئایینێک',
              fa: 'کاملاً آزادانه هر دینی را انتخاب کردن',
              pl: 'Całkowicie swobodny wybór dowolnej religii',
              so: 'In si buuxda xor loogu doorto diin kasta',
              ti: 'ሙሉእ ብሙሉእ ብናጽነት ዝኾነ ሃይማኖት ምምራጽ',
              tr: 'Herhangi bir dini tamamen özgürce seçmek',
              uk: 'Повністю вільно обирати будь-яку релігію',
            }
          : {
              'zh-Hant': '選擇任何宗教或不屬於任何宗教',
              'zh-Hans': '选择任何宗教或不属于任何宗教',
              ar: 'اختيار أي دين أو عدم الانتماء إلى أي دين',
              ckb: 'هەڵبژاردنی هەر ئایینێک یان سەر بە هیچ ئایینێک نەبوون',
              fa: 'انتخاب هر دینی یا وابسته نبودن به هیچ دینی',
              pl: 'Wybór dowolnej religii albo brak przynależności do religii',
              so: 'In la doorto diin kasta ama aan diin lagu tirsan',
              ti: 'ዝኾነ ሃይማኖት ምምራጽ ወይ ናብ ምንም ሃይማኖት ዘይምጽንባር',
              tr: 'Herhangi bir dini seçmek ya da hiçbir dine mensup olmamak',
              uk: 'Обирати будь-яку релігію або не належати до жодної релігії',
            },
      },
    ],
    correctOptionId: 'a',
  };
}

test('question localization v8 rejects over-intensified q115 religious-freedom wording', () => {
  const errors = checkQ115ReligiousFreedom1860Naturalness([
    q115ReligiousFreedomFixture({ stale: true }),
  ]);

  assert.ok(
    errors.includes(
      'q115.options.b.text.zh-Hant uses over-intensified 1860 religious-freedom wording',
    ),
  );
  assert.ok(
    errors.includes('q115.explanationText.ar uses over-intensified 1860 religious-freedom wording'),
  );
  assert.ok(
    errors.includes('q115.options.b.text.tr uses over-intensified 1860 religious-freedom wording'),
  );
});

test('question localization v8 summarizes q115 religious-freedom naturalness cases', () => {
  const summary = summarizeQ115ReligiousFreedom1860Naturalness(
    [q115ReligiousFreedomFixture()],
    Q115_RELIGIOUS_FREEDOM_1860_NATURALNESS_IDS,
  );

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.casesValidated, 1);
  assert.equal(summary.expectedCases, 1);
  assert.equal(summary.parityValidated, true);
});

function q166KommunRegionFixture({ stale = false } = {}) {
  const staleQuestion = {
    pl: 'Która odpowiedź opisuje prawo do głosowania w wyborach do kommun i regionów?',
    so: 'Jawaabtee qeexaysa doorashooyinka kommun iyo region?',
    tr: 'Hangi cevap kommun ve region seçimlerini tanımlar?',
  };
  const freshQuestion = {
    pl: 'Która odpowiedź opisuje prawo do głosowania w wyborach gminnych i regionalnych?',
    so: 'Jawaabtee qeexaysa doorashooyinka degmooyinka iyo gobollada?',
    tr: 'Hangi cevap belediye (kommun) ve bölge (region) seçimlerini tanımlar?',
  };

  return {
    id: 'q166',
    questionText: {
      ...completeMap('Municipal and regional election text'),
      ...(stale ? staleQuestion : freshQuestion),
    },
    explanationText: {
      ...completeMap('Municipal and regional election explanation'),
      ...(stale
        ? { so: 'Doorashooyinka kommun iyo region mar walba uma baahna jinsiyad.' }
        : {
            so: 'Doorashooyinka degmooyinka iyo gobollada mar walba uma baahna jinsiyad.',
          }),
    },
    options: [
      {
        id: 'a',
        text: {
          ...completeMap('Correct municipal election answer'),
          ...(stale
            ? { uk: 'Ніхто не може голосувати на виборах до kommun чи region' }
            : {
                uk: 'Ніхто не може голосувати на муніципальних (kommun) чи регіональних (region) виборах',
              }),
        },
      },
    ],
    correctOptionId: 'a',
  };
}

test('question localization v8 rejects bare kommun and region overlays for q166/q169', () => {
  const errors = checkQ166Q169KommunRegionNaturalness([q166KommunRegionFixture({ stale: true })]);

  assert.ok(errors.includes('q166.questionText.pl uses bare Swedish civic term(s): kommun'));
  assert.ok(
    errors.includes('q166.questionText.so uses bare Swedish civic term(s): kommun, region'),
  );
  assert.ok(
    errors.includes('q166.explanationText.so uses bare Swedish civic term(s): kommun, region'),
  );
  assert.ok(
    errors.includes('q166.options.a.text.uk uses bare Swedish civic term(s): kommun, region'),
  );
});

test('question localization v8 summarizes q166/q169 kommun-region naturalness cases', () => {
  const questions = Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS.map((id) => ({
    ...q166KommunRegionFixture(),
    id,
  }));
  const summary = summarizeQ166Q169KommunRegionNaturalness(questions);

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.casesValidated, 2);
  assert.equal(summary.expectedCases, 2);
  assert.equal(summary.parityValidated, true);
});

function q050SourceCriticismFixture({ stale = false } = {}) {
  if (stale) {
    const staleQuestion = {
      sv: 'Vad betyder källkritik?',
      en: 'What does source criticism mean?',
      'zh-Hant': '具有來源批判意識是什麼意思？',
      'zh-Hans': '具有来源批判意识是什么意思？',
      ar: 'ماذا يعني أن تكون ناقدًا للمصادر؟',
      ckb: 'ئەوەی سەرچاوە-ڕەخنەیی بیت چی مانایەک دەدات؟',
      fa: 'منبع‌سنج بودن یعنی چه؟',
      pl: 'Co oznacza krytyczne podejście do źródeł?',
      so: 'Maxay ka dhigan tahay in si naqdineed loo eego ilaha macluumaadka?',
      ti: 'ንምንጭታት ብነቐፌታዊ መንገዲ ምርኣይ እንታይ ማለት እዩ?',
      tr: 'Kaynaklara eleştirel yaklaşmak ne anlama gelir?',
      uk: 'Що означає критично ставитися до джерел?',
    };
    const staleExplanation = {
      sv: 'Källkritik innebär att man kontrollerar information.',
      en: 'Source criticism means checking information.',
      'zh-Hant': '具有來源批判意識表示檢查資訊。',
      'zh-Hans': '具有来源批判意识表示检查信息。',
      ar: 'أن تكون ناقدًا للمصادر يعني أن تتحقق من المعلومات.',
      ckb: 'سەرچاوە-ڕەخنەیی بوون واتە پشکنینی زانیاری.',
      fa: 'منبع‌سنج بودن یعنی بررسی اطلاعات.',
      pl: 'Krytyczne podejście do źródeł oznacza sprawdzanie informacji.',
      so: 'In si naqdineed loo eego ilaha macluumaadka waxay ka dhigan tahay hubinta macluumaadka.',
      ti: 'ንምንጭታት ብነቐፌታዊ መንገዲ ምርኣይ ማለት ሓበሬታ ምፍታሽ እዩ።',
      tr: 'Kaynaklara eleştirel yaklaşmak, bilgiyi kontrol etmek demektir.',
      uk: 'Критично ставитися до джерел означає перевіряти інформацію.',
    };

    return {
      id: 'q050',
      questionSv: staleQuestion.sv,
      questionEn: staleQuestion.en,
      questionText: staleQuestion,
      explanationSv: staleExplanation.sv,
      explanationEn: staleExplanation.en,
      explanationText: staleExplanation,
      options: [{ id: 'a', textSv: 'Kontrollera information', textEn: 'Check information' }],
      correctOptionId: 'a',
    };
  }

  return {
    id: 'q050',
    questionSv: 'Vad betyder källkritik?',
    questionEn: 'What does source criticism mean?',
    questionText: {
      sv: 'Vad betyder källkritik?',
      en: 'What does source criticism mean?',
      'zh-Hant': '來源批判是什麼意思？',
      'zh-Hans': '来源批判是什么意思？',
      ar: 'ماذا يعني نقد المصادر؟',
      ckb: 'ڕەخنەی سەرچاوە چییە؟',
      fa: 'نقد منبع یعنی چه؟',
      pl: 'Co oznacza krytyka źródeł?',
      so: 'Qiimeynta ilaha macluumaadka maxay ka dhigan tahay?',
      ti: 'ናይ ምንጪ ነቐፌታ እንታይ ማለት እዩ?',
      tr: 'Kaynak eleştirisi ne anlama gelir?',
      uk: 'Що означає критика джерел?',
    },
    explanationSv: 'Källkritik innebär att man kontrollerar information.',
    explanationEn: 'Source criticism means checking information.',
    explanationText: {
      sv: 'Källkritik innebär att man kontrollerar information.',
      en: 'Source criticism means checking information.',
      'zh-Hant': '來源批判是指檢查資訊。',
      'zh-Hans': '来源批判是指检查信息。',
      ar: 'نقد المصادر يعني التحقق من المعلومات.',
      ckb: 'ڕەخنەی سەرچاوە واتە پشکنینی زانیاری.',
      fa: 'نقد منبع یعنی بررسی اطلاعات.',
      pl: 'Krytyka źródeł oznacza sprawdzanie informacji.',
      so: 'Qiimeynta ilaha macluumaadka waxay ka dhigan tahay hubinta macluumaadka.',
      ti: 'ናይ ምንጪ ነቐፌታ ማለት ሓበሬታ ምፍታሽ እዩ።',
      tr: 'Kaynak eleştirisi, bilgiyi kontrol etmek demektir.',
      uk: 'Критика джерел означає перевіряти інформацію.',
    },
    options: [{ id: 'a', textSv: 'Kontrollera information', textEn: 'Check information' }],
    correctOptionId: 'a',
  };
}

test('question localization v8 rejects adjective-form source-criticism wording for q050', () => {
  const errors = checkQ050SourceCriticismNaturalness([q050SourceCriticismFixture({ stale: true })]);

  assert.ok(errors.includes('q050.questionText.zh-Hant uses stale source-criticism wording'));
  assert.ok(errors.includes('q050.explanationText.ar uses stale source-criticism wording'));
  assert.ok(
    errors.some((error) =>
      error.startsWith('q050.questionText.pl missing source-criticism noun term(s):'),
    ),
  );
});

test('question localization v8 summarizes q050 source-criticism naturalness cases', () => {
  const summary = summarizeQ050SourceCriticismNaturalness(
    [q050SourceCriticismFixture()],
    Q050_SOURCE_CRITICISM_NATURALNESS_IDS,
  );

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.casesValidated, 1);
  assert.equal(summary.expectedCases, 1);
  assert.equal(summary.parityValidated, true);
});

function q166Q169KommunRegionFixture(id = 'q166', { stale = false } = {}) {
  const staleQuestion = {
    'zh-Hant': 'kommun 和 region 選舉',
    'zh-Hans': 'kommun 和 region 选举',
    pl: 'wybory do kommun i regionów',
    so: 'doorashooyinka kommun iyo region',
    ti: 'ምርጫታት kommun ከምኡውን region',
    tr: 'kommun ve region seçimleri',
    uk: 'вибори до kommun і region',
  };
  const naturalQuestion = {
    'zh-Hant': '市鎮和大區選舉',
    'zh-Hans': '市镇和大区选举',
    pl: 'wybory gminne i regionalne',
    so: 'doorashooyinka degmooyinka iyo gobollada',
    ti: 'ምርጫታት ምምሕዳር ከባቢን ክልልን',
    tr: 'belediye ve bölge seçimleri',
    uk: 'муніципальні і регіональні вибори',
  };
  const localized = stale ? staleQuestion : naturalQuestion;

  return {
    id,
    questionSv: 'Fråga?',
    questionEn: 'Question?',
    questionText: localized,
    explanationSv: 'Förklaring.',
    explanationEn: 'Explanation.',
    explanationText: localized,
    options: [{ id: 'a', textSv: 'Svar', textEn: 'Answer', text: localized }],
    correctOptionId: 'a',
  };
}

test('question localization v8 rejects bare kommun and region terms for q166/q169', () => {
  const errors = checkQ166Q169KommunRegionNaturalness([
    q166Q169KommunRegionFixture('q166', { stale: true }),
    q166Q169KommunRegionFixture('q169', { stale: true }),
  ]);

  assert.ok(
    errors.includes('q166.questionText.zh-Hant uses bare Swedish civic term(s): kommun, region'),
  );
  assert.ok(
    errors.includes('q166.explanationText.so uses bare Swedish civic term(s): kommun, region'),
  );
  assert.ok(
    errors.includes('q166.options.a.text.tr uses bare Swedish civic term(s): kommun, region'),
  );
  assert.ok(
    errors.includes('q169.questionText.uk uses bare Swedish civic term(s): kommun, region'),
  );
});

test('question localization v8 summarizes q166/q169 kommun-region naturalness cases', () => {
  const summary = summarizeQ166Q169KommunRegionNaturalness(
    [q166Q169KommunRegionFixture('q166'), q166Q169KommunRegionFixture('q169')],
    Q166_Q169_KOMMUN_REGION_NATURALNESS_IDS,
  );

  assert.deepEqual(summary.errors, []);
  assert.equal(summary.casesValidated, 2);
  assert.equal(summary.expectedCases, 2);
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
