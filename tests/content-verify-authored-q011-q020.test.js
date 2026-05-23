const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { buildSiteQuestionBank } = require('../scripts/export-site-question-bank');

const repoRoot = path.resolve(__dirname, '..');

const auditedBatch = [
  {
    id: 'q011',
    chapterId: 2,
    questionSv: 'Vad betyder demokrati?',
    questionEn: 'What does democracy mean?',
    source: {
      chapter: 'Sveriges demokratiska system',
      section: 'Demokrati betyder folkstyre',
      page: 10,
    },
    correctSv: 'Folkstyre',
    correctEn: 'Rule by the people',
    termsSv: ['folkstyre', 'makten utgår från folket', 'politiska alternativ'],
    termsEn: ['rule by the people', 'power comes from the people', 'political alternatives'],
  },
  {
    id: 'q012',
    chapterId: 2,
    questionSv: 'Vilket av följande ingår i fria val i en demokrati?',
    questionEn: 'Which of the following is part of free elections in a democracy?',
    source: {
      chapter: 'Sveriges demokratiska system',
      section: 'Demokrati betyder folkstyre',
      page: 10,
    },
    correctSv: 'Alla som har rätt att rösta har en röst var',
    correctEn: 'Everyone who is eligible to vote has one vote',
    termsSv: ['en röst var', 'utan hot eller tvång', 'hemligt'],
    termsEn: ['one vote', 'without threats or coercion', 'secret'],
  },
  {
    id: 'q013',
    chapterId: 2,
    questionSv: 'Hur kan människor påverka samhället och delta i demokratin?',
    questionEn: 'How can people influence society and participate in democracy?',
    source: {
      chapter: 'Sveriges demokratiska system',
      section: 'En stark demokrati',
      page: 10,
    },
    correctSv: 'Kontakta politiker, demonstrera eller skriva på en namninsamling',
    correctEn: 'Contact politicians, join a demonstration, or sign a petition',
    termsSv: ['kontakta politiker', 'demonstrera', 'namninsamling'],
    termsEn: ['contacting politicians', 'joining a demonstration', 'petition'],
  },
  {
    id: 'q014',
    chapterId: 2,
    questionSv:
      'Vad kallas det när lagarna gäller lika för alla och ingen får dömas utan en rättvis rättegång?',
    questionEn:
      'What is it called when laws apply equally to everyone and no one can be convicted without a fair trial?',
    source: {
      chapter: 'Sveriges demokratiska system',
      section: 'Demokrati betyder folkstyre',
      page: 10,
    },
    correctSv: 'Rättssäkerhet',
    correctEn: 'The rule of law',
    termsSv: ['lagarna gäller för alla', 'rättvis rättegång'],
    termsEn: ['laws apply to everyone', 'fair trial'],
  },
  {
    id: 'q015',
    chapterId: 2,
    questionSv: 'Hur kan ett lågt valdeltagande påverka demokratin?',
    questionEn: 'How can a low voter turnout affect democracy?',
    source: {
      chapter: 'Sveriges demokratiska system',
      section: 'Hot mot demokratin',
      page: 11,
    },
    correctSv: 'Människor kan få mindre möjlighet att påverka politiska beslut',
    correctEn: 'People may have fewer opportunities to influence political decisions',
    termsSv: [
      'svårare för människor att påverka',
      'politiska beslut',
      'skillnaderna mellan grupper',
    ],
    termsEn: ['fewer opportunities', 'political decisions', 'differences between groups'],
  },
  {
    id: 'q016',
    chapterId: 3,
    questionSv:
      'Hur väljer medborgarna ledamöter till riksdagen i Sveriges parlamentariska representativa demokrati?',
    questionEn:
      "How do citizens choose members of the Riksdag in Sweden's parliamentary representative democracy?",
    source: { chapter: 'Så här styrs Sverige', section: 'Staten', page: 12 },
    correctSv: 'Genom att rösta i allmänna val',
    correctEn: 'By voting in general elections',
    termsSv: ['parlamentarisk representativ demokrati', 'rösta i allmänna val', 'Riksdagen'],
    termsEn: ['parliamentary representative democracy', 'voting in general elections', 'Riksdag'],
  },
  {
    id: 'q017',
    chapterId: 3,
    questionSv: 'Hur många ledamöter har riksdagen?',
    questionEn: 'How many members does the Riksdag have?',
    source: { chapter: 'Så här styrs Sverige', section: 'Staten', page: 12 },
    correctSv: '349',
    correctEn: '349',
    termsSv: ['349 ledamöter', 'vart fjärde år'],
    termsEn: ['349 members', 'every four years'],
  },
  {
    id: 'q018',
    chapterId: 3,
    questionSv: 'Vem väljer statsministern?',
    questionEn: 'Who chooses the prime minister?',
    source: { chapter: 'Så här styrs Sverige', section: 'Staten', page: 12 },
    correctSv: 'Riksdagen',
    correctEn: 'The Riksdag',
    termsSv: ['Riksdagen väljer statsministern', 'bilda regering', 'ministrarna'],
    termsEn: ['Riksdag chooses the prime minister', 'forming a government', 'ministers'],
  },
  {
    id: 'q019',
    chapterId: 4,
    questionSv: 'Hur gammal måste man ha fyllt för att ha rösträtt?',
    questionEn: 'How old must a person be to have the right to vote?',
    source: { chapter: 'Politiska val och partier', section: 'Val och röstning', page: 14 },
    correctSv: '18 år',
    correctEn: '18 years old',
    termsSv: ['18 år', 'riksdagsval', 'svenskt medborgarskap'],
    termsEn: ['18', 'right to vote', 'Swedish citizenship'],
  },
  {
    id: 'q020',
    chapterId: 4,
    questionSv: 'Vad betyder det att folkomröstningar i Sverige är rådgivande?',
    questionEn: 'What does it mean that referendums in Sweden are advisory?',
    source: { chapter: 'Politiska val och partier', section: 'Folkomröstningar', page: 14 },
    correctSv: 'Politikerna behöver inte följa resultatet',
    correctEn: 'Politicians do not have to follow the result',
    termsSv: ['särskild fråga', 'rådgivande', 'behöver inte följa resultatet'],
    termsEn: ['specific issue', 'advisory', 'do not have to follow the result'],
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

test('CONTENT-VERIFY q011-q020 preserves audited UHR democracy and governance facts', () => {
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

    const correct = optionAtAnswer(question);
    assert.equal(correct.sv, expected.correctSv, `${expected.id} Swedish correct answer`);
    assert.equal(correct.en, expected.correctEn, `${expected.id} English correct answer`);
    assertIncludesAll(question.why.sv, expected.termsSv, `${expected.id} Swedish explanation`);
    assertIncludesAll(question.why.en, expected.termsEn, `${expected.id} English explanation`);
  }
});
