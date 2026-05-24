const assert = require('node:assert/strict');
const test = require('node:test');

const { loadCanonicalExportInputs } = require('../scripts/export-site-question-bank');

const trueFalsePrefixPattern = /^\s*(?:Sant eller falskt|True or false)\s*:/i;

const expectedQuestions = {
  q071: {
    chapterId: 'ch09',
    type: 'single_choice',
    chapter: 'Välfärdssamhället',
    section: 'Statligt finansierad välfärd',
    pageApprox: 30,
    correctOptionId: 'a',
    questionSv: 'Vad finansierar staten inom högre utbildning och forskning?',
    questionEn: 'What does the state finance within higher education and research?',
    answerSv: 'Högre utbildning och forskning vid högskolor och universitet',
    answerEn: 'Higher education and research at colleges and universities',
    explanationTerms: [
      /högre utbildning/i,
      /forskning/i,
      /higher education/i,
      /research/i,
      /högskolor och universitet/i,
      /colleges and universities/i,
    ],
    forbiddenTerms: [
      /sjukförsäkring|föräldraförsäkring|arbetslöshetsförsäkring/i,
      /sickness insurance|parental insurance|unemployment insurance/i,
    ],
  },
  q072: {
    chapterId: 'ch09',
    type: 'single_choice',
    chapter: 'Välfärdssamhället',
    section: 'Regionerna ansvarar för sjukvården',
    pageApprox: 30,
    correctOptionId: 'a',
    questionSv: 'Vilket ansvar har Sveriges regioner inom välfärden?',
    questionEn: "What responsibility do Sweden's regions have within welfare?",
    answerSv: 'Att erbjuda hälso- och sjukvård till alla',
    answerEn: 'To provide health and medical care for everyone',
    explanationTerms: [
      /21 regioner/i,
      /tar ut skatt/i,
      /hälso- och sjukvård/i,
      /21 regions/i,
      /tax their residents/i,
      /health and medical care/i,
    ],
  },
  q073: {
    chapterId: 'ch09',
    type: 'single_choice',
    chapter: 'Välfärdssamhället',
    section: 'Kommunerna har ett stort ansvar',
    pageApprox: 31,
    correctOptionId: 'a',
    questionSv: 'Vilket svar ger exempel på kommunal välfärd?',
    questionEn: 'Which answer gives examples of municipal welfare?',
    answerSv: 'Barnomsorg, skolor och utbildning, äldreomsorg och socialtjänst',
    answerEn: 'Childcare, schools and education, elderly care, and social services',
    explanationTerms: [
      /Kommunerna/i,
      /skolor och utbildning/i,
      /äldreomsorg och socialtjänst/i,
      /Municipalities/i,
      /schools and education/i,
      /elderly care, and social services/i,
    ],
  },
  q074: {
    chapterId: 'ch09',
    type: 'true_false',
    chapter: 'Välfärdssamhället',
    section: 'Kommunerna har ett stort ansvar',
    pageApprox: 31,
    correctOptionId: 'true',
    questionSv: 'Sveriges kommuner ska erbjuda äldre personer stöd och hjälp.',
    questionEn: 'Swedish municipalities must offer older people support and help.',
    answerSv: 'Sant',
    answerEn: 'True',
    explanationTerms: [
      /äldre och sjuka personer/i,
      /stöd och hjälp/i,
      /vård och service i hemmet/i,
      /older adults and people who are ill/i,
      /support and help/i,
      /care and services at home/i,
    ],
  },
  q075: {
    chapterId: 'ch10',
    type: 'single_choice',
    chapter: 'Sveriges moderna historia',
    section: 'Från jordbrukssamhälle till industrisamhälle',
    pageApprox: 32,
    correctOptionId: 'a',
    questionSv: 'Vilket påstående beskriver Sverige för tvåhundra år sedan?',
    questionEn: 'Which statement describes Sweden two hundred years ago?',
    answerSv: 'Som ett typiskt jordbruksland där nästan alla bodde på landet',
    answerEn: 'As a typical agricultural country where almost everyone lived in the countryside',
    explanationTerms: [
      /typiskt jordbruksland/i,
      /nästan hela befolkningen bodde på landet/i,
      /städerna var små/i,
      /typical agricultural country/i,
      /almost the whole population lived in the countryside/i,
      /Cities were small/i,
    ],
  },
  q076: {
    chapterId: 'ch10',
    type: 'single_choice',
    chapter: 'Sveriges moderna historia',
    section: 'Befolkningsökning',
    pageApprox: 32,
    correctOptionId: 'a',
    questionSv: 'Varför ökade Sveriges befolkning under 1800-talet?',
    questionEn: 'Why did Sweden’s population grow during the 19th century?',
    answerSv: 'Bättre jordbruksmetoder och medicinska framsteg',
    answerEn: 'Better farming methods and medical advances',
    explanationTerms: [
      /2,5 miljoner invånare/i,
      /dubbelt så stor/i,
      /bättre jordbruksmetoder/i,
      /medicinska framsteg/i,
      /2.5 million inhabitants/i,
      /twice as large/i,
      /better farming methods/i,
      /medical advances/i,
    ],
  },
  q077: {
    chapterId: 'ch10',
    type: 'single_choice',
    chapter: 'Sveriges moderna historia',
    section: 'Befolkningsökning',
    pageApprox: 32,
    correctOptionId: 'a',
    questionSv: 'Ungefär hur många svenskar utvandrade till USA mellan 1850 och 1920?',
    questionEn:
      'Approximately how many Swedes emigrated to the United States between 1850 and 1920?',
    answerSv: 'Över en miljon',
    answerEn: 'More than one million',
    explanationTerms: [
      /svårt att få arbete/i,
      /över en miljon svenskar/i,
      /1850 och 1920/i,
      /difficulty finding work/i,
      /more than one million Swedes/i,
      /1850 and 1920/i,
    ],
  },
  q078: {
    chapterId: 'ch10',
    type: 'single_choice',
    chapter: 'Sveriges moderna historia',
    section: 'Sveriges väg till demokrati',
    pageApprox: 33,
    correctOptionId: 'a',
    questionSv: 'Vad förändrades genom den nya grundlagen år 1809?',
    questionEn: 'What changed through the new constitution in 1809?',
    answerSv: 'Kungens makt begränsades',
    answerEn: 'The king’s power was limited',
    explanationTerms: [
      /1809/i,
      /ny grundlag/i,
      /kungens makt/i,
      /rösträtten fortfarande var begränsad/i,
      /new constitution/i,
      /king’s power/i,
      /voting rights were still limited/i,
    ],
  },
  q079: {
    chapterId: 'ch10',
    type: 'single_choice',
    chapter: 'Sveriges moderna historia',
    section: 'Folkrörelserna',
    pageApprox: 33,
    correctOptionId: 'a',
    questionSv: 'Vilka fyra folkrörelser var bland de största i Sverige under 1800-talet?',
    questionEn:
      'Which four popular movements were among the largest in Sweden during the 19th century?',
    answerSv: 'Arbetarrörelsen, frikyrkorörelsen, kvinnorörelsen och nykterhetsrörelsen',
    answerEn:
      'The labour movement, free church movement, women’s movement, and temperance movement',
    explanationTerms: [
      /åtta timmars arbetsdag/i,
      /rösträtt/i,
      /religionsfrihet/i,
      /eight-hour workday/i,
      /suffrage/i,
      /freedom of religion/i,
    ],
  },
  q080: {
    chapterId: 'ch10',
    type: 'single_choice',
    chapter: 'Sveriges moderna historia',
    section: 'Demokratins genombrott',
    pageApprox: 34,
    correctOptionId: 'c',
    questionSv:
      'Vilket år hölls det första riksdagsvalet där både kvinnor och män fick rösta och kvinnor kunde bli riksdagsledamöter?',
    questionEn:
      'In which year was the first Riksdag election held in which both women and men could vote and women could become members of the Riksdag?',
    answerSv: '1921',
    answerEn: '1921',
    explanationTerms: [
      /1921/i,
      /både kvinnor och män fick rösta/i,
      /kvinnor kunde bli riksdagsledamöter/i,
      /1909/i,
      /1918/i,
      /both women and men could vote/i,
      /women could become members of the Riksdag/i,
      /universal suffrage/i,
    ],
  },
};

function sourceQuestionsById() {
  return new Map(
    loadCanonicalExportInputs().sourceQuestions.map((question) => [question.id, question]),
  );
}

function questionText(question) {
  return [
    question.questionSv,
    question.questionEn,
    question.explanationSv,
    question.explanationEn,
    ...(question.options || []).flatMap((option) => [option.textSv, option.textEn]),
  ].join(' ');
}

test('CONTENT-VERIFY q071-q080 pins UHR source locators, answers, and bilingual facts', () => {
  const byId = sourceQuestionsById();

  for (const [id, expected] of Object.entries(expectedQuestions)) {
    const question = byId.get(id);
    assert.ok(question, `${id} should be published as a UHR-provenance source question`);

    assert.equal(question.chapterId, expected.chapterId, `${id} chapterId`);
    assert.equal(question.type, expected.type, `${id} type`);
    assert.equal(question.reviewStatus, 'published', `${id} review status`);
    assert.equal(question.correctOptionId, expected.correctOptionId, `${id} correct option`);
    assert.deepEqual(question.uhrReference, {
      chapter: expected.chapter,
      section: expected.section,
      pageApprox: expected.pageApprox,
    });
    assert.equal(question.questionSv, expected.questionSv, `${id} Swedish stem`);
    assert.equal(question.questionEn, expected.questionEn, `${id} English stem`);
    assert.equal(
      question.options.find((option) => option.id === expected.correctOptionId)?.textSv,
      expected.answerSv,
    );
    assert.equal(
      question.options.find((option) => option.id === expected.correctOptionId)?.textEn,
      expected.answerEn,
    );

    const combinedText = questionText(question);
    for (const term of expected.explanationTerms) {
      assert.match(combinedText, term, `${id} should retain audited UHR-backed term ${term}`);
    }
    for (const term of expected.forbiddenTerms || []) {
      assert.doesNotMatch(
        combinedText,
        term,
        `${id} should not drift into neighbouring source topic ${term}`,
      );
    }
    assert.doesNotMatch(
      question.questionSv,
      trueFalsePrefixPattern,
      `${id} source stem should not include UI true/false prefix`,
    );
    assert.doesNotMatch(
      question.questionEn,
      trueFalsePrefixPattern,
      `${id} source stem should not include UI true/false prefix`,
    );
  }
});
