const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const {
  generatedQuestionNumberRange,
  generatedTrueFalseResidualQuestions,
  questionNumber,
} = require('../tests/generatedQuestionRangeHelpers');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();
const { generatedQuestionId } = require('./generated-question-fixture-ids');

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

function extractFunctionSlice(source, functionName, nextFunctionName) {
  const start = source.indexOf(`function ${functionName}`);
  assert.notEqual(start, -1, `${functionName} should exist`);
  const end = source.indexOf(`function ${nextFunctionName}`, start + 1);
  assert.notEqual(end, -1, `${nextFunctionName} should follow ${functionName}`);
  return source.slice(start, end);
}

function civicStatementPromptPatterns(source, functionName, nextFunctionName) {
  return [
    ...extractFunctionSlice(source, functionName, nextFunctionName).matchAll(
      /\bq\.match\((\/(?:\\.|[^/])+\/[dgimsuy]*)\)/g,
    ),
  ].map((match) => match[1]);
}

test('validate-content mirrors production civic statement prompt patterns', () => {
  const productionSource = fs.readFileSync(
    path.join(repoRoot, 'lib/content/derivedQuestions.ts'),
    'utf8',
  );
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );

  const svProductionPatterns = civicStatementPromptPatterns(
    productionSource,
    'civicStatementSv',
    'civicStatementEn',
  );
  const svValidatorPatterns = civicStatementPromptPatterns(
    validatorSource,
    'civicStatementSv',
    'civicStatementEn',
  );
  const enProductionPatterns = civicStatementPromptPatterns(
    productionSource,
    'civicStatementEn',
    'buildSingleChoiceVariant',
  );
  const enValidatorPatterns = civicStatementPromptPatterns(
    validatorSource,
    'civicStatementEn',
    'correctOption',
  );

  assert.ok(svProductionPatterns.length > 100, 'Swedish mirror should cover source shapes');
  assert.ok(enProductionPatterns.length > 100, 'English mirror should cover source shapes');
  assert.deepEqual(svValidatorPatterns, svProductionPatterns);
  assert.deepEqual(enValidatorPatterns, enProductionPatterns);
});

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
  assert.equal(derived[1].questionSv, 'Sverige ligger i Norden.');
  assert.equal(derived[1].questionEn, 'Sweden is located in the Nordic region.');
  assert.equal(derived[2].questionSv, 'Sverige ligger i Asien.');
  assert.equal(derived[2].questionEn, 'Sweden is located in Asia.');
  assert.equal(derived[3].questionSv, 'Välj rätt alternativ: Var ligger Sverige?');
  assert.equal(derived[3].questionEn, 'Choose the correct option: Where is Sweden located?');
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
  assert.equal(derived[0].questionSv, 'Vilket påstående är korrekt om Sverige?');
  assert.equal(derived[0].questionEn, 'Which statement is correct about Sweden?');
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
  assert.equal(derived[3].questionSv, 'Vilket påstående stämmer bäst om Sverige?');
  assert.equal(derived[3].questionEn, 'Which statement best matches Sweden?');
  assert.ok(
    singleChoiceVariants.every(
      (question) =>
        !/Påståendet är sant|alternativet Sant|medan Falskt|That makes True correct|while False/i.test(
          `${question.explanationSv} ${question.explanationEn}`,
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
      id: 'q034',
      chapterId: 'ch04',
      type: 'single_choice',
      questionSv: 'Vad händer i ett proportionellt val om ett parti får 20 procent av rösterna?',
      questionEn:
        'What happens in a proportional election if a party receives 20 percent of the votes?',
      options: [
        {
          id: 'a',
          textSv: 'Partiet får 20 procent av platserna',
          textEn: 'The party receives 20 percent of the seats',
        },
        {
          id: 'b',
          textSv: 'Partiet får alla platser',
          textEn: 'The party receives all seats',
        },
        {
          id: 'c',
          textSv: 'Partiet får inga platser oavsett röstandel',
          textEn: 'The party receives no seats regardless of vote share',
        },
        {
          id: 'd',
          textSv: 'Partiet får platser först om regeringen godkänner det',
          textEn: 'The party receives seats only if the government approves it',
        },
      ],
      correctOptionId: 'a',
      explanationSv: 'I proportionella val får partier platser utifrån sin andel av rösterna.',
      explanationEn:
        'In proportional elections, parties receive seats based on their share of the votes.',
      uhrReference: {
        chapter: 'Politiska val och partier',
        section: 'Proportionella val',
        pageApprox: 15,
      },
      difficulty: 'medium',
      reviewStatus: 'reviewed',
      tags: ['proportional-elections'],
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
    'I ett proportionellt val får ett parti som får 20 procent av rösterna 20 procent av platserna.',
  );
  assert.equal(
    derived[13].questionEn,
    'In a proportional election, a party that receives 20 percent of the votes receives 20 percent of the seats.',
  );
  assert.equal(
    derived[14].questionSv,
    'I ett proportionellt val får ett parti som får 20 procent av rösterna alla platser.',
  );
  assert.equal(
    derived[14].questionEn,
    'In a proportional election, a party that receives 20 percent of the votes receives all seats.',
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
      questionEn: "What is the foremost task of Sweden's regions?",
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
      questionEn: "Which are Sweden's three largest lakes?",
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
          textEn: 'Contact politicians, demonstrate, or sign a petition',
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
  const generatedTrueFalse = derived.filter((question) => question.type === 'true_false');
  const text = generatedTrueFalse
    .map((question) => `${question.questionSv} ${question.questionEn}`)
    .join('\n');

  assert.doesNotMatch(
    text,
    /Det att|describes that|describes government agencies|It is correct that the answer is|regions's foremost task is be|is an example of municipal responsibilities|has one vote each is part of|may stand for election is part of|har en röst var ingår|får ställa upp ingår|is a way to|applies to|gäller för|is the list that contains|about public power in Sweden|means it gives|One reason is\b|En anledning är\b|have they|har de/i,
  );
  assert.doesNotMatch(text, /are The/);
  assert.ok(
    text.includes(
      'Att folkomröstningar i Sverige är rådgivande betyder att politikerna måste inte följa resultatet.',
    ),
  );
  assert.ok(
    text.includes(
      'That referendums in Sweden are advisory means politicians do not have to follow the result.',
    ),
  );
  assert.ok(
    text.includes("The foremost task of Sweden's regions is to be responsible for health care."),
  );
  assert.ok(
    text.includes(
      'Water and sewage, care services, snow removal, park maintenance, and adult education belong among municipal responsibilities.',
    ),
  );
  assert.ok(
    text.includes("Sweden's three largest lakes are the Baltic Sea, Kattegat, and Skagerrak."),
  );
  assert.ok(
    text.includes(
      'A feature of free elections in a democracy is that everyone who has the right to vote has one vote each.',
    ),
  );
  assert.ok(
    text.includes(
      'One way to influence and participate in society is to contact politicians, demonstrate, or sign a petition.',
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

test('derivePublishedQuestions writes direct source true/false propositions', () => {
  const { questions, sourceQuestions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));
  const sourceQ002 = sourceQuestions.find((question) => question.id === 'q002');
  assert.ok(sourceQ002, 'q002 source question should exist');
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
    [generatedQuestionId(sourceQuestions, 'q146', 'trueStatement')]: [
      'I en demokrati har människor, grupper och partier rätt att försöka övertyga andra om sina politiska idéer.',
      'In a democracy, people, groups, and parties have the right to try to persuade others of their political ideas.',
    ],
    [generatedQuestionId(sourceQuestions, 'q146', 'falseStatement')]: [
      'I en demokrati har människor, grupper och partier rätt att hindra andra från att rösta.',
      'In a democracy, people, groups, and parties have the right to stop others from voting.',
    ],
    [generatedQuestionId(sourceQuestions, 'q147', 'trueStatement')]: [
      'Demokratin blir starkare när många röstar, engagerar sig och skaffar kunskap om samhällsfrågor.',
      'Democracy becomes stronger when many people vote, get involved, and learn about social issues.',
    ],
    [generatedQuestionId(sourceQuestions, 'q147', 'falseStatement')]: [
      'Demokratin blir starkare när färre människor deltar i val.',
      'Democracy becomes stronger when fewer people take part in elections.',
    ],
    [generatedQuestionId(sourceQuestions, 'q148', 'trueStatement')]: [
      'En anledning till att falsk information och hat kan vara ett hot mot demokratin är att det kan skapa konflikter och skrämma människor från demokratisk debatt.',
      'One reason false information and hate can be a threat to democracy is that it can create conflicts and scare people away from democratic debate.',
    ],
    [generatedQuestionId(sourceQuestions, 'q148', 'falseStatement')]: [
      'En anledning till att falsk information och hat kan vara ett hot mot demokratin är att det gör att alla automatiskt får mer kunskap.',
      'One reason false information and hate can be a threat to democracy is that it automatically gives everyone more knowledge.',
    ],
    [generatedQuestionId(sourceQuestions, 'q149', 'trueStatement')]: [
      'Integration i ett demokratiskt samhälle är att människor med olika bakgrund och ekonomiska villkor lever närmare varandra och känner sig delaktiga.',
      'Integration in a democratic society means people with different backgrounds and economic situations live closer to one another and feel included.',
    ],
    [generatedQuestionId(sourceQuestions, 'q149', 'falseStatement')]: [
      'Integration i ett demokratiskt samhälle är att människor lever helt åtskilda efter inkomst eller etnisk bakgrund.',
      'Integration in a democratic society means people live completely separated by income or ethnic background.',
    ],
    [generatedQuestionId(sourceQuestions, 'q153', 'trueStatement')]: [
      'På webben och i sociala medier kan vem som helst skapa innehåll, och innehållet kontrolleras inte alltid som i andra medier.',
      'On the web and in social media, anyone can create content, and that content is not always checked the same way as in other media.',
    ],
    [generatedQuestionId(sourceQuestions, 'q153', 'falseStatement')]: [
      'På webben och i sociala medier får bara ansvariga utgivare skriva inlägg.',
      'On the web and in social media, only responsible publishers may write posts.',
    ],
    [generatedQuestionId(sourceQuestions, 'q154', 'trueStatement')]: [
      'En anledning till att källkritik behövs när man använder medier är att falska uppgifter kan spridas snabbt och påverka människors åsikter.',
      "One reason source criticism is needed when using media is that false information can spread quickly and affect people's opinions.",
    ],
    [generatedQuestionId(sourceQuestions, 'q154', 'falseStatement')]: [
      'En anledning till att källkritik behövs när man använder medier är att allt som publiceras alltid är korrekt.',
      'One reason source criticism is needed when using media is that everything that is published is always correct.',
    ],
    [generatedQuestionId(sourceQuestions, 'q157', 'trueStatement')]: [
      'Primärvården omfattar vårdcentraler, barnavårdscentraler och mödravårdscentraler.',
      'Primary care includes health centres, child health centres, and maternity clinics.',
    ],
    [generatedQuestionId(sourceQuestions, 'q157', 'falseStatement')]: [
      'Primärvården omfattar domstolar, åklagare och kriminalvård.',
      'Primary care includes courts, prosecutors, and prison and probation services.',
    ],
    [generatedQuestionId(sourceQuestions, 'q158', 'trueStatement')]: [
      'Kommunen ansvarar för att ordna förskolor, fritidshem, grundskolor och gymnasieskolor.',
      'The municipality is responsible for arranging preschools, after-school centres, compulsory schools, and upper-secondary schools.',
    ],
    [generatedQuestionId(sourceQuestions, 'q158', 'falseStatement')]: [
      'Kommunen ansvarar för att betala sjukförsäkring och statliga pensioner.',
      'The municipality is responsible for paying sickness insurance and state pensions.',
    ],
    [generatedQuestionId(sourceQuestions, 'q159', 'trueStatement')]: [
      'Kommunen kan erbjuda äldre personer vård och service hemma eller boende som är anpassat för äldre personer för att klara vardagen.',
      'The municipality can offer older people care and services at home or housing adapted for older people to manage everyday life.',
    ],
    [generatedQuestionId(sourceQuestions, 'q159', 'falseStatement')]: [
      'Kommunen kan erbjuda äldre personer automatiskt studiestöd och plats på universitet för att klara vardagen.',
      'The municipality can offer older people automatic study support and a university place to manage everyday life.',
    ],
  };

  for (const [id, [questionSv, questionEn]] of Object.entries(expectedRows)) {
    assert.equal(byId.get(id)?.questionSv, questionSv, `${id} Swedish generated stem`);
    assert.equal(byId.get(id)?.questionEn, questionEn, `${id} English generated stem`);
  }

  const checkedText = Object.keys(expectedRows)
    .map((id) => `${byId.get(id)?.questionSv} ${byId.get(id)?.questionEn}`)
    .join('\n');

  assert.doesNotMatch(
    checkedText,
    /Det är inte sant att|Det stämmer inte att|Det stämmer att|It is not true that|It is true that|Påståendet är sant|The statement is true/i,
  );

  const sourceQ002TrueStatementId = generatedQuestionId(sourceQuestions, 'q002', 'trueStatement');
  const sourceQ002FalseStatementId = generatedQuestionId(sourceQuestions, 'q002', 'falseStatement');

  assert.equal(
    byId.get('q151')?.explanationSv,
    'Sveriges nordligaste del ligger norr om polcirkeln.',
  );
  assert.equal(
    byId.get('q151')?.explanationEn,
    "Sweden's northernmost part lies north of the Arctic Circle.",
  );
  assert.equal(
    byId.get('q150')?.explanationSv,
    'Sveriges nordligaste del ligger norr om polcirkeln, i det arktiska området.',
  );
  assert.equal(
    byId.get('q150')?.explanationEn,
    "Sweden's northernmost part lies north of the Arctic Circle, in the Arctic area.",
  );
  assert.equal(byId.get(sourceQ002TrueStatementId)?.explanationSv, sourceQ002.explanationSv);
  assert.equal(byId.get(sourceQ002TrueStatementId)?.explanationEn, sourceQ002.explanationEn);

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

test('generated residual scan includes true/false rows beyond the old q720 ceiling', () => {
  const oldPublishedQuestionCeiling = 720;
  const sourceQuestions = Array.from({ length: 145 }, (_, index) => ({
    id: `q${String(index + 1).padStart(3, '0')}`,
  }));
  const generatedPublishedQuestions = Array.from({ length: 580 }, (_, index) => ({
    id: `q${String(sourceQuestions.length + 1 + index).padStart(3, '0')}`,
    type: index === 578 ? 'true_false' : 'single_choice',
  }));
  const lastGeneratedTrueFalseQuestion = generatedPublishedQuestions.findLast(
    (question) => question.type === 'true_false',
  );

  assert.ok(lastGeneratedTrueFalseQuestion);
  assert.ok(questionNumber(lastGeneratedTrueFalseQuestion) > oldPublishedQuestionCeiling);

  const generatedRange = generatedQuestionNumberRange(sourceQuestions, generatedPublishedQuestions);
  const legacyCeilingResidualRows = generatedPublishedQuestions.filter((question) => {
    const idNumber = questionNumber(question);
    return (
      question.type === 'true_false' &&
      idNumber >= generatedRange.first &&
      idNumber <= oldPublishedQuestionCeiling
    );
  });

  assert.deepEqual(
    legacyCeilingResidualRows,
    [],
    'a hardcoded q720 residual scan would miss the expanded generated true/false tail',
  );
  assert.deepEqual(
    generatedTrueFalseResidualQuestions(sourceQuestions, generatedPublishedQuestions).map(
      (question) => question.id,
    ),
    [lastGeneratedTrueFalseQuestion.id],
  );
});

test('derivePublishedQuestions cleans residual generated true/false splice rows', () => {
  const { questions, sourceQuestions, generatedPublishedQuestions } = loadTs('data/questions.ts');
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
    [generatedQuestionId(sourceQuestions, 'q060', 'trueStatement')]: [
      'Äktenskap mellan personer av samma kön är tillåtet i Sverige.',
      'It is permitted to marry a person of the same sex.',
    ],
    [generatedQuestionId(sourceQuestions, 'q060', 'falseStatement')]: [
      'Äktenskap mellan personer av samma kön är förbjudet i Sverige.',
      'It is prohibited to marry a person of the same sex.',
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
      'The period after the Second World War is often called the Swedish record years because Sweden had long-lasting strong economic growth and could carry out major reforms.',
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
      'New Year’s Eve on 31 December is commonly celebrated with parties and dinners and at night with fireworks.',
    ],
    [generatedQuestionId(sourceQuestions, 'q097', 'falseStatement')]: [
      'På nyårsafton den 31 december är det vanligt med stora brasor och vårsånger.',
      'New Year’s Eve on 31 December is commonly celebrated with large bonfires and spring songs.',
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
    [generatedQuestionId(sourceQuestions, 'q104', 'trueStatement')]: [
      'På Alla helgons dag är det vanligt att tända ljus på gravar för att minnas och hedra dem som har dött.',
      'All Saints’ Day is commonly observed by lighting candles on graves to remember and honour people who have died.',
    ],
    [generatedQuestionId(sourceQuestions, 'q104', 'falseStatement')]: [
      'På Alla helgons dag är det vanligt att öppna en adventskalender varje dag fram till julafton.',
      'All Saints’ Day is commonly observed by opening an Advent calendar every day until Christmas Eve.',
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
      'Regeringsformen skyddar rätten att utöva sin religion och ger skydd mot diskriminering på grund av tro.',
      'The Instrument of Government protects the right to practice one’s religion and protects against discrimination because of belief.',
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
    [generatedQuestionId(sourceQuestions, 'q120', 'falseStatement')]: [
      'Judar blev Sveriges största religiösa grupp på 1700-talet.',
      'Jews became Sweden’s largest religious group in the 18th century.',
    ],
    [generatedQuestionId(sourceQuestions, 'q128', 'trueStatement')]: [
      'Nouruz och Newroz firas vid vårdagjämningen den 21 mars.',
      'Nouruz and Newroz are observed at the spring equinox on 21 March.',
    ],
    [generatedQuestionId(sourceQuestions, 'q130', 'falseStatement')]: [
      'Gudstjänsten tidigt på morgonen den 25 december kallas ett luciatåg.',
      'The church service early on the morning of 25 December is called a Lucia procession.',
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
  };

  for (const [id, [questionSv, questionEn]] of Object.entries(expectedRows)) {
    assert.equal(byId.get(id)?.questionSv, questionSv, `${id} Swedish generated stem`);
    assert.equal(byId.get(id)?.questionEn, questionEn, `${id} English generated stem`);
  }

  const residualQuestions = generatedTrueFalseResidualQuestions(
    sourceQuestions,
    generatedPublishedQuestions,
  );
  const residualText = residualQuestions
    .map((question) => `${question.questionSv} ${question.questionEn}`)
    .join('\n');

  assert.doesNotMatch(
    residualText,
    /Det stämmer i sak att|It is factually true that|describes (?:government agencies|legal certainty|the role|an important role|Sweden two hundred years ago)|beskriver (?:statliga myndigheter|rättssäkerhet|polisens uppgift|en viktig uppgift|Sverige för tvåhundra år sedan)|is the list that contains|är listan som innehåller|about public power in Sweden|om offentlig makt i Sverige|means it gives|innebär att den ger|from (?:13|15) years|One reason is\b|En anledning är\b|It was presented in (?:1918|1948)|Den presenterades (?:1918|1948)|One reason is that so|One reason is that Sweden had|En anledning är att Sverige (?:hade|saknade)|have they|har de|applies to|gäller för|common to (?:eating|lighting|opening|holding)|har förändrat bara hur|has changed only how|arbetar för endast|works for only|den näst största i Sverige|the second largest in Sweden|,\s*,|it is common to large bonfires|brukar [^.?!]* arrangerar|spreadinging|welcominging|Advent occurs (?:the four Sundays|a Saturday)|Travel to Asia and increased interest[^.?!]*\bis mentioned|Vem som helst kan skapa innehåll där|Bara ansvariga utgivare får skriva inlägg där|Anyone can create content there|Only responsible publishers may write posts there|^That Sweden's first mosques were built|skyddar rätten [^.?!]* och skydd mot|protects the right [^.?!]* and protection from|skyddar att staten väljer|protects that the state chooses|Många svenskar firar id al-fitr och Newroz även om|Many Swedes celebrate Eid al-Fitr and Newroz even if|fick rätt att bo i landet och utöva|gained the right to live in the country and practice|fick rätt att bli Sveriges största religiösa grupp|gained the right to become Sweden’s largest religious group|called Lucia procession|(?:fram till julafton|på kvällen)\s+med en adventskalender hemma|(?:until Christmas Eve|in the evening)\s+with an Advent calendar at home|^Det är (?:brottsligt enligt svensk lag|alltid en privat familjefråga)|^Sverige beslutade att barnkonventionen blev svensk lag|^(?:De|They) (?:företräder|bestämmer|represent|decide)|^En myndighet som|^An authority that|^Many people voting|^Fewer people taking|^People with [^.?!]* living closer|^People living completely separated/im,
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
      question.questionSv,
      /^(?:Genom att|Representera\b|Arbeta\s|Bo i landet|Lämna Svenska|Samarbetet mellan|Nordiska rådet|Riksdagen och|Islam\.|Jul\.|Påsk\.|Julotta\.|Bön,|[0-9]{4}\.)/i,
      question.id,
    );
  });
});
