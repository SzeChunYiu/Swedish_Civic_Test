const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { buildSiteQuestionBank } = require('../scripts/export-site-question-bank');

const repoRoot = path.resolve(__dirname, '..');

const auditedBatch = [
  {
    id: 'q021',
    chapterId: 3,
    questionSv: 'Vilka tre nivåer delar det politiska ansvaret i Sverige?',
    questionEn: 'Which three levels share political responsibility in Sweden?',
    source: { chapter: 'Så här styrs Sverige', section: 'Landet styrs på olika nivåer', page: 12 },
    correctSv: 'Stat, regioner och kommuner',
    correctEn: 'The state, regions, and municipalities',
    termsSv: ['nationell', 'regional', 'kommunal nivå'],
    termsEn: ['national', 'regional', 'municipal'],
  },
  {
    id: 'q022',
    chapterId: 3,
    questionSv: 'Vilken av följande uppgifter har riksdagen?',
    questionEn: 'Which of the following tasks belongs to the Riksdag?',
    source: { chapter: 'Så här styrs Sverige', section: 'Staten', page: 12 },
    correctSv: 'Att besluta om lagar och hur statens pengar ska användas',
    correctEn: "To decide laws and how the state's money should be used",
    termsSv: ['lagar', 'statens budget', 'statens pengar'],
    termsEn: ['laws', 'state budget', "state's money"],
  },
  {
    id: 'q023',
    chapterId: 3,
    questionSv: 'Riksdagen väljer statsminister.',
    questionEn: 'The Riksdag chooses the prime minister.',
    source: { chapter: 'Så här styrs Sverige', section: 'Staten', page: 12 },
    correctSv: 'Sant',
    correctEn: 'True',
    termsSv: ['Riksdagen väljer statsminister', 'bilda regering', 'ministrarna'],
    termsEn: ['Riksdag chooses the prime minister', 'forming a government', 'ministers'],
  },
  {
    id: 'q024',
    chapterId: 3,
    questionSv: 'Vilket påstående beskriver statliga myndigheter?',
    questionEn: 'Which statement describes government agencies?',
    source: { chapter: 'Så här styrs Sverige', section: 'Myndigheter', page: 13 },
    correctSv: 'De genomför beslut och måste följa lagar och regeringens instruktioner',
    correctEn: 'They implement decisions and must follow laws and government instructions',
    termsSv: ['statliga myndigheter', 'följa lagen', 'regeringens instruktioner'],
    termsEn: ['government agencies', 'follow the law', "government's instructions"],
  },
  {
    id: 'q025',
    chapterId: 3,
    questionSv: 'Vilken är regionernas främsta uppgift i Sverige?',
    questionEn: "What is the main responsibility of Sweden's regions?",
    source: { chapter: 'Så här styrs Sverige', section: 'Regioner och kommuner', page: 13 },
    correctSv: 'Att ansvara för hälso- och sjukvården',
    correctEn: 'To be responsible for health care',
    termsSv: ['21 regioner', 'hälso- och sjukvården', 'kollektivtrafik'],
    termsEn: ['21 regions', 'health care', 'public transport'],
  },
  {
    id: 'q026',
    chapterId: 3,
    questionSv: 'Vilka vardagstjänster ansvarar kommuner för?',
    questionEn: 'Which everyday services are municipalities responsible for?',
    source: { chapter: 'Så här styrs Sverige', section: 'Kommunernas ansvar', page: 13 },
    correctSv: 'Vatten och avlopp, omsorg, snöröjning, parkskötsel och vuxenutbildning',
    correctEn:
      'Water and sewage, care services, snow removal, park maintenance, and adult education',
    termsSv: ['vatten och avlopp', 'omsorg', 'vuxenutbildning'],
    termsEn: ['water and sewage', 'care for older people and children', 'adult education'],
  },
  {
    id: 'q027',
    chapterId: 3,
    questionSv: 'Vad betyder det att Sverige är en konstitutionell monarki?',
    questionEn: 'What does it mean that Sweden is a constitutional monarchy?',
    source: { chapter: 'Så här styrs Sverige', section: 'Sveriges statsskick', page: 13 },
    correctSv: 'Att statschefen är kung eller drottning men saknar politisk makt',
    correctEn: 'That the head of state is a king or queen but lacks political power',
    termsSv: ['konstitutionell monarki', 'utan politisk makt', 'symbol för Sverige'],
    termsEn: ['constitutional monarchy', 'without political power', 'symbol of Sweden'],
  },
  {
    id: 'q028',
    chapterId: 3,
    questionSv: 'Oppositionen ska granska regeringens arbete och föreslå annan politik.',
    questionEn:
      'The opposition should scrutinize the government’s work and propose alternative policies.',
    source: { chapter: 'Så här styrs Sverige', section: 'Staten', page: 12 },
    correctSv: 'Sant',
    correctEn: 'True',
    termsSv: ['opposition', 'granskar regeringens arbete', 'föreslår annan politik'],
    termsEn: ['opposition', 'scrutinizes', 'alternative policies'],
  },
  {
    id: 'q029',
    chapterId: 4,
    questionSv:
      'Hur ofta hålls val till riksdag, regionfullmäktige och kommunfullmäktige i Sverige?',
    questionEn:
      'How often are elections to the Riksdag, regional councils, and municipal councils held in Sweden?',
    source: { chapter: 'Politiska val och partier', section: 'Val och röstning', page: 14 },
    correctSv: 'Vart fjärde år',
    correctEn: 'Every four years',
    termsSv: ['riksdag', 'regionfullmäktige', 'vart fjärde år'],
    termsEn: ['Riksdag', 'regional councils', 'every four years'],
  },
  {
    id: 'q030',
    chapterId: 4,
    questionSv: 'Vilka krav gäller för att rösta i Sveriges riksdagsval?',
    questionEn: 'Which requirements apply to voting in Sweden’s Riksdag election?',
    source: { chapter: 'Politiska val och partier', section: 'Val och röstning', page: 14 },
    correctSv: 'Man måste vara svensk medborgare och ha fyllt 18 år',
    correctEn: 'You must be a Swedish citizen and at least 18 years old',
    termsSv: ['18', 'svensk medborgare', 'riksdagsval'],
    termsEn: ['18', 'Swedish citizen', 'Riksdag election'],
    supplementalPublisher: 'Valmyndigheten',
  },
];

function readUhrSectionMap() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'content/uhr-section-map.json'), 'utf8'));
}

function assertIncludesAll(haystack, needles, label) {
  for (const needle of needles) {
    assert.ok(haystack.includes(needle), `${label} should include ${needle}`);
  }
}

function optionAtAnswer(question) {
  const answerOption = question.opts[question.answer];
  assert.ok(answerOption, `${question.id} should have a correct answer option`);
  return answerOption;
}

test('CONTENT-VERIFY q021-q030 preserves audited UHR governance and election facts', () => {
  const questionsById = new Map(
    buildSiteQuestionBank().questions.map((question) => [question.id, question]),
  );
  const sectionsByChapter = new Map(
    readUhrSectionMap().chapters.map((chapter) => [chapter.chapter, new Set(chapter.sections)]),
  );

  for (const expected of auditedBatch) {
    const question = questionsById.get(expected.id);
    assert.ok(question, `${expected.id} should be present in the published bank`);
    assert.equal(question.chapterId, expected.chapterId, `${expected.id} chapter id`);
    assert.equal(question.questionProvenance, 'uhr', `${expected.id} provenance`);
    assert.equal(question.q.sv, expected.questionSv, `${expected.id} Swedish stem`);
    assert.equal(question.q.en, expected.questionEn, `${expected.id} English stem`);
    assert.doesNotMatch(question.q.sv, /^(?:Sant eller falskt|Enligt UHR)/i);
    assert.doesNotMatch(question.q.en, /^(?:True or false|According to UHR)/i);

    assert.equal(question.source.title, 'Sverige i fokus', `${expected.id} source title`);
    assert.equal(question.source.chapter, expected.source.chapter, `${expected.id} source chapter`);
    assert.equal(question.source.section, expected.source.section, `${expected.id} source section`);
    assert.equal(question.source.page, expected.source.page, `${expected.id} source page`);
    assert.ok(
      sectionsByChapter.get(expected.source.chapter)?.has(expected.source.section),
      `${expected.id} source section should exist in UHR map`,
    );

    if (expected.supplementalPublisher) {
      assert.equal(
        question.source.supplementalSources?.[0]?.publisher,
        expected.supplementalPublisher,
        `${expected.id} supplemental source publisher`,
      );
    }

    const correct = optionAtAnswer(question);
    assert.equal(correct.sv, expected.correctSv, `${expected.id} Swedish correct answer`);
    assert.equal(correct.en, expected.correctEn, `${expected.id} English correct answer`);
    assertIncludesAll(question.why.sv, expected.termsSv, `${expected.id} Swedish explanation`);
    assertIncludesAll(question.why.en, expected.termsEn, `${expected.id} English explanation`);
  }
});
