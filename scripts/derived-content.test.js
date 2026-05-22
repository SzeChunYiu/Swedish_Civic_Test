const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const {
  GENERATED_TRUE_FALSE_NATURALNESS_PATTERN_RULES,
  findGeneratedTrueFalseNaturalnessPatternMatch,
  formatGeneratedTrueFalseNaturalnessPatternMatch,
} = require('./generated-true-false-naturalness-patterns');
const { generatedQuestionId } = require('./generated-question-fixture-ids');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath, exportName) {
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);
  function localRequire(request) {
    if (request.startsWith('.')) {
      return loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)));
    }
    return require(request);
  }
  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function assertQuestionTextPresent(questions, questionSv, questionEn, expectedId) {
  const question = questions.find(
    (candidate) => candidate.questionSv === questionSv && candidate.questionEn === questionEn,
  );
  const label = expectedId ? ` ${expectedId}` : '';
  assert.ok(question, `expected generated question${label} text: ${questionSv} / ${questionEn}`);
  if (expectedId) assert.equal(question.id, expectedId);
  return question;
}

test('derivePublishedQuestions creates four published UHR-referenced variants per source question', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const source = {
    id: 'q001',
    chapterId: 'ch01',
    type: 'single_choice',
    questionSv: 'Var ligger Sverige?',
    questionEn: 'Where is Sweden located?',
    options: [
      { id: 'a', textSv: 'I Norden', textEn: 'In the Nordic region' },
      { id: 'b', textSv: 'I Asien', textEn: 'In Asia' },
      { id: 'c', textSv: 'I Afrika', textEn: 'In Africa' },
      { id: 'd', textSv: 'I Sydamerika', textEn: 'In South America' },
    ],
    correctOptionId: 'a',
    explanationSv: 'Sverige ligger i Norden.',
    explanationEn: 'Sweden is in the Nordic region.',
    uhrReference: { chapter: 'Landet Sverige', section: 'Geografi', pageApprox: 5 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography'],
  };

  const derived = derivePublishedQuestions([source], 101);
  assert.equal(derived.length, 4);
  assert.deepEqual(
    derived.map((question) => question.id),
    ['q101', 'q102', 'q103', 'q104'],
  );
  assert.ok(derived.every((question) => question.reviewStatus === 'published'));
  assert.ok(derived.every((question) => question.uhrReference.section === 'Geografi'));
  assert.ok(derived.some((question) => question.type === 'true_false'));
  assert.ok(derived.every((question) => question.tags.length === new Set(question.tags).size));
  assert.equal(derived[0].questionSv, 'Sverige ligger ...?');
  assert.equal(derived[0].questionEn, 'Sweden is located ...?');
  assert.equal(derived[1].questionSv, 'Sverige ligger i Norden.');
  assert.equal(derived[1].questionEn, 'Sweden is located in the Nordic region.');
  assert.equal(derived[2].questionSv, 'Sverige ligger i Asien.');
  assert.equal(derived[2].questionEn, 'Sweden is located in Asia.');
  assert.equal(derived[3].questionSv, 'Vilken uppgift stämmer när det gäller var Sverige ligger?');
  assert.equal(derived[3].questionEn, 'Which fact is correct regarding where Sweden is located?');
  assert.deepEqual(
    derived[3].options.map((option) => option.textEn),
    ['In the Nordic region', 'In Asia', 'In Africa', 'In South America'],
  );
  assert.ok(
    derived
      .filter((question) => question.type === 'true_false')
      .every(
        (question) =>
          !/Ett korrekt svar på frågan|A correct answer to/.test(
            `${question.questionSv} ${question.questionEn}`,
          ),
      ),
  );
});

test('derivePublishedQuestions keeps generated single-choice variants at four options', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const source = {
    id: 'q002',
    chapterId: 'ch01',
    type: 'true_false',
    questionSv: 'Sverige ligger i Norden.',
    questionEn: 'Sweden is in the Nordic region.',
    options: [
      { id: 'true', textSv: 'Sant', textEn: 'True' },
      { id: 'false', textSv: 'Falskt', textEn: 'False' },
    ],
    correctOptionId: 'true',
    explanationSv: 'Sverige ligger i Norden.',
    explanationEn: 'Sweden is in the Nordic region.',
    uhrReference: { chapter: 'Landet Sverige', section: 'Geografi', pageApprox: 5 },
    difficulty: 'easy',
    reviewStatus: 'reviewed',
    tags: ['geography', 'true-false'],
  };

  const derived = derivePublishedQuestions([source], 105);
  const singleChoiceVariants = derived.filter((question) => question.type === 'single_choice');

  assert.ok(singleChoiceVariants.length > 0);
  assert.ok(singleChoiceVariants.every((question) => question.options.length === 4));
  singleChoiceVariants.forEach((question) => {
    assert.deepEqual(
      question.options.map((option) => option.id),
      ['a', 'b', 'c', 'd'],
    );
  });
  assert.equal(derived[0].options[0].textSv, 'Sverige ligger i Norden.');
  assert.equal(derived[0].options[0].textEn, 'Sweden is in the Nordic region.');
  assert.equal(derived[0].options[1].textSv, 'Sverige ligger inte i Norden.');
  assert.equal(derived[0].options[1].textEn, 'Sweden is not in the Nordic region.');
  assert.ok(
    singleChoiceVariants.every(
      (question) =>
        !/materialet|from the material|None of the options is correct|Only sometimes|Inget av alternativen stämmer|Endast ibland/i.test(
          JSON.stringify(question.options),
        ),
    ),
  );
  assert.ok(singleChoiceVariants.every((question) => question.correctOptionId === 'a'));
  assert.equal(derived[0].questionSv, 'Vad gäller för Sverige?');
  assert.equal(derived[0].questionEn, 'What is correct about Sweden?');
  assert.ok(
    singleChoiceVariants.every(
      (question) =>
        !/Vilket svar stämmer bäst\?\s*Sant eller falskt:|Which answer best matches\?\s*True or false:/.test(
          `${question.questionSv} ${question.questionEn}`,
        ),
    ),
  );

  const trueFalseVariants = derived.filter((question) => question.type === 'true_false');
  assert.deepEqual(
    trueFalseVariants.map((question) => question.questionSv),
    ['Sverige ligger i Norden.', 'Sverige ligger inte i Norden.'],
  );
  assert.deepEqual(
    trueFalseVariants.map((question) => question.questionEn),
    ['Sweden is in the Nordic region.', 'Sweden is not in the Nordic region.'],
  );
  assert.equal(derived[3].questionSv, 'Vilken uppgift stämmer om Sverige?');
  assert.equal(derived[3].questionEn, 'Which fact is correct about Sweden?');
  assert.ok(
    singleChoiceVariants.every(
      (question) =>
        !/Vilket påstående är korrekt|Vilket påstående stämmer bäst|Which statement is correct|Which statement best matches|Påståendet är sant|alternativet Sant|medan Falskt|påståendet som motsvarar den uppgiften|motsatsen inte stämmer|That makes True correct|while False|statement that matches that fact|opposite statement is not/i.test(
          `${question.questionSv} ${question.questionEn} ${question.explanationSv} ${question.explanationEn}`,
        ),
    ),
  );
  assert.ok(
    trueFalseVariants.every(
      (question) =>
        !/Ett korrekt svar|Det är inte sant att|Det stämmer att|A correct answer|It is not true that|It is true that/.test(
          `${question.questionSv} ${question.questionEn}`,
        ),
    ),
  );
});

test('derivePublishedQuestions writes natural generated true/false civic statements', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const sources = [
    {
      id: 'q003',
      chapterId: 'ch01',
      type: 'single_choice',
      questionSv: 'Vad heter havet vid Sveriges östra kust?',
      questionEn: "What is the sea along Sweden's eastern coast called?",
      options: [
        { id: 'a', textSv: 'Västerhavet', textEn: 'The Western Sea' },
        { id: 'b', textSv: 'Bottenviken', textEn: 'The Bothnian Bay' },
        { id: 'c', textSv: 'Östersjön', textEn: 'The Baltic Sea' },
        { id: 'd', textSv: 'Nordsjön', textEn: 'The North Sea' },
      ],
      correctOptionId: 'c',
      explanationSv: 'Östersjön ligger vid Sveriges östra kust.',
      explanationEn: "The Baltic Sea lies along Sweden's eastern coast.",
      uhrReference: { chapter: 'Landet Sverige', section: 'Geografi', pageApprox: 5 },
      difficulty: 'easy',
      reviewStatus: 'reviewed',
      tags: ['geography'],
    },
    {
      id: 'q009',
      chapterId: 'ch01',
      type: 'single_choice',
      questionSv: 'Ungefär hur många människor bor i Sverige?',
      questionEn: 'Approximately how many people live in Sweden?',
      options: [
        { id: 'a', textSv: 'nästan 11 miljoner', textEn: 'almost 11 million' },
        { id: 'b', textSv: 'nästan 1 miljon', textEn: 'almost 1 million' },
        { id: 'c', textSv: 'nästan 30 miljoner', textEn: 'almost 30 million' },
        { id: 'd', textSv: 'nästan 50 miljoner', textEn: 'almost 50 million' },
      ],
      correctOptionId: 'a',
      explanationSv: 'Sverige har nästan 11 miljoner invånare.',
      explanationEn: 'Sweden has almost 11 million residents.',
      uhrReference: { chapter: 'Landet Sverige', section: 'Befolkning', pageApprox: 7 },
      difficulty: 'easy',
      reviewStatus: 'reviewed',
      tags: ['population'],
    },
    {
      id: 'q035',
      chapterId: 'ch04',
      type: 'single_choice',
      questionSv:
        'Hur stor andel av rösterna måste ett parti minst få för att komma in i riksdagen?',
      questionEn: 'What minimum share of votes must a party receive to enter the Riksdag?',
      options: [
        {
          id: 'a',
          textSv: 'minst 4 procent av rösterna',
          textEn: 'at least 4 percent of the votes',
        },
        {
          id: 'b',
          textSv: 'minst 1 procent av rösterna',
          textEn: 'at least 1 percent of the votes',
        },
        {
          id: 'c',
          textSv: 'minst 25 procent av rösterna',
          textEn: 'at least 25 percent of the votes',
        },
        {
          id: 'd',
          textSv: 'minst 50 procent av rösterna',
          textEn: 'at least 50 percent of the votes',
        },
      ],
      correctOptionId: 'a',
      explanationSv: 'Ett parti behöver minst 4 procent för att komma in i riksdagen.',
      explanationEn: 'A party needs at least 4 percent to enter the Riksdag.',
      uhrReference: {
        chapter: 'Politiska val och partier',
        section: 'Proportionella val',
        pageApprox: 15,
      },
      difficulty: 'easy',
      reviewStatus: 'reviewed',
      tags: ['elections'],
    },
    {
      id: 'q164',
      chapterId: 'ch11',
      type: 'single_choice',
      questionSv: 'Vilket påstående beskriver det civila försvaret vid krig eller kris?',
      questionEn: 'Which statement describes civil defence during war or crisis?',
      options: [
        {
          id: 'a',
          textSv:
            'Viktiga verksamheter som skola, arbete och hälso- och sjukvård kan fortsätta fungera',
          textEn:
            'Important activities such as school, work, and health care can continue to function',
        },
        {
          id: 'b',
          textSv: 'Politiska val ersätts med militära beslut',
          textEn: 'Political elections are replaced with military decisions',
        },
        {
          id: 'c',
          textSv: 'Bara Försvarsmakten ansvarar för samhällets motståndskraft',
          textEn: 'Only the Swedish Armed Forces are responsible for society’s resilience',
        },
        {
          id: 'd',
          textSv: 'EU bestämmer varje skolas dagliga schema',
          textEn: 'The EU decides every school’s daily timetable',
        },
      ],
      correctOptionId: 'a',
      explanationSv: 'Det civila försvaret hjälper viktiga verksamheter att fungera.',
      explanationEn: 'Civil defence helps important services keep working.',
      uhrReference: {
        chapter: 'Sverige och omvärlden',
        section: 'Det civila försvaret',
        pageApprox: 41,
      },
      difficulty: 'medium',
      reviewStatus: 'reviewed',
      tags: ['civil-defence'],
    },
  ];

  const derived = derivePublishedQuestions(sources, 201);
  const generatedTrueFalse = derived.filter((question) => question.type === 'true_false');

  assert.ok(
    generatedTrueFalse.every(
      (question) =>
        !/Det stämmer att (?:Ungefär|Havet)|It is true that (?:The|In|Approximately)|belongs to proportionella val|hör till proportionella val/.test(
          `${question.questionSv} ${question.questionEn}`,
        ),
    ),
  );
  assert.equal(derived[1].questionSv, 'Havet vid Sveriges östra kust heter Östersjön.');
  assert.equal(
    derived[1].questionEn,
    "The sea along Sweden's eastern coast is called the Baltic Sea.",
  );
  assert.equal(derived[5].questionSv, 'Nästan 11 miljoner människor bor i Sverige.');
  assert.equal(derived[5].questionEn, 'Almost 11 million people live in Sweden.');
  assert.equal(
    derived[9].questionSv,
    'Ett parti måste få minst 4 procent av rösterna för att komma in i riksdagen.',
  );
  assert.equal(
    derived[9].questionEn,
    'A party must receive at least 4 percent of the votes to enter the Riksdag.',
  );
  assert.equal(
    derived[13].questionSv,
    'Vid krig eller kris hjälper det civila försvaret viktiga verksamheter som skola, arbete och hälso- och sjukvård att fortsätta fungera.',
  );
  assert.equal(
    derived[13].questionEn,
    'During war or crisis, civil defence helps important services such as school, work, and health care continue.',
  );
  assert.equal(
    derived[14].questionSv,
    'Vid krig eller kris ersätter det civila försvaret politiska val med militära beslut.',
  );
  assert.equal(
    derived[14].questionEn,
    'During war or crisis, civil defence replaces political elections with military decisions.',
  );
});

test('derivePublishedQuestions names the non-citizen voting subject in true/false variants', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const source = {
    id: 'q166',
    chapterId: 'ch04',
    type: 'single_choice',
    questionSv:
      'Vilket svar beskriver rösträtt i kommun- och regionval för personer som inte är svenska medborgare?',
    questionEn:
      'Which answer describes voting rights in municipal and regional elections for people who are not Swedish citizens?',
    options: [
      {
        id: 'a',
        textSv:
          'Vissa kan rösta om de är folkbokförda i Sverige och uppfyller reglerna för sin grupp',
        textEn:
          'Some may vote if they are registered as living in Sweden and meet the rules for their group',
      },
      {
        id: 'b',
        textSv: 'Ingen utan svenskt medborgarskap får rösta i kommun- eller regionval',
        textEn: 'No one without Swedish citizenship may vote in municipal or regional elections',
      },
      {
        id: 'c',
        textSv: 'Alla turister får rösta om de är i Sverige på valdagen',
        textEn: 'All tourists may vote if they are in Sweden on election day',
      },
      {
        id: 'd',
        textSv: 'Partimedlemskap är alltid det enda kravet',
        textEn: 'Party membership is always the only requirement',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'För kommun- och regionval krävs inte alltid svenskt medborgarskap. Personer som inte är svenska medborgare kan ha rösträtt om de är folkbokförda i Sverige och uppfyller reglerna.',
    explanationEn:
      'Swedish citizenship is not always required for municipal and regional elections. People who are not Swedish citizens may have the right to vote if they are registered as living in Sweden and meet the rules.',
    uhrReference: {
      chapter: 'Politiska val och partier',
      section: 'Val och röstning',
      pageApprox: 14,
    },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['voting-rights', 'municipal-elections', 'regional-elections', 'non-citizen-voting'],
  };

  const derived = derivePublishedQuestions([source], 830);

  assert.equal(
    derived[0].options[0].textSv,
    'Vissa kan rösta om de är folkbokförda i Sverige och uppfyller reglerna för sin grupp',
  );
  assert.equal(
    derived[0].options[0].textEn,
    'Some may vote if they are registered as living in Sweden and meet the rules for their group',
  );
  assert.equal(
    derived[1].questionSv,
    'Vissa personer som inte är svenska medborgare kan rösta i kommun- och regionval om de är folkbokförda i Sverige och uppfyller reglerna för sin grupp.',
  );
  assert.equal(
    derived[1].questionEn,
    'Some people who are not Swedish citizens may vote in municipal and regional elections if they are registered as living in Sweden and meet the rules for their group.',
  );
  assert.equal(derived[1].correctOptionId, 'true');
  assert.equal(
    derived[2].questionSv,
    'Ingen utan svenskt medborgarskap får rösta i kommun- eller regionval.',
  );
  assert.equal(
    derived[2].questionEn,
    'No one without Swedish citizenship may vote in municipal or regional elections.',
  );
  assert.equal(derived[2].correctOptionId, 'false');
});

test('derivePublishedQuestions renders q015 voter-turnout true/false without when-splices', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const sourceQuestions = loadTs('data/questions.ts', 'sourceQuestions');
  const source = sourceQuestions.find((question) => question.id === 'q015');
  const firstVariantId = generatedQuestionId(sourceQuestions, 'q015', 'singleChoice');
  const trueStatementId = generatedQuestionId(sourceQuestions, 'q015', 'trueStatement');
  const falseStatementId = generatedQuestionId(sourceQuestions, 'q015', 'falseStatement');

  assert.ok(source, 'q015 source question should exist');

  const derived = derivePublishedQuestions([source], Number(firstVariantId.slice(1)));
  const trueStatement = derived.find((question) => question.id === trueStatementId);
  const falseStatement = derived.find((question) => question.id === falseStatementId);
  const whenSplicePattern =
    /\b(?:när ett lågt valdeltagande påverkar demokratin|when a low voter turnout affects democracy)\b/i;

  assert.equal(
    trueStatement?.questionSv,
    'Ett lågt valdeltagande kan minska människors möjlighet att påverka politiska beslut.',
  );
  assert.equal(
    trueStatement?.questionEn,
    "Low voter turnout can reduce people's opportunities to influence political decisions.",
  );
  assert.equal(falseStatement?.correctOptionId, 'false');
  assert.equal(
    falseStatement?.questionSv,
    'Ett lågt valdeltagande ger alla väljare två röster var i nästa val.',
  );
  assert.equal(
    falseStatement?.questionEn,
    'Low voter turnout gives all voters two votes each in the next election.',
  );
  assert.doesNotMatch(
    `${trueStatement?.questionSv} ${trueStatement?.questionEn}`,
    whenSplicePattern,
  );
  assert.doesNotMatch(
    `${falseStatement?.questionSv} ${falseStatement?.questionEn}`,
    whenSplicePattern,
  );
});

test('derivePublishedQuestions renders how-can-affect true/false as standalone propositions', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const source = {
    id: 'q999',
    chapterId: 'ch02',
    type: 'single_choice',
    questionSv: 'Hur kan falsk information påverka demokratin?',
    questionEn: 'How can false information affect democracy?',
    options: [
      {
        id: 'a',
        textSv: 'Det kan skapa konflikter och skrämma människor från debatt',
        textEn: 'It can create conflicts and scare people away from debate',
      },
      {
        id: 'b',
        textSv: 'Genom att göra alla källor mer pålitliga',
        textEn: 'By making all sources more reliable',
      },
      {
        id: 'c',
        textSv: 'Genom att förbjuda all kritik',
        textEn: 'By banning all criticism',
      },
      {
        id: 'd',
        textSv: 'Genom att stoppa alla nyheter',
        textEn: 'By stopping all news',
      },
    ],
    correctOptionId: 'a',
    explanationSv: 'Falsk information kan skada den demokratiska debatten.',
    explanationEn: 'False information can harm democratic debate.',
    uhrReference: {
      chapter: 'Sveriges demokratiska system',
      section: 'Hot mot demokratin',
      pageApprox: 11,
    },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['democracy', 'false-information'],
  };

  const derived = derivePublishedQuestions([source], 901);
  const trueStatement = derived.find((question) => question.id === 'q902');
  const falseStatement = derived.find((question) => question.id === 'q903');
  const staleSplicePattern = /\b(?:när\s+[^.?!]+?\spåverkar|when\s+[^.?!]+?\saffects)\b/i;

  assert.equal(
    trueStatement?.questionSv,
    'Falsk information kan påverka demokratin genom att skapa konflikter och skrämma människor från debatt.',
  );
  assert.equal(
    trueStatement?.questionEn,
    'False information can affect democracy by creating conflicts and scaring people away from debate.',
  );
  assert.equal(
    falseStatement?.questionSv,
    'Falsk information kan påverka demokratin genom att göra alla källor mer pålitliga.',
  );
  assert.equal(
    falseStatement?.questionEn,
    'False information can affect democracy by making all sources more reliable.',
  );
  assert.doesNotMatch(
    `${trueStatement?.questionSv} ${trueStatement?.questionEn} ${falseStatement?.questionSv} ${falseStatement?.questionEn}`,
    staleSplicePattern,
  );
});

test('derivePublishedQuestions avoids generated true/false naturalness regressions', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const sources = [
    {
      id: 'q020',
      chapterId: 'ch04',
      type: 'single_choice',
      questionSv: 'Vad betyder det att folkomröstningar i Sverige är rådgivande?',
      questionEn: 'What does it mean that referendums in Sweden are advisory?',
      options: [
        {
          id: 'a',
          textSv: 'politikerna måste inte följa resultatet',
          textEn: 'Politicians do not have to follow the result',
        },
        {
          id: 'b',
          textSv: 'politikerna måste alltid följa resultatet',
          textEn: 'Politicians must always follow the result',
        },
        { id: 'c', textSv: 'valet blir hemligt', textEn: 'The vote becomes secret' },
        { id: 'd', textSv: 'riksdagen upplöses', textEn: 'The Riksdag is dissolved' },
      ],
      correctOptionId: 'a',
      explanationSv: 'Folkomröstningar är rådgivande.',
      explanationEn: 'Referendums are advisory.',
      uhrReference: {
        chapter: 'Politiska val och partier',
        section: 'Folkomröstningar',
        pageApprox: 14,
      },
      difficulty: 'medium',
      reviewStatus: 'reviewed',
      tags: ['referendum'],
    },
    {
      id: 'q024',
      chapterId: 'ch03',
      type: 'single_choice',
      questionSv: 'Vilken är regionernas främsta uppgift i Sverige?',
      questionEn: "What is the main responsibility of Sweden's regions?",
      options: [
        {
          id: 'a',
          textSv: 'att ansvara för hälso- och sjukvården',
          textEn: 'to be responsible for health care',
        },
        { id: 'b', textSv: 'att döma i brottmål', textEn: 'to judge criminal cases' },
        { id: 'c', textSv: 'att stifta lagar', textEn: 'to pass laws' },
        { id: 'd', textSv: 'att sköta utrikespolitik', textEn: 'to handle foreign policy' },
      ],
      correctOptionId: 'a',
      explanationSv: 'Regioner ansvarar för vård.',
      explanationEn: 'Regions are responsible for health care.',
      uhrReference: {
        chapter: 'Så här styrs Sverige',
        section: 'Regioner och kommuner',
        pageApprox: 13,
      },
      difficulty: 'medium',
      reviewStatus: 'reviewed',
      tags: ['regions'],
    },
    {
      id: 'q025',
      chapterId: 'ch03',
      type: 'single_choice',
      questionSv: 'Vilket exempel beskriver kommunernas ansvar?',
      questionEn: 'Which example describes municipal responsibilities?',
      options: [
        {
          id: 'a',
          textSv: 'vatten och avlopp, omsorg, snöröjning, parkskötsel och vuxenutbildning',
          textEn:
            'water and sewage, care services, snow removal, park maintenance, and adult education',
        },
        {
          id: 'b',
          textSv: 'att skicka ambassadörer till andra länder',
          textEn: 'sending ambassadors to other countries',
        },
        { id: 'c', textSv: 'att besluta om EU-lagar', textEn: 'passing EU laws' },
        { id: 'd', textSv: 'att leda domstolarna', textEn: 'leading the courts' },
      ],
      correctOptionId: 'a',
      explanationSv: 'Kommuner ansvarar för lokala tjänster.',
      explanationEn: 'Municipalities handle local services.',
      uhrReference: {
        chapter: 'Så här styrs Sverige',
        section: 'Kommunernas ansvar',
        pageApprox: 13,
      },
      difficulty: 'medium',
      reviewStatus: 'reviewed',
      tags: ['municipality'],
    },
    {
      id: 'q008',
      chapterId: 'ch01',
      type: 'single_choice',
      questionSv: 'Vilka är Sveriges tre största sjöar?',
      questionEn: "What are Sweden's three largest lakes?",
      options: [
        { id: 'a', textSv: 'Vänern, Vättern och Mälaren', textEn: 'Vänern, Vättern, and Mälaren' },
        {
          id: 'b',
          textSv: 'Östersjön, Kattegatt och Skagerrak',
          textEn: 'The Baltic Sea, Kattegat, and Skagerrak',
        },
        { id: 'c', textSv: 'Gotland, Öland och Orust', textEn: 'Gotland, Öland, and Orust' },
        {
          id: 'd',
          textSv: 'Stockholm, Göteborg och Malmö',
          textEn: 'Stockholm, Gothenburg, and Malmö',
        },
      ],
      correctOptionId: 'a',
      explanationSv: 'De största sjöarna är Vänern, Vättern och Mälaren.',
      explanationEn: 'The largest lakes are Vänern, Vättern, and Mälaren.',
      uhrReference: {
        chapter: 'Landet Sverige',
        section: 'Skogar, sjöar och öar',
        pageApprox: 6,
      },
      difficulty: 'easy',
      reviewStatus: 'reviewed',
      tags: ['lakes'],
    },
    {
      id: 'q012',
      chapterId: 'ch02',
      type: 'single_choice',
      questionSv: 'Vilket av följande ingår i fria val i en demokrati?',
      questionEn: 'Which of the following is part of free elections in a democracy?',
      options: [
        {
          id: 'a',
          textSv: 'Alla som har rätt att rösta har en röst var',
          textEn: 'Everyone who has the right to vote has one vote each',
        },
        {
          id: 'b',
          textSv: 'Bara ett parti får ställa upp',
          textEn: 'Only one party may stand for election',
        },
        { id: 'c', textSv: 'Väljare röstar öppet', textEn: 'Voters vote publicly' },
        {
          id: 'd',
          textSv: 'Regeringen delar ut rösterna',
          textEn: 'The government assigns the votes',
        },
      ],
      correctOptionId: 'a',
      explanationSv: 'Fria val ger varje röstberättigad en röst.',
      explanationEn: 'Free elections give each eligible voter one vote.',
      uhrReference: {
        chapter: 'Sveriges demokratiska system',
        section: 'Demokrati betyder folkstyre',
        pageApprox: 10,
      },
      difficulty: 'easy',
      reviewStatus: 'reviewed',
      tags: ['elections'],
    },
    {
      id: 'q013',
      chapterId: 'ch02',
      type: 'single_choice',
      questionSv: 'Vilket är ett sätt att påverka och delta i samhället?',
      questionEn: 'Which is a way to influence and participate in society?',
      options: [
        {
          id: 'a',
          textSv: 'Kontakta politiker, demonstrera eller skriva på en namninsamling',
          textEn: 'Contact politicians, join a demonstration, or sign a petition',
        },
        {
          id: 'b',
          textSv: 'Förbjuda andra från att rösta i politiska val',
          textEn: 'Ban others from voting in political elections',
        },
        { id: 'c', textSv: 'Stoppa nyheter', textEn: 'Stop news' },
        { id: 'd', textSv: 'Tysta föreningar', textEn: 'Silence associations' },
      ],
      correctOptionId: 'a',
      explanationSv: 'Det finns flera demokratiska sätt att delta.',
      explanationEn: 'There are several democratic ways to participate.',
      uhrReference: {
        chapter: 'Sveriges demokratiska system',
        section: 'En stark demokrati',
        pageApprox: 10,
      },
      difficulty: 'easy',
      reviewStatus: 'reviewed',
      tags: ['participation'],
    },
    {
      id: 'q014',
      chapterId: 'ch02',
      type: 'single_choice',
      questionSv: 'Varför kan falsk information påverka demokratin?',
      questionEn: 'Why can false information affect democracy?',
      options: [
        {
          id: 'a',
          textSv: 'Det kan skapa konflikter och skrämma människor från debatt',
          textEn: 'It can create conflicts and scare people away from debate',
        },
        {
          id: 'b',
          textSv: 'Det gör alla källor mer pålitliga',
          textEn: 'It makes all sources more reliable',
        },
        { id: 'c', textSv: 'Det förbjuder kritik', textEn: 'It bans criticism' },
        { id: 'd', textSv: 'Det stoppar alla nyheter', textEn: 'It stops all news' },
      ],
      correctOptionId: 'a',
      explanationSv: 'Falsk information kan skada den demokratiska debatten.',
      explanationEn: 'False information can harm democratic debate.',
      uhrReference: {
        chapter: 'Sveriges demokratiska system',
        section: 'Hot mot demokratin',
        pageApprox: 11,
      },
      difficulty: 'medium',
      reviewStatus: 'reviewed',
      tags: ['democracy', 'false-information'],
    },
    {
      id: 'q015',
      chapterId: 'ch02',
      type: 'single_choice',
      questionSv: 'Varför behövs källkritik när man använder medier?',
      questionEn: 'Why is source criticism needed when using media?',
      options: [
        {
          id: 'a',
          textSv: 'Falska uppgifter kan spridas snabbt och påverka människors åsikter',
          textEn: "False information can spread quickly and affect people's opinions",
        },
        {
          id: 'b',
          textSv: 'Alla uppgifter på internet är granskade av myndigheter',
          textEn: 'All information on the internet is checked by public authorities',
        },
        {
          id: 'c',
          textSv: 'Källkritik behövs bara i domstolar',
          textEn: 'Source criticism is needed only in courts',
        },
        {
          id: 'd',
          textSv: 'Medier får inte publicera felaktiga uppgifter',
          textEn: 'Media may not publish incorrect information',
        },
      ],
      correctOptionId: 'a',
      explanationSv: 'Källkritik hjälper människor att värdera uppgifter.',
      explanationEn: 'Source criticism helps people evaluate information.',
      uhrReference: {
        chapter: 'Sveriges demokratiska system',
        section: 'Källkritik och medier',
        pageApprox: 11,
      },
      difficulty: 'medium',
      reviewStatus: 'reviewed',
      tags: ['media', 'source-criticism'],
    },
    {
      id: 'q030',
      chapterId: 'ch04',
      type: 'single_choice',
      questionSv: 'Vilka krav gäller för att rösta i Sveriges riksdagsval?',
      questionEn: 'Which requirements apply to voting in Sweden’s Riksdag election?',
      options: [
        {
          id: 'a',
          textSv: 'Man måste vara svensk medborgare och ha fyllt 18 år',
          textEn: 'You must be a Swedish citizen and at least 18 years old',
        },
        { id: 'b', textSv: 'Man måste äga en bostad', textEn: 'You must own a home' },
        {
          id: 'c',
          textSv: 'Man måste vara medlem i ett parti',
          textEn: 'You must be a party member',
        },
        {
          id: 'd',
          textSv: 'Man måste ha fyllt 16 år',
          textEn: 'You must be at least 16 years old',
        },
      ],
      correctOptionId: 'a',
      explanationSv: 'Riksdagsval kräver medborgarskap och 18 år.',
      explanationEn: 'Riksdag elections require citizenship and age 18.',
      uhrReference: {
        chapter: 'Politiska val och partier',
        section: 'Val och röstning',
        pageApprox: 14,
      },
      difficulty: 'medium',
      reviewStatus: 'reviewed',
      tags: ['voting'],
    },
    {
      id: 'q042',
      chapterId: 'ch05',
      type: 'single_choice',
      questionSv: 'Vad gäller för en person som är misstänkt för brott i Sverige?',
      questionEn: 'What applies to a person suspected of a crime in Sweden?',
      options: [
        {
          id: 'a',
          textSv: 'En misstänkt person ska betraktas som oskyldig tills personen har dömts',
          textEn:
            'A suspected person should be considered innocent until the person has been convicted',
        },
        {
          id: 'b',
          textSv: 'Domstolarna avgör bara familjefrågor',
          textEn: 'Courts decide only family disputes',
        },
        {
          id: 'c',
          textSv: 'En dom kan aldrig överklagas',
          textEn: 'A judgment can never be appealed',
        },
        {
          id: 'd',
          textSv: 'Högsta domstolen prövar alla mål direkt',
          textEn: 'The Supreme Court tries all cases directly',
        },
      ],
      correctOptionId: 'a',
      explanationSv: 'En misstänkt person är oskyldig tills dom.',
      explanationEn: 'A suspect is innocent until judgment.',
      uhrReference: { chapter: 'Lag och rätt', section: 'Domstolar', pageApprox: 18 },
      difficulty: 'medium',
      reviewStatus: 'reviewed',
      tags: ['courts'],
    },
  ];

  const derived = derivePublishedQuestions(sources, 301);
  const allText = derived
    .map((question) => `${question.questionSv} ${question.questionEn}`)
    .join('\n');
  const generatedTrueFalse = derived.filter((question) => question.type === 'true_false');
  const text = generatedTrueFalse
    .map((question) => `${question.questionSv} ${question.questionEn}`)
    .join('\n');

  assert.doesNotMatch(
    text,
    /Det att|describes that|describes government agencies|It is correct that the answer is|regions's foremost task is be|is an example of municipal responsibilities|has one vote each is part of|may stand for election is part of|har en röst var ingår|får ställa upp ingår|is a way to|applies to|gäller för|is the list that contains|about public power in Sweden|means it gives|^One reason is\b|^En anledning är\b|One reason is that (?:so|It)|En anledning är att Det|have they|har de/im,
  );
  assert.doesNotMatch(text, /betyder att politikerna måste (?:inte|alltid) följa resultatet/i);
  assert.doesNotMatch(text, /are The/);
  assert.ok(
    text.includes(
      'Att folkomröstningar i Sverige är rådgivande betyder att politikerna inte behöver följa resultatet.',
    ),
  );
  assert.ok(
    text.includes(
      'Att folkomröstningar i Sverige är rådgivande betyder att politikerna alltid måste följa resultatet.',
    ),
  );
  assert.ok(
    text.includes(
      'That referendums in Sweden are advisory means politicians do not have to follow the result.',
    ),
  );
  assert.ok(text.includes("The main responsibility of Sweden's regions is health care."));
  assert.ok(
    text.includes(
      'Water and sewage, care services, snow removal, park maintenance, and adult education belong among municipal responsibilities.',
    ),
  );
  assert.ok(
    text.includes("Sweden's three largest lakes are the Baltic Sea, Kattegat, and Skagerrak."),
  );
  assert.ok(allText.includes("Which fact is correct about Sweden's three largest lakes?"));
  assert.doesNotMatch(
    allText,
    /Which fact is correct regarding which are Sweden's three largest lakes/i,
  );
  assert.ok(
    text.includes(
      'A feature of free elections in a democracy is that everyone who has the right to vote has one vote each.',
    ),
  );
  assert.ok(
    text.includes(
      'One way to influence and participate in society is to contact politicians, join a demonstration, or sign a petition.',
    ),
  );
  assert.ok(
    text.includes(
      'En anledning till att falsk information kan påverka demokratin är att det kan skapa konflikter och skrämma människor från debatt.',
    ),
  );
  assert.ok(
    text.includes(
      'One reason false information can affect democracy is that it can create conflicts and scare people away from debate.',
    ),
  );
  assert.ok(
    text.includes(
      'En anledning till att källkritik behövs när man använder medier är att falska uppgifter kan spridas snabbt och påverka människors åsikter.',
    ),
  );
  assert.ok(
    text.includes(
      "One reason source criticism is needed when using media is that false information can spread quickly and affect people's opinions.",
    ),
  );
  assert.ok(
    text.includes(
      'To vote in Sweden’s Riksdag election, you must be a Swedish citizen and at least 18 years old.',
    ),
  );
  assert.ok(
    text.includes(
      'A suspected person should be considered innocent until the person has been convicted.',
    ),
  );
});

test('generated true/false naturalness patterns allow direct media and web propositions', () => {
  const allowedMediaPropositions = [
    'Reklamfinansierade medier drivs ofta av privata företag och får inkomster genom reklam.',
    'Advertising-funded media are often run by private companies and earn income from advertising.',
    'Reklamfinansierade medier får aldrig sälja reklamplats.',
    'Advertising-funded media may never sell advertising space.',
    'Många tidningar finns också på internet och uppdateras med nyheter flera gånger per dag.',
    'Many newspapers are also available online and updated with news several times per day.',
    'Många tidningar får bara säljas som ett exemplar per år.',
    'Many newspapers may be sold only as one copy per year.',
    'På webben och i sociala medier kan vem som helst skapa innehåll, och innehållet kontrolleras inte alltid som i andra medier.',
    'On the web and in social media, anyone can create content, and it is not always checked the same way as in other media.',
    'På webben och i sociala medier får bara ansvariga utgivare skriva inlägg.',
    'On the web and in social media, only responsible publishers may write posts.',
    'The public sector in Sweden consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes.',
    'The public sector in Sweden consists only of privately owned companies.',
    'One aim of disability rights work is that society should be accessible so people can participate on equal terms.',
    'One aim of disability rights work is that people with disabilities should not be able to study or work.',
  ];
  const residualFragments = [
    'De drivs ofta av privata företag och får inkomster genom reklam.',
    'They are often run by private companies and earn income from advertising.',
    'De finns också på internet och uppdateras med nyheter flera gånger per dag.',
    'They are also available online and updated with news several times per day.',
    'Vem som helst kan skapa innehåll där, och det kontrolleras inte alltid som i andra medier.',
    'Anyone can create content there, and it is not always checked the same way as in other media.',
    'The public sector in Sweden means activities for which the state, regions, and municipalities are responsible.',
    'The public sector in Sweden means all privately owned companies.',
    'Society should be accessible so people can participate on equal terms.',
    'People with disabilities should not be able to study or work.',
  ];

  assert.deepEqual(
    allowedMediaPropositions
      .map((text) => [text, findGeneratedTrueFalseNaturalnessPatternMatch(text)])
      .filter(([, match]) => match),
    [],
  );
  assert.equal(
    residualFragments.filter((text) => findGeneratedTrueFalseNaturalnessPatternMatch(text)).length,
    residualFragments.length,
  );
});

test('generated true/false naturalness rule ids are stable and categorized', () => {
  const ids = GENERATED_TRUE_FALSE_NATURALNESS_PATTERN_RULES.map((rule) => rule.id);
  const categories = [
    ...new Set(GENERATED_TRUE_FALSE_NATURALNESS_PATTERN_RULES.map((rule) => rule.category)),
  ].sort();

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(
    ids.every((id) =>
      /^(?:answer-fragment|answer-scaffold|definition-cleft|grammar-splice|policy-goal)-[0-9a-z]{7}$/.test(
        id,
      ),
    ),
  );
  assert.deepEqual(categories, [
    'answer-fragment',
    'answer-scaffold',
    'definition-cleft',
    'grammar-splice',
    'policy-goal',
  ]);

  const stableExamples = [
    [
      'That human rights apply to everyone means that everyone has the same rights.',
      'definition-cleft-0deo809',
      'definition-cleft',
    ],
    [
      'They sell advertising space or charge for a specific channel.',
      'answer-fragment-0kt0l0w',
      'answer-fragment',
    ],
    ['One reason is the vote is secret.', 'answer-scaffold-0otd4np', 'answer-scaffold'],
    [
      'The goal of gender equality policy means that women and men have equal power.',
      'policy-goal-0vkfpul',
      'policy-goal',
    ],
    [
      'Important activities such as school, work, and health care can continue to function.',
      'answer-fragment-0prnma7',
      'answer-fragment',
    ],
  ];

  for (const [text, expectedId, expectedCategory] of stableExamples) {
    const match = findGeneratedTrueFalseNaturalnessPatternMatch(text);
    assert.equal(match?.id, expectedId);
    assert.equal(match?.category, expectedCategory);
    assert.match(
      formatGeneratedTrueFalseNaturalnessPatternMatch(match),
      new RegExp(`^${expectedId} `),
    );
  }
});

test('derivePublishedQuestions turns policy-goal meanings into direct English propositions', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const genderEqualitySource = {
    id: 'q900',
    chapterId: 'ch07',
    type: 'single_choice',
    questionSv: 'Vad innebär målet med Sveriges jämställdhetspolitik?',
    questionEn: 'What does the goal of Sweden’s gender equality policy mean?',
    options: [
      {
        id: 'a',
        textSv:
          'Att kvinnor och män ska ha samma rättigheter och skyldigheter och lika mycket makt att påverka samhället och sina egna liv',
        textEn:
          'That women and men should have the same rights and duties and equal power to influence society and their own lives',
      },
      {
        id: 'b',
        textSv: 'Att jämställdhet bara handlar om hur många kvinnor som finns i politiken',
        textEn: 'That gender equality is only about how many women are in politics',
      },
      {
        id: 'c',
        textSv: 'Att kvinnor och män ska ha olika rättigheter i arbetslivet',
        textEn: 'That women and men should have different rights in working life',
      },
      {
        id: 'd',
        textSv: 'Att föräldraledighet bara ska tas av kvinnor',
        textEn: 'That parental leave should only be taken by women',
      },
    ],
    correctOptionId: 'a',
    explanationSv:
      'Sveriges jämställdhetspolitik innebär att kvinnor och män ska ha samma rättigheter och skyldigheter och lika mycket makt att påverka samhället och sina egna liv.',
    explanationEn:
      'Sweden’s gender equality policy means women and men should have the same rights and duties and equal power to influence society and their own lives.',
    uhrReference: {
      chapter: 'Mänskliga rättigheter',
      section: 'Jämställdhet mellan könen',
      pageApprox: 23,
    },
    difficulty: 'medium',
    reviewStatus: 'reviewed',
    tags: ['gender-equality', 'rights', 'policy'],
  };
  const publicHealthSource = {
    ...genderEqualitySource,
    id: 'q901',
    questionSv: 'Vad innebär målet med Sveriges folkhälsopolitik?',
    questionEn: 'What does the goal of Sweden’s public health policy mean?',
    options: [
      {
        id: 'a',
        textSv: 'Att människor ska ha lika möjligheter till en god hälsa',
        textEn: 'That people should have equal opportunities for good health',
      },
      {
        id: 'b',
        textSv: 'Att folkhälsa bara handlar om årliga motionskampanjer',
        textEn: 'That public health is only about annual exercise campaigns',
      },
      {
        id: 'c',
        textSv: 'Att vård bara ska ges i stora städer',
        textEn: 'That health care should only be provided in large cities',
      },
      {
        id: 'd',
        textSv: 'Att arbetsmiljö aldrig påverkar hälsa',
        textEn: 'That working conditions never affect health',
      },
    ],
    explanationSv:
      'Folkhälsopolitik handlar om att människor ska ha lika möjligheter till en god hälsa.',
    explanationEn:
      'Public health policy is about people having equal opportunities for good health.',
    tags: ['public-health', 'policy'],
  };

  const genderEqualityDerived = derivePublishedQuestions([genderEqualitySource], 901);
  const publicHealthDerived = derivePublishedQuestions([publicHealthSource], 905);
  const trueVariant = genderEqualityDerived[1];
  const falseVariant = genderEqualityDerived[2];
  const publicHealthTrueVariant = publicHealthDerived[1];
  const publicHealthFalseVariant = publicHealthDerived[2];

  assert.equal(
    trueVariant.questionEn,
    'Sweden’s gender equality policy aims for women and men to have the same rights, duties, and power to influence society and their own lives.',
  );
  assert.equal(
    falseVariant.questionEn,
    'Sweden’s gender equality policy is only about how many women are in politics.',
  );
  assert.equal(
    publicHealthTrueVariant.questionEn,
    'Sweden’s public health policy aims for people to have equal opportunities for good health.',
  );
  assert.equal(
    publicHealthFalseVariant.questionEn,
    'Sweden’s public health policy is only about annual exercise campaigns.',
  );
  assert.doesNotMatch(
    [
      trueVariant.questionEn,
      falseVariant.questionEn,
      publicHealthTrueVariant.questionEn,
      publicHealthFalseVariant.questionEn,
    ].join('\n'),
    /\bThe goal of .+?\bpolicy means(?: that)?\b/i,
  );
  assert.match(
    findGeneratedTrueFalseNaturalnessPatternMatch(
      'The goal of public health policy means that people should have equal opportunities for good health.',
    )?.pattern.source ?? '',
    /The goal of/,
  );
  assert.match(
    findGeneratedTrueFalseNaturalnessPatternMatch(
      'Målet med Sveriges folkhälsopolitik betyder att människor ska ha lika möjligheter till en god hälsa.',
    )?.pattern.source ?? '',
    /Målet med/,
  );
});

test('derivePublishedQuestions renders q062 public-sector true/false as direct propositions', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const { additionalQuestions } = loadTs('data/additionalQuestions.ts');
  const source = additionalQuestions.find((question) => question.id === 'q062');
  assert.ok(source, 'q062 should exist in additional questions');

  const derived = derivePublishedQuestions([source], 424);
  const trueVariant = derived[1];
  const falseVariant = derived[2];

  assert.equal(trueVariant.id, 'q425');
  assert.equal(falseVariant.id, 'q426');
  assert.equal(
    trueVariant.questionEn,
    'The public sector in Sweden consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes.',
  );
  assert.equal(
    falseVariant.questionEn,
    'The public sector in Sweden consists only of privately owned companies.',
  );
  assert.doesNotMatch(
    `${trueVariant.questionEn}\n${falseVariant.questionEn}`,
    /\bpublic sector in Sweden means\b|\bActivities for which\b/i,
  );
});

test('derivePublishedQuestions writes direct source true/false propositions', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const sourceQ002 = byId.get('q002');
  assert.ok(sourceQ002, 'q002 source true/false question must exist');
  const expectedRows = {
    [generatedQuestionId(sourceQuestions, 'q002', 'falseStatement')]: [
      'Sveriges nordligaste del ligger inte norr om polcirkeln.',
      "Sweden's northernmost part does not lie north of the Arctic Circle.",
    ],
    [generatedQuestionId(sourceQuestions, 'q006', 'falseStatement')]: [
      'Golfströmmen och den Nordatlantiska strömmen bidrar inte till Sveriges milda klimat.',
      "The Gulf Stream and the North Atlantic Current do not help make Sweden's climate mild.",
    ],
    [generatedQuestionId(sourceQuestions, 'q023', 'falseStatement')]: [
      'Riksdagen väljer inte statsminister.',
      'The Riksdag does not choose the prime minister.',
    ],
    [generatedQuestionId(sourceQuestions, 'q028', 'falseStatement')]: [
      'Oppositionen ska inte granska regeringens arbete och föreslå annan politik.',
      'The opposition should not scrutinize the government’s work and propose alternative policies.',
    ],
    [generatedQuestionId(sourceQuestions, 'q031', 'trueStatement')]: [
      'Politiker i Sverige behöver inte följa resultatet av en folkomröstning.',
      'Politicians in Sweden do not have to follow the result of a referendum.',
    ],
    [generatedQuestionId(sourceQuestions, 'q031', 'falseStatement')]: [
      'Politiker i Sverige är skyldiga att följa resultatet av en folkomröstning.',
      'Politicians in Sweden are required to follow the result of a referendum.',
    ],
    [generatedQuestionId(sourceQuestions, 'q047', 'falseStatement')]: [
      'Den som lämnar uppgifter till tidningar, radio och tv har inte rätt att vara anonym.',
      'A person who gives information to newspapers, radio, and TV does not have the right to be anonymous.',
    ],
    [generatedQuestionId(sourceQuestions, 'q049', 'falseStatement')]: [
      'Public service-företag ska inte vara oberoende av politiska och andra intressen.',
      'Public service companies should not be independent of political and other interests.',
    ],
    [generatedQuestionId(sourceQuestions, 'q055', 'trueStatement')]: [
      'Att köpa sex är olagligt i Sverige, men personen som säljer sex straffas inte.',
      'Buying sex is illegal in Sweden, but the person who sells sex is not punished.',
    ],
    [generatedQuestionId(sourceQuestions, 'q055', 'falseStatement')]: [
      'Att köpa sex är alltid lagligt i Sverige.',
      'Buying sex is always legal in Sweden.',
    ],
    [generatedQuestionId(sourceQuestions, 'q060', 'trueStatement')]: [
      'Äktenskap mellan personer av samma kön är tillåtet i Sverige.',
      'Marriage between people of the same sex is permitted in Sweden.',
    ],
    [generatedQuestionId(sourceQuestions, 'q060', 'falseStatement')]: [
      'Äktenskap mellan personer av samma kön är förbjudet i Sverige.',
      'Marriage between people of the same sex is prohibited in Sweden.',
    ],
    [generatedQuestionId(sourceQuestions, 'q074', 'falseStatement')]: [
      'Sveriges kommuner ska inte erbjuda äldre personer stöd och hjälp.',
      'Swedish municipalities do not have to offer older people support and help.',
    ],
    [generatedQuestionId(sourceQuestions, 'q091', 'falseStatement')]: [
      'Det svenska totalförsvaret omfattar inte både det militära försvaret och det civila försvaret.',
      'Swedish total defence does not include both military defence and civil defence.',
    ],
    [generatedQuestionId(sourceQuestions, 'q094', 'falseStatement')]: [
      'År 2000 blev inte Svenska kyrkan ett trossamfund bland flera när staten och Svenska kyrkan skildes åt.',
      'In 2000, the Church of Sweden did not become one faith community among several when the state and the Church of Sweden separated.',
    ],
    [generatedQuestionId(sourceQuestions, 'q143', 'falseStatement')]: [
      'Sverige brukar inte delas in i Götaland, Svealand och Norrland.',
      'Sweden is not usually divided into Götaland, Svealand, and Norrland.',
    ],
  };

  const checkedQuestions = Object.entries(expectedRows).map(([id, [questionSv, questionEn]]) =>
    assertQuestionTextPresent(questions, questionSv, questionEn, id),
  );

  const checkedText = checkedQuestions
    .map((question) => `${question.questionSv} ${question.questionEn}`)
    .join('\n');

  assert.doesNotMatch(
    checkedText,
    /Det är inte sant att|Det stämmer inte att|Det stämmer att|It is not true that|It is true that|Påståendet är sant|The statement is true/i,
  );

  const sourceQ002FalseVariant = assertQuestionTextPresent(
    questions,
    'Sveriges nordligaste del ligger inte norr om polcirkeln.',
    "Sweden's northernmost part does not lie north of the Arctic Circle.",
  );
  assert.equal(
    sourceQ002FalseVariant.explanationSv,
    'Sveriges nordligaste del ligger norr om polcirkeln.',
  );
  assert.equal(
    sourceQ002FalseVariant.explanationEn,
    "Sweden's northernmost part lies north of the Arctic Circle.",
  );
  assert.equal(
    sourceQ002.explanationSv,
    'Sveriges nordligaste del ligger norr om polcirkeln, i det arktiska området. Den norra delen av landet sträcker sig alltså in i området norr om polcirkeln.',
  );
  assert.equal(
    sourceQ002.explanationEn,
    "Sweden's northernmost part lies north of the Arctic Circle, in the Arctic area. The northern part of the country therefore extends into the area north of the Arctic Circle.",
  );

  const falseExplanationOffenders = [...byId.values()]
    .filter(
      (question) =>
        question.type === 'true_false' &&
        question.correctOptionId === 'false' &&
        question.tags.includes('false-statement'),
    )
    .filter((question) =>
      /Påståendet är falskt|alternativet\s+Falskt|Falskt\s+stämmer|The statement is false|False is correct|Därför\s+stämmer\s+alternativet\s+Sant|That makes True correct|True is correct/i.test(
        `${question.explanationSv} ${question.explanationEn}`,
      ),
    )
    .map((question) => question.id);
  assert.deepEqual(falseExplanationOffenders, []);

  const trueExplanationOffenders = [...byId.values()]
    .filter(
      (question) =>
        question.type === 'true_false' &&
        question.correctOptionId === 'true' &&
        question.tags.includes('published-variant'),
    )
    .filter((question) =>
      /Påståendet är sant|Påståendet är falskt|(?:så\s+påståendet\s+är\s+sant|därför\s+(?:är\s+)?påståendet\s+sant)|alternativet\s+Sant|alternativet\s+Falskt|Falskt\s+stämmer|medan\s+Falskt|The statement is true|The statement is false|so the statement is true|that makes the statement true|That makes True correct|True is correct|False is correct|while False/i.test(
        `${question.explanationSv} ${question.explanationEn}`,
      ),
    )
    .map((question) => question.id);
  assert.deepEqual(trueExplanationOffenders, []);
});

test('derivePublishedQuestions renders q877/q878 human-rights true/false as direct propositions', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const trueStatementId = generatedQuestionId(sourceQuestions, 'q175', 'trueStatement');
  const falseStatementId = generatedQuestionId(sourceQuestions, 'q175', 'falseStatement');

  assert.equal(
    byId.get(trueStatementId)?.questionSv,
    'Mänskliga rättigheter gäller varje människa oavsett bakgrund eller livssituation.',
  );
  assert.equal(
    byId.get(trueStatementId)?.questionEn,
    'Human rights apply to every person regardless of background or life situation.',
  );
  assert.equal(byId.get(trueStatementId)?.correctOptionId, 'true');
  assert.equal(
    byId.get(falseStatementId)?.questionSv,
    'Mänskliga rättigheter gäller bara svenska medborgare.',
  );
  assert.equal(
    byId.get(falseStatementId)?.questionEn,
    'Human rights apply only to Swedish citizens.',
  );
  assert.equal(byId.get(falseStatementId)?.correctOptionId, 'false');

  const text = [byId.get(trueStatementId), byId.get(falseStatementId)]
    .map((question) => `${question?.questionSv} ${question?.questionEn}`)
    .join('\n');
  assert.doesNotMatch(
    text,
    /Att mänskliga rättigheter gäller alla betyder att|That human rights apply to everyone means/i,
  );
});

test('derivePublishedQuestions renders q050 source-criticism true/false as direct propositions', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const trueStatementId = generatedQuestionId(sourceQuestions, 'q050', 'trueStatement');
  const falseStatementId = generatedQuestionId(sourceQuestions, 'q050', 'falseStatement');

  assert.equal(
    byId.get(trueStatementId)?.questionSv,
    'Källkritik innebär att man ifrågasätter och kontrollerar om information är korrekt.',
  );
  assert.equal(
    byId.get(trueStatementId)?.questionEn,
    'Source criticism means questioning and checking whether information is correct.',
  );
  assert.equal(byId.get(trueStatementId)?.correctOptionId, 'true');
  assert.equal(
    byId.get(falseStatementId)?.questionSv,
    'Källkritik innebär att man aldrig läser nyheter.',
  );
  assert.equal(
    byId.get(falseStatementId)?.questionEn,
    'Source criticism means never reading news.',
  );
  assert.equal(byId.get(falseStatementId)?.correctOptionId, 'false');

  const text = [byId.get(trueStatementId), byId.get(falseStatementId)]
    .map((question) => `${question?.questionSv} ${question?.questionEn}`)
    .join('\n');
  assert.doesNotMatch(text, /^(?:Att vara källkritisk betyder|To be source-critical means)\b/im);
});

test('derivePublishedQuestions renders q062 public-sector English as direct propositions', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const source = byId.get('q062');
  const trueStatementId = generatedQuestionId(sourceQuestions, 'q062', 'trueStatement');
  const falseStatementId = generatedQuestionId(sourceQuestions, 'q062', 'falseStatement');

  assert.equal(source?.questionSv, 'Vad menas med offentlig sektor i Sverige?');
  assert.equal(source?.questionEn, 'What is the public sector in Sweden?');
  assert.equal(
    source?.explanationEn,
    'The public sector consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes. Examples include health-care staff, teachers, childcare workers, police, and firefighters; private companies, banks, and non-profit associations are therefore wrong answers.',
  );
  assert.equal(
    byId.get(trueStatementId)?.questionSv,
    'Offentlig sektor i Sverige är tjänster och verksamheter som staten, regionerna och kommunerna ansvarar för och finansierar med skatter.',
  );
  assert.equal(
    byId.get(trueStatementId)?.questionEn,
    'The public sector in Sweden consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes.',
  );
  assert.equal(byId.get(trueStatementId)?.correctOptionId, 'true');
  assert.equal(
    byId.get(falseStatementId)?.questionSv,
    'Offentlig sektor i Sverige är alla privatägda företag.',
  );
  assert.equal(
    byId.get(falseStatementId)?.questionEn,
    'The public sector in Sweden consists only of privately owned companies.',
  );
  assert.equal(byId.get(falseStatementId)?.correctOptionId, 'false');
  assert.equal(
    byId.get(generatedQuestionId(sourceQuestions, 'q062', 'judgement'))?.questionSv,
    'Vilken uppgift om offentlig sektor i Sverige stämmer?',
  );
  assert.equal(
    byId.get(generatedQuestionId(sourceQuestions, 'q062', 'judgement'))?.questionEn,
    "Which statement about Sweden's public sector is correct?",
  );

  const text = [
    source,
    byId.get(trueStatementId),
    byId.get(falseStatementId),
    byId.get(generatedQuestionId(sourceQuestions, 'q062', 'judgement')),
  ]
    .map((question) => `${question?.questionEn} ${question?.explanationEn}`)
    .join('\n');
  assert.doesNotMatch(
    text,
    /What is meant by the public sector|public sector(?: in Sweden)? means/i,
  );
});

test('derivePublishedQuestions renders q048 public-service broadcasters in natural English', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const source = byId.get('q048');
  const singleChoiceId = generatedQuestionId(sourceQuestions, 'q048', 'singleChoice');
  const trueStatementId = generatedQuestionId(sourceQuestions, 'q048', 'trueStatement');
  const falseStatementId = generatedQuestionId(sourceQuestions, 'q048', 'falseStatement');
  const judgementId = generatedQuestionId(sourceQuestions, 'q048', 'judgement');

  assert.equal(
    source?.questionEn,
    "Which three companies are Sweden's public service broadcasters?",
  );
  assert.equal(
    source?.explanationEn,
    "Swedish Radio (SR), Swedish Television (SVT), and Swedish Educational Broadcasting Company (UR) are Sweden's public service broadcasters. They have a special mission, should offer many types of programs, and are financed through a fee collected through the tax system; agencies, political bodies, and union confederations are therefore incorrect.",
  );
  assert.equal(
    byId.get(singleChoiceId)?.questionEn,
    "What is correct about Sweden's public service broadcasters?",
  );
  assert.equal(
    byId.get(trueStatementId)?.questionEn,
    "Swedish Radio (SR), Swedish Television (SVT), and Swedish Educational Broadcasting Company (UR) are Sweden's public service broadcasters.",
  );
  assert.equal(byId.get(trueStatementId)?.correctOptionId, 'true');
  assert.equal(
    byId.get(falseStatementId)?.questionEn,
    "The Police, Tax Agency, and Migration Agency are Sweden's public service broadcasters.",
  );
  assert.equal(byId.get(falseStatementId)?.correctOptionId, 'false');
  assert.equal(
    byId.get(judgementId)?.questionEn,
    "Which fact is correct about Sweden's public service broadcasters?",
  );

  const text = [
    source,
    byId.get(singleChoiceId),
    byId.get(trueStatementId),
    byId.get(falseStatementId),
    byId.get(judgementId),
  ]
    .map((question) => `${question?.questionEn} ${question?.explanationEn}`)
    .join('\n');
  assert.doesNotMatch(
    text,
    /called public service|which three companies are called public service/i,
  );
});

test('derivePublishedQuestions renders q058 national-minorities judgement naturally', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const source = byId.get('q058');
  const judgementId = generatedQuestionId(sourceQuestions, 'q058', 'judgement');
  const judgement = byId.get(judgementId);

  assert.equal(source?.questionSv, 'Vilka är Sveriges fem nationella minoriteter?');
  assert.equal(source?.questionEn, "Which groups are Sweden's five national minorities?");
  assert.equal(
    judgement?.questionSv,
    'Vilken uppgift stämmer om Sveriges fem nationella minoriteter?',
  );
  assert.equal(
    judgement?.questionEn,
    "Which fact is correct about Sweden's five national minorities?",
  );
  assert.doesNotMatch(
    `${judgement?.questionSv}\n${judgement?.questionEn}`,
    /när det gäller vilka|regarding which groups/i,
  );
});

test('derivePublishedQuestions keeps q128 holiday date options appositive', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const source = byId.get('q128');
  const singleChoiceId = generatedQuestionId(sourceQuestions, 'q128', 'singleChoice');
  const trueStatementId = generatedQuestionId(sourceQuestions, 'q128', 'trueStatement');
  const falseStatementId = generatedQuestionId(sourceQuestions, 'q128', 'falseStatement');
  const judgementId = generatedQuestionId(sourceQuestions, 'q128', 'judgement');

  assert.equal(source?.questionEn, 'When are Nouruz and Newroz celebrated?');
  assert.equal(
    source?.options.find((option) => option.id === 'a')?.textEn,
    'At the spring equinox on 21 March',
  );
  assert.equal(
    source?.options.find((option) => option.id === 'c')?.textEn,
    "On New Year's Eve, 31 December",
  );
  assert.equal(
    source?.options.find((option) => option.id === 'd')?.textEn,
    'On Lucia Day, 13 December',
  );
  assert.equal(byId.get(trueStatementId)?.correctOptionId, 'true');
  assert.equal(byId.get(falseStatementId)?.correctOptionId, 'false');

  for (const id of ['q128', singleChoiceId, judgementId]) {
    const question = byId.get(id);
    assert.ok(question, `${id} should exist`);
    assert.equal(
      question.options.find((option) => option.id === 'c')?.textEn,
      "On New Year's Eve, 31 December",
    );
    assert.equal(
      question.options.find((option) => option.id === 'd')?.textEn,
      'On Lucia Day, 13 December',
    );
  }

  const text = [source, byId.get(singleChoiceId), byId.get(judgementId)]
    .map(
      (question) =>
        `${question?.questionEn} ${question?.explanationEn} ${JSON.stringify(question?.options)}`,
    )
    .join('\n');
  assert.doesNotMatch(text, /New Year(?:’|')s Eve on 31 December/i);
  assert.doesNotMatch(text, /Lucia Day on 13 December/i);
});

test('derivePublishedQuestions renders q146 political-rights true/false as direct propositions', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const trueStatementId = generatedQuestionId(sourceQuestions, 'q146', 'trueStatement');
  const falseStatementId = generatedQuestionId(sourceQuestions, 'q146', 'falseStatement');

  assert.equal(
    byId.get(trueStatementId)?.questionSv,
    'I en demokrati får människor, grupper och partier försöka övertyga andra om sina politiska idéer.',
  );
  assert.equal(
    byId.get(trueStatementId)?.questionEn,
    'In a democracy, people, groups, and parties may try to persuade others of their political ideas.',
  );
  assert.equal(byId.get(trueStatementId)?.correctOptionId, 'true');
  assert.equal(
    byId.get(falseStatementId)?.questionSv,
    'I en demokrati får människor, grupper och partier inte hindra andra från att rösta.',
  );
  assert.equal(
    byId.get(falseStatementId)?.questionEn,
    'In a democracy, people, groups, and parties may not stop others from voting.',
  );
  assert.equal(byId.get(falseStatementId)?.correctOptionId, 'false');

  const text = [byId.get(trueStatementId), byId.get(falseStatementId)]
    .map((question) => `${question?.questionSv} ${question?.questionEn}`)
    .join('\n');
  assert.doesNotMatch(text, /^(?:Försöka övertyga|Hindra andra|Try to persuade|Stop others)/im);
});

test('derivePublishedQuestions renders q178 disability-rights aim true/false with scope', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const trueStatementId = generatedQuestionId(sourceQuestions, 'q178', 'trueStatement');
  const falseStatementId = generatedQuestionId(sourceQuestions, 'q178', 'falseStatement');

  assert.equal(
    byId.get(trueStatementId)?.questionSv,
    'Ett mål med arbetet för personer med funktionsnedsättning är att samhället ska vara tillgängligt så att människor kan delta på jämlika villkor.',
  );
  assert.equal(
    byId.get(trueStatementId)?.questionEn,
    'One aim of disability rights work is that society should be accessible so people can participate on equal terms.',
  );
  assert.equal(byId.get(trueStatementId)?.correctOptionId, 'true');
  assert.equal(
    byId.get(falseStatementId)?.questionSv,
    'Ett mål med arbetet för personer med funktionsnedsättning är att personer med funktionsnedsättning inte ska kunna studera eller arbeta.',
  );
  assert.equal(
    byId.get(falseStatementId)?.questionEn,
    'One aim of disability rights work is that people with disabilities should not be able to study or work.',
  );
  assert.equal(byId.get(falseStatementId)?.correctOptionId, 'false');

  const text = [byId.get(trueStatementId), byId.get(falseStatementId)]
    .map((question) => question?.questionEn)
    .join('\n');
  assert.doesNotMatch(
    text,
    /^(?:Society should be accessible|People with disabilities should not be able to study or work)/im,
  );
});

test('derivePublishedQuestions cleans residual generated true/false splice rows', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));

  const expectedRows = {
    [generatedQuestionId(sourceQuestions, 'q016', 'trueStatement')]: [
      'Medborgarna väljer ledamöter till riksdagen i Sveriges parlamentariska representativa demokrati genom att rösta i allmänna val.',
      "Citizens choose members of the Riksdag in Sweden's parliamentary representative democracy by voting in general elections.",
    ],
    [generatedQuestionId(sourceQuestions, 'q032', 'trueStatement')]: [
      'En anledning till att väljare röstar bakom en skärm i vallokalen är att valet är hemligt och ingen annan ska se vilket val de gör.',
      'One reason voters vote behind a screen at the polling station is that the vote is secret and no one else should see their choice.',
    ],
    [generatedQuestionId(sourceQuestions, 'q032', 'falseStatement')]: [
      'En anledning till att väljare röstar bakom en skärm i vallokalen är att rösterna ska räknas snabbare.',
      'One reason voters vote behind a screen at the polling station is that votes are counted faster.',
    ],
    [generatedQuestionId(sourceQuestions, 'q044', 'trueStatement')]: [
      'Från 15 år är en person i Sverige enligt huvudregeln straffmyndig och kan bli åtalad för brott.',
      'A person in Sweden is criminally responsible and able to be prosecuted for a crime under the main rule from age 15.',
    ],
    [generatedQuestionId(sourceQuestions, 'q044', 'falseStatement')]: [
      'Från 13 år är en person i Sverige enligt huvudregeln straffmyndig och kan bli åtalad för brott.',
      'A person in Sweden is criminally responsible and able to be prosecuted for a crime under the main rule from age 13.',
    ],
    [generatedQuestionId(sourceQuestions, 'q046', 'trueStatement')]: [
      'Offentlighetsprincipen underlättar granskning av myndigheter genom att allmänna handlingar kan begäras ut om de inte omfattas av sekretess.',
      'The principle of public access makes it easier to scrutinize authorities by allowing public documents to be requested unless they are covered by secrecy rules.',
    ],
    [generatedQuestionId(sourceQuestions, 'q051', 'trueStatement')]: [
      'Förenta nationerna bildades efter andra världskriget för att förhindra krig och skydda människors rättigheter.',
      'The United Nations was created after the Second World War to prevent war and protect human rights.',
    ],
    [generatedQuestionId(sourceQuestions, 'q051', 'falseStatement')]: [
      'Förenta nationerna bildades efter andra världskriget för att bestämma svenska kommunalskatter.',
      'The United Nations was created after the Second World War to decide Swedish municipal taxes.',
    ],
    [generatedQuestionId(sourceQuestions, 'q052', 'trueStatement')]: [
      'FN:s förklaring om de mänskliga rättigheterna presenterades 1948 och innehåller 30 artiklar.',
      'The UN Universal Declaration of Human Rights was presented in 1948 and contains 30 articles.',
    ],
    [generatedQuestionId(sourceQuestions, 'q052', 'falseStatement')]: [
      'FN:s förklaring om de mänskliga rättigheterna presenterades 1918 och gäller bara Europa.',
      'The UN Universal Declaration of Human Rights was presented in 1918 and applies only to Europe.',
    ],
    [generatedQuestionId(sourceQuestions, 'q054', 'trueStatement')]: [
      'Våld i nära relationer och hedersrelaterat våld och förtryck i Sverige är brottsligt enligt svensk lag.',
      'Violence in close relationships and honour-related violence and oppression in Sweden are crimes under Swedish law.',
    ],
    [generatedQuestionId(sourceQuestions, 'q054', 'falseStatement')]: [
      'Våld i nära relationer och hedersrelaterat våld och förtryck i Sverige är alltid en privat familjefråga och inte ett brott.',
      'Violence in close relationships and honour-related violence and oppression in Sweden are always private family matters and not crimes.',
    ],
    [generatedQuestionId(sourceQuestions, 'q057', 'falseStatement')]: [
      'År 1979 beslutade Sverige som första land i världen att barnkonventionen blev svensk lag.',
      'In 1979, Sweden was the first country in the world to decide that the Convention on the Rights of the Child became Swedish law.',
    ],
    [generatedQuestionId(sourceQuestions, 'q058', 'trueStatement')]: [
      'Sveriges fem nationella minoriteter är judar, romer, samer, sverigefinnar och tornedalingar.',
      "Sweden's five national minorities are Jews, Roma, Sami, Sweden Finns, and Tornedalians.",
    ],
    [generatedQuestionId(sourceQuestions, 'q058', 'falseStatement')]: [
      'Sveriges fem nationella minoriteter är danskar, norrmän, islänningar, tyskar och fransmän.',
      "Sweden's five national minorities are Danes, Norwegians, Icelanders, Germans, and French.",
    ],
    [generatedQuestionId(sourceQuestions, 'q064', 'trueStatement')]: [
      'Fackförbund företräder arbetstagare, förhandlar om löner och kan hjälpa medlemmar.',
      'Trade unions represent employees, negotiate wages, and can help members.',
    ],
    [generatedQuestionId(sourceQuestions, 'q064', 'falseStatement')]: [
      'Fackförbund bestämmer vilka som får rösta i riksdagsval.',
      'Trade unions decide who may vote in Riksdag elections.',
    ],
    [generatedQuestionId(sourceQuestions, 'q066', 'trueStatement')]: [
      'Lagar på arbetsmarknaden i Sverige finns för att skydda anställdas rättigheter och bidra till en trygg arbetsmiljö.',
      'Sweden has labour-market laws to protect employees’ rights and help create a safe work environment.',
    ],
    [generatedQuestionId(sourceQuestions, 'q066', 'falseStatement')]: [
      'Lagar på arbetsmarknaden i Sverige finns för att bestämma vem som blir statschef.',
      'Sweden has labour-market laws to decide who becomes head of state.',
    ],
    [generatedQuestionId(sourceQuestions, 'q067', 'falseStatement')]: [
      'A-kassan är en myndighet som kontrollerar arbetsmiljöer.',
      'A-kassan is a government agency that inspects work environments.',
    ],
    [generatedQuestionId(sourceQuestions, 'q076', 'trueStatement')]: [
      'Sveriges befolkning ökade under 1800-talet på grund av bättre jordbruksmetoder och medicinska framsteg.',
      'Sweden’s population grew during the 19th century because of better farming methods and medical advances.',
    ],
    [generatedQuestionId(sourceQuestions, 'q076', 'falseStatement')]: [
      'Sveriges befolkning ökade under 1800-talet på grund av EU-medlemskapet.',
      'Sweden’s population grew during the 19th century because of EU membership.',
    ],
    [generatedQuestionId(sourceQuestions, 'q078', 'trueStatement')]: [
      'Förändringen genom den nya grundlagen år 1809 var att kungens makt begränsades.',
      'The change through the new constitution in 1809 was that the king’s power was limited.',
    ],
    [generatedQuestionId(sourceQuestions, 'q081', 'trueStatement')]: [
      'Saltsjöbadsavtalet från 1938 blev viktigt för samarbetet mellan fackföreningar och arbetsgivare.',
      'The 1938 Saltsjöbaden Agreement was important for cooperation between trade unions and employers.',
    ],
    [generatedQuestionId(sourceQuestions, 'q082', 'trueStatement')]: [
      'Tiden efter andra världskriget kallas ofta de svenska rekordåren eftersom Sverige hade långvarig stark ekonomisk tillväxt och kunde genomföra stora reformer.',
      'The period after the Second World War is often called the Swedish record years because Sweden had sustained strong economic growth and could carry out major reforms.',
    ],
    [generatedQuestionId(sourceQuestions, 'q082', 'falseStatement')]: [
      'Tiden efter andra världskriget kallas ofta de svenska rekordåren eftersom Sverige saknade nästan all industri.',
      'The period after the Second World War is often called the Swedish record years because Sweden had almost no industry.',
    ],
    [generatedQuestionId(sourceQuestions, 'q084', 'falseStatement')]: [
      'Den digitala revolutionen har bara förändrat hur människor firar midsommar.',
      'The digital revolution has only changed how people celebrate Midsummer.',
    ],
    [generatedQuestionId(sourceQuestions, 'q088', 'falseStatement')]: [
      'Europarådet arbetar endast för jordbrukspolitik.',
      'The Council of Europe promotes only agricultural policy.',
    ],
    [generatedQuestionId(sourceQuestions, 'q079', 'trueStatement')]: [
      'Arbetarrörelsen, frikyrkorörelsen, kvinnorörelsen och nykterhetsrörelsen var bland de största folkrörelserna i Sverige under 1800-talet.',
      'The labour movement, free church movement, women’s movement, and temperance movement were among the largest popular movements in Sweden during the 19th century.',
    ],
    [generatedQuestionId(sourceQuestions, 'q085', 'trueStatement')]: [
      'Sveriges nordiska samarbete sker främst genom Nordiska rådet och Nordiska ministerrådet.',
      "Sweden's Nordic cooperation mainly takes place through the Nordic Council and the Nordic Council of Ministers.",
    ],
    [generatedQuestionId(sourceQuestions, 'q090', 'trueStatement')]: [
      'Sverige och Finland valde att nästan samtidigt ansöka om medlemskap i Nato efter Rysslands attack mot Ukraina 2022.',
      "Sweden and Finland chose to apply for NATO membership at almost the same time after Russia's attack on Ukraine in 2022.",
    ],
    [generatedQuestionId(sourceQuestions, 'q096', 'trueStatement')]: [
      'Islam beskrivs som den näst största religionen i Sverige.',
      'Islam is described as the second-largest religion in Sweden.',
    ],
    [generatedQuestionId(sourceQuestions, 'q096', 'falseStatement')]: [
      'Judendom beskrivs som den näst största religionen i Sverige.',
      'Judaism is described as the second-largest religion in Sweden.',
    ],
    [generatedQuestionId(sourceQuestions, 'q097', 'trueStatement')]: [
      'På nyårsafton den 31 december är det vanligt att fira med fester och middagar och på natten med fyrverkerier.',
      'On New Year’s Eve, 31 December, it is common to celebrate with parties and dinners and at night with fireworks.',
    ],
    [generatedQuestionId(sourceQuestions, 'q097', 'falseStatement')]: [
      'På nyårsafton den 31 december är det vanligt med stora brasor och vårsånger.',
      'On New Year’s Eve, 31 December, large bonfires and spring songs are common.',
    ],
    [generatedQuestionId(sourceQuestions, 'q098', 'falseStatement')]: [
      'På Sveriges nationaldag den 6 juni brukar arbetarrörelsen arrangera demonstrationer.',
      'On Sweden’s National Day, 6 June, the labour movement arranges demonstrations.',
    ],
    [generatedQuestionId(sourceQuestions, 'q100', 'trueStatement')]: [
      'Luciafirandet handlar mycket om att sprida ljus när året är som mörkast.',
      'The Lucia celebration is largely about spreading light when the year is at its darkest.',
    ],
    [generatedQuestionId(sourceQuestions, 'q100', 'falseStatement')]: [
      'Luciafirandet handlar mycket om att välkomna våren med stora brasor.',
      'The Lucia celebration is largely about welcoming spring with large bonfires.',
    ],
    [generatedQuestionId(sourceQuestions, 'q102', 'trueStatement')]: [
      'Typiskt för valborgsmässoafton den 30 april är brasor, vårsånger och ibland ett tal till våren.',
      'Bonfires, spring songs, and sometimes a speech welcoming spring are typical of Walpurgis Night, 30 April.',
    ],
    [generatedQuestionId(sourceQuestions, 'q105', 'trueStatement')]: [
      'Advent infaller de fyra söndagarna före juldagen den 25 december.',
      'Advent occurs on the four Sundays before Christmas Day, 25 December.',
    ],
    [generatedQuestionId(sourceQuestions, 'q105', 'falseStatement')]: [
      'Advent infaller en lördag i slutet av oktober eller början av november.',
      'Advent occurs on a Saturday at the end of October or beginning of November.',
    ],
    [generatedQuestionId(sourceQuestions, 'q108', 'trueStatement')]: [
      'På olika platser i Sverige finns buddhistiska och hinduiska församlingar och tempel för buddhister och hinduer.',
      'In different places in Sweden, there are Buddhist and Hindu congregations and temples for Buddhists and Hindus.',
    ],
    [generatedQuestionId(sourceQuestions, 'q114', 'trueStatement')]: [
      'Resor till Asien och ökat intresse för meditation och yoga bidrog till kontakter med hinduer och buddhister i Sverige under 1900-talet.',
      'Travel to Asia and increased interest in meditation and yoga contributed to contacts with Hindus and Buddhists in Sweden during the 20th century.',
    ],
    [generatedQuestionId(sourceQuestions, 'q114', 'falseStatement')]: [
      'Byggandet av Sveriges första moskéer under 1970-talet bidrog till kontakter med hinduer och buddhister i Sverige under 1900-talet.',
      "The building of Sweden's first mosques during the 1970s contributed to contacts with Hindus and Buddhists in Sweden during the 20th century.",
    ],
    [generatedQuestionId(sourceQuestions, 'q116', 'trueStatement')]: [
      'Regeringsformen skyddar rätten att utöva sin religion och att skyddas mot diskriminering på grund av tro.',
      'The Instrument of Government protects the right to practice one’s religion and to be protected from discrimination because of belief.',
    ],
    [generatedQuestionId(sourceQuestions, 'q116', 'falseStatement')]: [
      'Regeringsformen låter staten välja religion åt varje invånare.',
      'The Instrument of Government lets the state choose a religion for each resident.',
    ],
    [generatedQuestionId(sourceQuestions, 'q117', 'trueStatement')]: [
      'Jul och påsk är kristna högtider som många svenskar firar även om de inte ser sig som religiösa.',
      'Christmas and Easter are Christian holidays that many Swedes celebrate even if they do not see themselves as religious.',
    ],
    [generatedQuestionId(sourceQuestions, 'q117', 'falseStatement')]: [
      'Id al-fitr och Newroz är kristna högtider som många svenskar firar även om de inte ser sig som religiösa.',
      'Eid al-Fitr and Newroz are Christian holidays that many Swedes celebrate even if they do not see themselves as religious.',
    ],
    [generatedQuestionId(sourceQuestions, 'q120', 'trueStatement')]: [
      'Judar fick rätt att bo i Sverige och utöva sin religion.',
      'Jews gained the right to live in Sweden and practice their religion.',
    ],
    [generatedQuestionId(sourceQuestions, 'q128', 'trueStatement')]: [
      'Nouruz och Newroz firas vid vårdagjämningen den 21 mars.',
      'Nouruz and Newroz are observed at the spring equinox on 21 March.',
    ],
    [generatedQuestionId(sourceQuestions, 'q130', 'falseStatement')]: [
      'Gudstjänsten tidigt på morgonen den 25 december kallas ett luciatåg.',
      'The church service early on the morning of 25 December is called a Lucia procession.',
    ],
    [generatedQuestionId(sourceQuestions, 'q129', 'trueStatement')]: [
      'Lucia brukar bära en ljuskrona på huvudet.',
      'Lucia usually wears a crown of lights on her head.',
    ],
    [generatedQuestionId(sourceQuestions, 'q129', 'falseStatement')]: [
      'Lucia brukar bära en blomsterkrans på huvudet.',
      'Lucia usually wears a flower wreath on her head.',
    ],
    [generatedQuestionId(sourceQuestions, 'q131', 'trueStatement')]: [
      'På påskafton är det vanligt att äta ägg, lamm, lax och sill och att barn får godis i påskägg.',
      'On Easter Saturday, it is common to eat eggs, lamb, salmon, and herring, and for children to get candy in Easter eggs.',
    ],
    [generatedQuestionId(sourceQuestions, 'q131', 'falseStatement')]: [
      'På påskafton är det vanligt att tända adventsljus och öppna adventskalendrar.',
      'On Easter Saturday, it is common to light Advent candles and open Advent calendars.',
    ],
    [generatedQuestionId(sourceQuestions, 'q132', 'trueStatement')]: [
      'Barn med en adventskalender hemma öppnar en lucka varje dag fram till julafton.',
      'Children with an Advent calendar at home often open one door each day until Christmas Eve.',
    ],
    [generatedQuestionId(sourceQuestions, 'q132', 'falseStatement')]: [
      'Under advent tänder barn stora brasor på kvällen.',
      'During Advent, children often light large bonfires in the evening.',
    ],
    [generatedQuestionId(sourceQuestions, 'q139', 'trueStatement')]: [
      'Julen firar traditionellt Jesu födelse inom kristendomen.',
      "Christmas traditionally celebrates Jesus' birth in Christianity.",
    ],
    [generatedQuestionId(sourceQuestions, 'q139', 'falseStatement')]: [
      'Julen firar traditionellt vårens ankomst inom kristendomen.',
      'Christmas traditionally celebrates the arrival of spring in Christianity.',
    ],
    [generatedQuestionId(sourceQuestions, 'q170', 'trueStatement')]: [
      'Tryckfrihetsförordningen skyddar det fria ordet i tryckt form och rätten att ge ut böcker, tidningar och tidskrifter.',
      'The Freedom of the Press Act protects free expression in printed form and the right to publish books, newspapers, and magazines.',
    ],
    [generatedQuestionId(sourceQuestions, 'q170', 'falseStatement')]: [
      'Tryckfrihetsförordningen ger staten rätt att förhandsgranska alla privata brev.',
      'The Freedom of the Press Act gives the state the right to pre-screen all private letters.',
    ],
    [generatedQuestionId(sourceQuestions, 'q171', 'trueStatement')]: [
      'Yttrandefrihetsgrundlagen ger alla rätt att uttrycka tankar och åsikter fritt, till exempel i radio, tv och dagstidningar.',
      'The Fundamental Law on Freedom of Expression gives everyone the right to express thoughts and opinions freely, for example on radio, TV, and in newspapers.',
    ],
    [generatedQuestionId(sourceQuestions, 'q171', 'falseStatement')]: [
      'Yttrandefrihetsgrundlagen gör alla yttranden lagliga oavsett innehåll.',
      'The Fundamental Law on Freedom of Expression makes every expression legal regardless of content.',
    ],
    [generatedQuestionId(sourceQuestions, 'q173', 'trueStatement')]: [
      'Under en rättegång har en åtalad person rätt till en försvarsadvokat som kan ifrågasätta åklagarens bevis och lägga fram egna bevis.',
      'During a trial, the accused person has the right to a defence lawyer who can question the prosecutor’s evidence and present evidence of their own.',
    ],
    [generatedQuestionId(sourceQuestions, 'q173', 'falseStatement')]: [
      'Under en rättegång har en åtalad person rätt att ensam välja domare och nämndemän.',
      'During a trial, the accused person has the right to choose the judge and lay judges alone.',
    ],
  };

  for (const [id, [questionSv, questionEn]] of Object.entries(expectedRows)) {
    assertQuestionTextPresent(questions, questionSv, questionEn, id);
  }

  const residualQuestions = questions.filter(
    (question) => question.type === 'true_false' && question.tags.includes('published-variant'),
  );
  const residualText = residualQuestions
    .map((question) => `${question.questionSv} ${question.questionEn}`)
    .join('\n');

  assert.doesNotMatch(
    residualText,
    /Det stämmer i sak att|It is factually true that|describes (?:government agencies|legal certainty|the role|an important role|Sweden two hundred years ago)|beskriver (?:statliga myndigheter|rättssäkerhet|polisens uppgift|en viktig uppgift|Sverige för tvåhundra år sedan)|is the list that contains|är listan som innehåller|about public power in Sweden|om offentlig makt i Sverige|means it gives|innebär att den ger|from (?:13|15) years|One reason is to (?:prevent war|decide Swedish municipal taxes|protect employees|decide who becomes head of state)|^One reason is\b|^En anledning är\b|One reason is (?:better farming methods|eU membership|EU membership|the vote is secret|votes are counted faster)|En anledning är(?: att)? (?:förhindra krig|bestämma svenska kommunalskatter|skydda anställdas rättigheter|bestämma vem som blir statschef|bättre jordbruksmetoder|EU-medlemskapet|valet är hemligt|rösterna ska räknas snabbare)|It was presented in (?:1918|1948)|Den presenterades (?:1918|1948)|One reason is that so|One reason is that Sweden had|En anledning är att Sverige (?:hade|saknade)|have they|har de|applies to|gäller för|common to (?:eating|lighting|opening|holding)|har förändrat bara hur|has changed only how|arbetar för endast|works for only|den näst största i Sverige|the second largest in Sweden|,\s*,|it is common to large bonfires|brukar [^.?!]* arrangerar|spreadinging|welcominging|Advent occurs (?:the four Sundays|a Saturday)|Travel to Asia and increased interest[^.?!]*\bis mentioned|^That Sweden's first mosques were built|skyddar rätten [^.?!]* och skydd mot|protects the right [^.?!]* and protection from|skyddar att staten väljer|protects that the state chooses|^(?:Rätten för staten|Uttrycka tankar|Rätt till|Den gör|Free expression in printed form|Express thoughts|The right to|It makes)\b|Många svenskar firar id al-fitr och Newroz även om|Many Swedes celebrate Eid al-Fitr and Newroz even if|fick rätt att bo i landet och utöva|gained the right to live in the country and practice|called Lucia procession|^En (?:ljuskrona|blomsterkrans) på huvudet|(?:fram till julafton|på kvällen)\s+med en adventskalender hemma|(?:until Christmas Eve|in the evening)\s+with an Advent calendar at home|^Det är (?:brottsligt enligt svensk lag|alltid en privat familjefråga)|^Sverige beslutade att barnkonventionen blev svensk lag|^(?:De|They) (?:företräder|bestämmer|represent|decide)|^En myndighet som|^An authority that/im,
  );
  assert.doesNotMatch(
    residualText,
    /att Kungens makt|för Samarbetet mellan|for Cooperation between/,
  );
  residualQuestions.forEach((question) => {
    assert.doesNotMatch(question.questionSv, /är (?:Judar|Danskar),/, question.id);
    assert.doesNotMatch(question.questionEn, /celebrates The/, question.id);
    assert.doesNotMatch(
      question.questionSv,
      /firar traditionellt (?!Jesu födelse\b)[A-ZÅÄÖ]|firar traditionellt jesu födelse/,
      question.id,
    );
    assert.doesNotMatch(question.questionEn, /celebrates jesus' birth/, question.id);
    assert.doesNotMatch(question.questionEn, /there are buddhist and Hindu/, question.id);
    assert.doesNotMatch(question.questionEn, /^(?:By|Apply|Leave|Live)\b/i, question.id);
    assert.doesNotMatch(
      question.questionEn,
      /^(?:They\s+(?:sell|are|may|can|must)|Through)\b|\bthere\.$/i,
      question.id,
    );
    assert.doesNotMatch(
      question.questionSv,
      /^(?:Genom att|Representera\b|Arbeta\s|Bo i landet|Lämna Svenska|Samarbetet mellan|Nordiska rådet|Riksdagen och|Islam\.|Jul\.|Påsk\.|Julotta\.|Bön,|[0-9]{4}\.)/i,
      question.id,
    );
    assert.doesNotMatch(
      question.questionSv,
      /^(?:De\s+(?:säljer|drivs|får|finns|kan|måste)|Genom)\b|\bdär\.$/i,
      question.id,
    );
  });
});

test('derivePublishedQuestions rewrites definition-style true/false variants as direct propositions', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const { sourceQuestions } = loadTs('data/questions.ts');
  const generatedQuestions = derivePublishedQuestions(sourceQuestions, sourceQuestions.length + 1);
  const generatedVariant = (sourceId, variantOffset) => {
    const sourceIndex = sourceQuestions.findIndex((question) => question.id === sourceId);
    assert.notEqual(sourceIndex, -1, `missing source fixture ${sourceId}`);
    return generatedQuestions[sourceIndex * 4 + variantOffset];
  };
  const expectedRows = [
    [
      'q027',
      1,
      'I Sveriges konstitutionella monarki är statschefen kung eller drottning utan politisk makt.',
      "In Sweden's constitutional monarchy, the head of state is a king or queen without political power.",
    ],
    [
      'q027',
      2,
      'I Sveriges konstitutionella monarki har monarken all politisk makt.',
      "In Sweden's constitutional monarchy, the monarch has all political power.",
    ],
    [
      'q092',
      1,
      'Sverige är en sekulär stat, så staten är religiöst neutral och varken tar ställning för eller diskriminerar någon religion.',
      'Sweden is a secular state, so the state is religiously neutral and neither takes sides for nor discriminates against any religion.',
    ],
    [
      'q092',
      2,
      'Sverige är en sekulär stat, så alla måste tillhöra samma religion.',
      'Sweden is a secular state, so everyone must belong to the same religion.',
    ],
    [
      'q145',
      1,
      'Hemliga val betyder att väljare inte behöver avslöja hur de röstar.',
      'Secret elections mean voters do not have to reveal how they vote.',
    ],
    [
      'q145',
      2,
      'Hemliga val betyder att bara myndigheter får veta hur varje person röstar.',
      'Secret elections mean only authorities may know how each person votes.',
    ],
  ];

  for (const [sourceId, variantOffset, questionSv, questionEn] of expectedRows) {
    const question = generatedVariant(sourceId, variantOffset);
    assert.equal(question.questionSv, questionSv);
    assert.equal(question.questionEn, questionEn);
  }

  const residualText = expectedRows
    .map(([sourceId, variantOffset]) => {
      const question = generatedVariant(sourceId, variantOffset);
      return `${question.questionSv}\n${question.questionEn}`;
    })
    .join('\n');
  assert.doesNotMatch(
    residualText,
    /^(?:Att (?:Sverige är (?:en konstitutionell monarki|en sekulär stat)|val i en demokrati är hemliga) betyder att|That (?:Sweden is (?:a constitutional monarchy|a secular state)|elections in a democracy are secret) means\b)/im,
  );
});

test('derivePublishedQuestions keeps q115 religious-freedom 1860 English natural', () => {
  const { derivePublishedQuestions } = loadTs('lib/content/derivedQuestions.ts');
  const { sourceQuestions } = loadTs('data/questions.ts');
  const generatedQuestions = derivePublishedQuestions(sourceQuestions, sourceQuestions.length + 1);
  const sourceIndex = sourceQuestions.findIndex((question) => question.id === 'q115');
  assert.notEqual(sourceIndex, -1, 'missing q115 source fixture');
  const [singleChoiceVariant, , falseStatementVariant, judgementVariant] = generatedQuestions.slice(
    sourceIndex * 4,
    sourceIndex * 4 + 4,
  );

  assert.equal(
    sourceQuestions[sourceIndex].options.find((option) => option.id === 'b')?.textEn,
    'To freely choose any religion or none',
  );
  assert.equal(
    singleChoiceVariant.options.find((option) => option.id === 'b')?.textEn,
    'To freely choose any religion or none',
  );
  assert.equal(
    falseStatementVariant.questionEn,
    'In 1860, Swedes were free to choose any religion or none.',
  );
  assert.equal(
    judgementVariant.options.find((option) => option.id === 'b')?.textEn,
    'To freely choose any religion or none',
  );
});
