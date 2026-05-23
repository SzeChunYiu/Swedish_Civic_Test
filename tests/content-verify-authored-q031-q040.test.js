const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { buildSiteQuestionBank } = require('../scripts/export-site-question-bank');

const repoRoot = path.resolve(__dirname, '..');
const trueFalsePrefixPattern = /^\s*(?:Sant eller falskt|True or false)\s*:/i;

function parseExportedCsvLine(line) {
  return [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)].map((match) =>
    match[1].replaceAll('""', '"'),
  );
}

function loadQuestionBankCsvRowsById() {
  const csv = fs.readFileSync(path.join(repoRoot, 'content', 'question-bank.csv'), 'utf8');
  const lines = csv.trimEnd().split('\n');
  const header = parseExportedCsvLine(lines[0]);
  return new Map(
    lines.slice(1).map((line) => {
      const fields = parseExportedCsvLine(line);
      const row = Object.fromEntries(header.map((field, index) => [field, fields[index]]));
      return [row.id, row];
    }),
  );
}

const expectedQuestions = {
  q031: {
    chapterId: 4,
    type: 'true_false',
    answer: 1,
    section: 'Folkomröstningar',
    page: 14,
    questionSv: 'Politiker i Sverige måste följa resultatet av en folkomröstning.',
    questionEn: 'Politicians in Sweden must follow the result of a referendum.',
    correctSv: 'Falskt',
    correctEn: 'False',
    whySv: ['rådgivande', 'politikerna inte måste följa resultatet'],
    whyEn: ['advisory', 'politicians do not have to follow the result'],
    tags: ['referendum', 'advisory', 'euro-referendum'],
  },
  q032: {
    chapterId: 4,
    type: 'single_choice',
    answer: 0,
    section: 'Så här går det till att rösta',
    page: 14,
    questionSv: 'Varför röstar väljare bakom en skärm i vallokalen?',
    questionEn: 'Why do voters vote behind a screen at the polling station?',
    correctSv: 'För att valet är hemligt och ingen annan ska se vilket val de gör',
    correctEn: 'Because the vote is secret and no one else should see their choice',
    whySv: ['Valet är hemligt', 'ingen annan kan se vilket val väljaren gör'],
    whyEn: ['The vote is secret', 'prevents others from seeing the choice'],
    tags: ['secret-ballot', 'polling-station', 'voting'],
  },
  q033: {
    chapterId: 4,
    type: 'single_choice',
    answer: 0,
    section: 'Politiska partier',
    page: 15,
    questionSv: 'Vad har människor i ett politiskt parti gemensamt?',
    questionEn: 'What do people in a political party have in common?',
    correctSv: 'Gemensamma idéer om hur samhället ska styras',
    correctEn: 'Shared ideas about how society should be governed',
    whySv: ['gemensamma idéer', 'olika alternativ'],
    whyEn: ['shared ideas', 'different alternatives'],
    tags: ['political-parties', 'shared-ideas', 'democratic-choice'],
  },
  q034: {
    chapterId: 4,
    type: 'single_choice',
    answer: 0,
    section: 'Proportionella val',
    page: 15,
    questionSv: 'Vad händer i ett proportionellt val om ett parti får 20 procent av rösterna?',
    questionEn:
      'What happens in a proportional election if a party receives 20 percent of the votes?',
    correctSv: 'Partiet får 20 procent av platserna',
    correctEn: 'The party receives 20 percent of the seats',
    whySv: ['andel av rösterna', 'tjugo procent av platserna'],
    whyEn: ['share of the votes', 'twenty percent of the seats'],
    tags: ['proportional-elections', 'seats', 'vote-share'],
  },
  q035: {
    chapterId: 4,
    type: 'single_choice',
    answer: 0,
    section: 'Proportionella val',
    page: 15,
    questionSv: 'Hur stor andel av rösterna måste ett parti minst få för att komma in i riksdagen?',
    questionEn: 'What minimum share of votes must a party receive to enter the Riksdag?',
    correctSv: 'Minst 4 procent av rösterna',
    correctEn: 'At least 4 percent of the votes',
    whySv: ['minst fyra procent', 'Fyrprocentsregeln'],
    whyEn: ['at least four percent', 'four-percent rule'],
    tags: ['riksdag', 'threshold', 'parties'],
  },
  q036: {
    chapterId: 5,
    type: 'single_choice',
    answer: 0,
    section: 'Grundlagarna',
    page: 16,
    questionSv: 'Vilken lista innehåller bara Sveriges fyra grundlagar?',
    questionEn: "Which list contains only Sweden's four constitutional laws?",
    correctSv:
      'Regeringsformen, tryckfrihetsförordningen, yttrandefrihetsgrundlagen och successionsordningen',
    correctEn:
      'The Instrument of Government, Freedom of the Press Act, Fundamental Law on Freedom of Expression, and Act of Succession',
    whySv: ['fyra grundlagar', 'successionsordningen'],
    whyEn: ['four constitutional laws', 'Act of Succession'],
    tags: ['constitutional-laws', 'fundamental-laws', 'law'],
  },
  q037: {
    chapterId: 5,
    type: 'single_choice',
    answer: 0,
    section: 'Regeringsformen',
    page: 16,
    questionSv: 'Vad säger regeringsformen om offentlig makt i Sverige?',
    questionEn: 'What does the Instrument of Government say about public power in Sweden?',
    correctSv: 'All offentlig makt utgår från folket',
    correctEn: 'All public power comes from the people',
    whySv: ['all offentlig makt utgår från folket', 'riksdagen stiftar lagar'],
    whyEn: ['all public power comes from the people', 'Riksdag makes laws'],
    tags: ['instrument-of-government', 'constitution', 'democracy'],
  },
  q038: {
    chapterId: 5,
    type: 'single_choice',
    answer: 0,
    section: 'Successionsordningen',
    page: 16,
    questionSv: 'Vad reglerar successionsordningen?',
    questionEn: 'What does the Act of Succession regulate?',
    correctSv: 'Vem som ska bli kung eller drottning efter den nuvarande monarken',
    correctEn: 'Who will become king or queen after the current monarch',
    whySv: ['reglerar tronföljden', 'kung eller drottning'],
    whyEn: ['regulates succession to the throne', 'king or queen'],
    tags: ['succession', 'monarchy', 'constitution'],
  },
  q039: {
    chapterId: 5,
    type: 'single_choice',
    answer: 0,
    section: 'Allemansrätten',
    page: 17,
    questionSv: 'Vad innebär allemansrätten?',
    questionEn: 'What does the right of public access mean?',
    correctSv: 'Den ger alla möjlighet att vara i naturen, men man måste visa ansvar',
    correctEn: 'It gives everyone the opportunity to be in nature, but people must act responsibly',
    whySv: ['oavsett vem som äger marken', 'inte skada naturen'],
    whyEn: ['regardless of who owns the land', 'may not damage nature'],
    tags: ['right-of-public-access', 'nature', 'responsibility'],
  },
  q040: {
    chapterId: 5,
    type: 'single_choice',
    answer: 0,
    section: 'Rättsväsendet',
    page: 17,
    questionSv: 'Vilka myndigheter ingår i det svenska rättsväsendet?',
    questionEn: 'Which authorities are part of the Swedish justice system?',
    correctSv: 'Polisen, Åklagarmyndigheten, domstolar, Brottsoffermyndigheten och Kriminalvården',
    correctEn:
      'The Police, Swedish Prosecution Authority, courts, Crime Victim Authority, and Prison and Probation Service',
    whySv: ['lagar följs', 'staten utövar makt enligt lagen'],
    whyEn: ['laws are followed', 'state power is exercised according to law'],
    tags: ['justice-system', 'authorities', 'law'],
  },
};

test('CONTENT-VERIFY q031-q040 keeps authored UHR facts, answers, and exports stable', () => {
  const questions = buildSiteQuestionBank().questions;
  const rowsById = loadQuestionBankCsvRowsById();
  const byId = new Map(questions.map((question) => [question.id, question]));

  for (const [id, expected] of Object.entries(expectedQuestions)) {
    const question = byId.get(id);
    const csvRow = rowsById.get(id);

    assert.ok(question, `${id} should be present in the static question bank`);
    assert.ok(csvRow, `${id} should be present in content/question-bank.csv`);
    assert.equal(question.questionProvenance, 'uhr', `${id} should remain UHR-provenance`);
    assert.equal(question.chapterId, expected.chapterId, `${id} chapter should stay audited`);
    assert.equal(question.type, expected.type, `${id} type should stay audited`);
    assert.equal(question.answer, expected.answer, `${id} answer key should stay audited`);
    assert.equal(question.q.sv, expected.questionSv, `${id} Swedish stem drifted`);
    assert.equal(question.q.en, expected.questionEn, `${id} English stem drifted`);
    assert.equal(question.source.section, expected.section, `${id} UHR section drifted`);
    assert.equal(question.source.page, expected.page, `${id} UHR page drifted`);
    assert.deepEqual(question.tags, expected.tags, `${id} tags drifted`);
    assert.doesNotMatch(question.q.sv, trueFalsePrefixPattern, `${id} has a Swedish UI prefix`);
    assert.doesNotMatch(question.q.en, trueFalsePrefixPattern, `${id} has an English UI prefix`);

    const correctOption = question.opts[expected.answer];
    assert.equal(correctOption.sv, expected.correctSv, `${id} Swedish correct option drifted`);
    assert.equal(correctOption.en, expected.correctEn, `${id} English correct option drifted`);
    for (const fragment of expected.whySv) {
      assert.match(
        question.why.sv,
        new RegExp(fragment),
        `${id} Swedish explanation lost ${fragment}`,
      );
    }
    for (const fragment of expected.whyEn) {
      assert.match(
        question.why.en,
        new RegExp(fragment),
        `${id} English explanation lost ${fragment}`,
      );
    }

    assert.equal(csvRow.questionSv, expected.questionSv, `${id} CSV Swedish stem drifted`);
    assert.equal(csvRow.questionEn, expected.questionEn, `${id} CSV English stem drifted`);
    assert.equal(csvRow.uhrSection, expected.section, `${id} CSV UHR section drifted`);
    assert.equal(csvRow.uhrPageApprox, String(expected.page), `${id} CSV UHR page drifted`);
    assert.equal(csvRow.questionProvenance, 'uhr', `${id} CSV provenance drifted`);
    assert.match(
      csvRow.uhrCitationEn,
      /^Source: Sverige i fokus, /,
      `${id} CSV source line drifted`,
    );
  }
});
