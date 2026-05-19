const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

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

function questionNumber(question) {
  return Number(String(question.id).replace(/^q/, ''));
}

function generatedTrueFalseResidualQuestions(sourceQuestions, generatedPublishedQuestions) {
  const firstGeneratedQuestionNumber = sourceQuestions.length + 1;
  const lastGeneratedQuestionNumber =
    firstGeneratedQuestionNumber + generatedPublishedQuestions.length - 1;

  return generatedPublishedQuestions.filter((question) => {
    const idNumber = questionNumber(question);
    return (
      question.type === 'true_false' &&
      idNumber >= firstGeneratedQuestionNumber &&
      idNumber <= lastGeneratedQuestionNumber
    );
  });
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
    /Det att|describes that|describes government agencies|It is correct that the answer is|regions's foremost task is be|is an example of municipal responsibilities|has one vote each is part of|may stand for election is part of|har en röst var ingår|får ställa upp ingår|is a way to|applies to|gäller för|is the list that contains|about public power in Sweden|means it gives|One reason is that so|have they|har de/i,
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
    q156: [
      'Sveriges nordligaste del ligger inte norr om polcirkeln.',
      "Sweden's northernmost part does not lie north of the Arctic Circle.",
    ],
    q172: [
      'Golfströmmen och den Nordatlantiska strömmen bidrar inte till Sveriges milda klimat.',
      "The Gulf Stream and the North Atlantic Current do not help make Sweden's climate mild.",
    ],
    q240: [
      'Riksdagen väljer inte statsminister.',
      'The Riksdag does not choose the prime minister.',
    ],
    q260: [
      'Oppositionen ska inte granska regeringens arbete och föreslå annan politik.',
      'The opposition should not scrutinize the government’s work and propose alternative policies.',
    ],
    q271: [
      'Politiker i Sverige behöver inte följa resultatet av en folkomröstning.',
      'Politicians in Sweden do not have to follow the result of a referendum.',
    ],
    q272: [
      'Politiker i Sverige är skyldiga att följa resultatet av en folkomröstning.',
      'Politicians in Sweden are required to follow the result of a referendum.',
    ],
    q336: [
      'Den som lämnar uppgifter till tidningar, radio och tv har inte rätt att vara anonym.',
      'A person who gives information to newspapers, radio, and TV does not have the right to be anonymous.',
    ],
    q344: [
      'Public service-företag ska inte vara oberoende av politiska och andra intressen.',
      'Public service companies should not be independent of political and other interests.',
    ],
    q444: [
      'Sveriges kommuner ska inte erbjuda äldre personer stöd och hjälp.',
      'Swedish municipalities do not have to offer older people support and help.',
    ],
    q512: [
      'Det svenska totalförsvaret omfattar inte både det militära försvaret och det civila försvaret.',
      'Swedish total defence does not include both military defence and civil defence.',
    ],
    q524: [
      'År 2000 blev inte Svenska kyrkan ett trossamfund bland flera när staten och Svenska kyrkan skildes åt.',
      'In 2000, the Church of Sweden did not become one faith community among several when the state and the Church of Sweden separated.',
    ],
    q720: [
      'Sverige brukar inte delas in i Götaland, Svealand och Norrland.',
      'Sweden is not usually divided into Götaland, Svealand, and Norrland.',
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

  assert.equal(
    byId.get('q156')?.explanationSv,
    'Sveriges nordligaste del ligger norr om polcirkeln.',
  );
  assert.equal(
    byId.get('q156')?.explanationEn,
    "Sweden's northernmost part lies north of the Arctic Circle.",
  );
  assert.equal(byId.get('q155')?.explanationSv, sourceQ002.explanationSv);
  assert.equal(byId.get('q155')?.explanationEn, sourceQ002.explanationEn);

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
    q211: [
      'Medborgarna väljer ledamöter till riksdagen i Sveriges parlamentariska representativa demokrati genom att rösta i allmänna val.',
      "Citizens choose members of the Riksdag in Sweden's parliamentary representative democracy by voting in general elections.",
    ],
    q275: [
      'En anledning till att väljare röstar bakom en skärm i vallokalen är att valet är hemligt och ingen annan ska se vilket val de gör.',
      'One reason voters vote behind a screen at the polling station is that the vote is secret and no one else should see their choice.',
    ],
    q276: [
      'En anledning till att väljare röstar bakom en skärm i vallokalen är att rösterna ska räknas snabbare.',
      'One reason voters vote behind a screen at the polling station is that votes are counted faster.',
    ],
    q323: [
      'Från 15 år är en person i Sverige straffmyndig och kan bli åtalad för brott.',
      'A person in Sweden is criminally responsible and able to be prosecuted for a crime from age 15.',
    ],
    q324: [
      'Från 13 år är en person i Sverige straffmyndig och kan bli åtalad för brott.',
      'A person in Sweden is criminally responsible and able to be prosecuted for a crime from age 13.',
    ],
    q331: [
      'Offentlighetsprincipen underlättar granskning av myndigheter genom att allmänna handlingar kan begäras ut om de inte omfattas av sekretess.',
      'The principle of public access makes it easier to scrutinize authorities by allowing public documents to be requested unless they are covered by secrecy rules.',
    ],
    q351: [
      'Förenta nationerna bildades efter andra världskriget för att förhindra krig och skydda människors rättigheter.',
      'The United Nations was created after the Second World War to prevent war and protect human rights.',
    ],
    q352: [
      'Förenta nationerna bildades efter andra världskriget för att bestämma svenska kommunalskatter.',
      'The United Nations was created after the Second World War to decide Swedish municipal taxes.',
    ],
    q355: [
      'FN:s förklaring om de mänskliga rättigheterna presenterades 1948 och innehåller 30 artiklar.',
      'The UN Universal Declaration of Human Rights was presented in 1948 and contains 30 articles.',
    ],
    q356: [
      'FN:s förklaring om de mänskliga rättigheterna presenterades 1918 och gäller bara Europa.',
      'The UN Universal Declaration of Human Rights was presented in 1918 and applies only to Europe.',
    ],
    q363: [
      'Våld i nära relationer och hedersrelaterat våld och förtryck i Sverige är brottsligt enligt svensk lag.',
      'Violence in close relationships and honour-related violence and oppression in Sweden are crimes under Swedish law.',
    ],
    q364: [
      'Våld i nära relationer och hedersrelaterat våld och förtryck i Sverige är alltid en privat familjefråga och inte ett brott.',
      'Violence in close relationships and honour-related violence and oppression in Sweden are always private family matters and not crimes.',
    ],
    q376: [
      'År 1979 beslutade Sverige som första land i världen att barnkonventionen blev svensk lag.',
      'In 1979, Sweden was the first country in the world to decide that the Convention on the Rights of the Child became Swedish law.',
    ],
    q379: [
      'Sveriges fem nationella minoriteter är judar, romer, samer, sverigefinnar och tornedalingar.',
      "Sweden's five national minorities are Jews, Roma, Sami, Sweden Finns, and Tornedalians.",
    ],
    q380: [
      'Sveriges fem nationella minoriteter är danskar, norrmän, islänningar, tyskar och fransmän.',
      "Sweden's five national minorities are Danes, Norwegians, Icelanders, Germans, and French.",
    ],
    q403: [
      'Fackförbund företräder arbetstagare, förhandlar om löner och kan hjälpa medlemmar.',
      'Trade unions represent employees, negotiate wages, and can help members.',
    ],
    q404: [
      'Fackförbund bestämmer vilka som får rösta i riksdagsval.',
      'Trade unions decide who may vote in Riksdag elections.',
    ],
    q411: [
      'Lagar på arbetsmarknaden i Sverige finns för att skydda anställdas rättigheter och bidra till en trygg arbetsmiljö.',
      'Sweden has labour-market laws to protect employees’ rights and help create a safe work environment.',
    ],
    q412: [
      'Lagar på arbetsmarknaden i Sverige finns för att bestämma vem som blir statschef.',
      'Sweden has labour-market laws to decide who becomes head of state.',
    ],
    q416: [
      'A-kassan är en myndighet som dömer i arbetsmiljöbrott.',
      'A-kassan is an authority that judges work environment crimes.',
    ],
    q451: [
      'Sveriges befolkning ökade under 1800-talet på grund av bättre jordbruksmetoder och medicinska framsteg.',
      'Sweden’s population grew during the 19th century because of better farming methods and medical advances.',
    ],
    q452: [
      'Sveriges befolkning ökade under 1800-talet på grund av EU-medlemskapet.',
      'Sweden’s population grew during the 19th century because of EU membership.',
    ],
    q459: [
      'Förändringen genom den nya grundlagen år 1809 var att kungens makt begränsades.',
      'The change through the new constitution in 1809 was that the king’s power was limited.',
    ],
    q471: [
      'Saltsjöbadsavtalet från 1938 blev viktigt för samarbetet mellan fackföreningar och arbetsgivare.',
      'The 1938 Saltsjöbaden Agreement became important for cooperation between trade unions and employers.',
    ],
    q475: [
      'Tiden efter andra världskriget kallas ofta de svenska rekordåren eftersom Sverige hade långvarig stark ekonomisk tillväxt och kunde genomföra stora reformer.',
      'The period after the Second World War is often called the Swedish record years because Sweden had long-lasting strong economic growth and could carry out major reforms.',
    ],
    q476: [
      'Tiden efter andra världskriget kallas ofta de svenska rekordåren eftersom Sverige saknade nästan all industri.',
      'The period after the Second World War is often called the Swedish record years because Sweden had almost no industry.',
    ],
    q484: [
      'Den digitala revolutionen har bara förändrat hur människor firar midsommar.',
      'The digital revolution has only changed how people celebrate Midsummer.',
    ],
    q500: [
      'Europarådet arbetar endast för jordbrukspolitik.',
      'The Council of Europe works only for agricultural policy.',
    ],
    q463: [
      'Arbetarrörelsen, frikyrkorörelsen, kvinnorörelsen och nykterhetsrörelsen var bland de största folkrörelserna i Sverige under 1800-talet.',
      'The labour movement, free church movement, women’s movement, and temperance movement were among the largest popular movements in Sweden during the 19th century.',
    ],
    q487: [
      'Sveriges nordiska samarbete sker främst genom Nordiska rådet och Nordiska ministerrådet.',
      "Sweden's Nordic cooperation mainly takes place through the Nordic Council and the Nordic Council of Ministers.",
    ],
    q507: [
      'Sverige och Finland valde att nästan samtidigt ansöka om medlemskap i Nato efter Rysslands attack mot Ukraina 2022.',
      "Sweden and Finland chose to apply for NATO membership at almost the same time after Russia's attack on Ukraine in 2022.",
    ],
    q531: [
      'Islam beskrivs som den näst största religionen i Sverige.',
      'Islam is described as the second-largest religion in Sweden.',
    ],
    q532: [
      'Judendom beskrivs som den näst största religionen i Sverige.',
      'Judaism is described as the second-largest religion in Sweden.',
    ],
    q535: [
      'På nyårsafton den 31 december är det vanligt att fira med fester och middagar och på natten med fyrverkerier.',
      'On New Year’s Eve, 31 December, it is common to celebrate with parties and dinners and at night with fireworks.',
    ],
    q536: [
      'På nyårsafton den 31 december är det vanligt med stora brasor och vårsånger.',
      'On New Year’s Eve, 31 December, large bonfires and spring songs are common.',
    ],
    q540: [
      'På Sveriges nationaldag den 6 juni brukar arbetarrörelsen arrangera demonstrationer.',
      'On Sweden’s National Day, 6 June, the labour movement arranges demonstrations.',
    ],
    q547: [
      'Luciafirandet handlar mycket om att sprida ljus när året är som mörkast.',
      'The Lucia celebration is largely about spreading light when the year is at its darkest.',
    ],
    q548: [
      'Luciafirandet handlar mycket om att välkomna våren med stora brasor.',
      'The Lucia celebration is largely about welcoming spring with large bonfires.',
    ],
    q555: [
      'Typiskt för valborgsmässoafton den 30 april är brasor, vårsånger och ibland ett tal till våren.',
      'Bonfires, spring songs, and sometimes a speech welcoming spring are typical of Walpurgis Night, 30 April.',
    ],
    q567: [
      'Advent infaller de fyra söndagarna före juldagen den 25 december.',
      'Advent occurs on the four Sundays before Christmas Day, 25 December.',
    ],
    q568: [
      'Advent infaller en lördag i slutet av oktober eller början av november.',
      'Advent occurs on a Saturday at the end of October or beginning of November.',
    ],
    q579: [
      'På olika platser i Sverige finns buddhistiska och hinduiska församlingar och tempel för buddhister och hinduer.',
      'In different places in Sweden, there are Buddhist and Hindu congregations and temples for Buddhists and Hindus.',
    ],
    q603: [
      'Resor till Asien och ökat intresse för meditation och yoga nämns som exempel på kontakter med hinduer och buddhister i Sverige under 1900-talet.',
      'Travel to Asia and increased interest in meditation and yoga are mentioned as examples of contacts with Hindus and Buddhists in Sweden during the 20th century.',
    ],
    q604: [
      'Byggandet av Sveriges första moskéer under 1970-talet nämns som exempel på kontakter med hinduer och buddhister i Sverige under 1900-talet.',
      "The building of Sweden's first mosques during the 1970s is mentioned as an example of contacts with Hindus and Buddhists in Sweden during the 20th century.",
    ],
    q611: [
      'Regeringsformen skyddar rätten att utöva sin religion och ger skydd mot diskriminering på grund av tro.',
      'The Instrument of Government protects the right to practice one’s religion and protects against discrimination because of belief.',
    ],
    q612: [
      'Regeringsformen låter staten välja religion åt varje invånare.',
      'The Instrument of Government lets the state choose a religion for each resident.',
    ],
    q615: [
      'Jul och påsk är kristna högtider som många svenskar firar även om de inte ser sig som religiösa.',
      'Christmas and Easter are Christian holidays that many Swedes celebrate even if they do not see themselves as religious.',
    ],
    q616: [
      'Id al-fitr och Newroz är kristna högtider som många svenskar firar även om de inte ser sig som religiösa.',
      'Eid al-Fitr and Newroz are Christian holidays that many Swedes celebrate even if they do not see themselves as religious.',
    ],
    q627: [
      'Judar fick rätt att bo i Sverige och utöva sin religion.',
      'Jews gained the right to live in Sweden and practice their religion.',
    ],
    q659: [
      'Nouruz och Newroz firas vid vårdagjämningen den 21 mars.',
      'Nouruz and Newroz are observed at the spring equinox on 21 March.',
    ],
    q668: [
      'Gudstjänsten tidigt på morgonen den 25 december kallas ett luciatåg.',
      'The church service early on the morning of 25 December is called a Lucia procession.',
    ],
    q671: [
      'På påskafton är det vanligt att äta ägg, lamm, lax och sill och att barn får godis i påskägg.',
      'On Easter Saturday, it is common to eat eggs, lamb, salmon, and herring, and for children to get candy in Easter eggs.',
    ],
    q672: [
      'På påskafton är det vanligt att tända adventsljus och öppna adventskalendrar.',
      'On Easter Saturday, it is common to light Advent candles and open Advent calendars.',
    ],
    q675: [
      'Barn med en adventskalender hemma öppnar en lucka varje dag fram till julafton.',
      'Children with an Advent calendar at home often open one door each day until Christmas Eve.',
    ],
    q676: [
      'Under advent tänder barn stora brasor på kvällen.',
      'During Advent, children often light large bonfires in the evening.',
    ],
    q703: [
      'Julen firar traditionellt Jesu födelse inom kristendomen.',
      "Christmas traditionally celebrates Jesus' birth in Christianity.",
    ],
    q704: [
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
    /Det stämmer i sak att|It is factually true that|describes (?:government agencies|legal certainty|the role|an important role|Sweden two hundred years ago)|beskriver (?:statliga myndigheter|rättssäkerhet|polisens uppgift|en viktig uppgift|Sverige för tvåhundra år sedan)|is the list that contains|är listan som innehåller|about public power in Sweden|om offentlig makt i Sverige|means it gives|innebär att den ger|from (?:13|15) years|One reason is to (?:prevent war|decide Swedish municipal taxes|protect employees|decide who becomes head of state)|One reason is (?:better farming methods|eU membership|EU membership|the vote is secret|votes are counted faster)|En anledning är(?: att)? (?:förhindra krig|bestämma svenska kommunalskatter|skydda anställdas rättigheter|bestämma vem som blir statschef|bättre jordbruksmetoder|EU-medlemskapet|valet är hemligt|rösterna ska räknas snabbare)|It was presented in (?:1918|1948)|Den presenterades (?:1918|1948)|One reason is that so|One reason is that Sweden had|En anledning är att Sverige (?:hade|saknade)|have they|har de|applies to|gäller för|common to (?:eating|lighting|opening|holding)|har förändrat bara hur|has changed only how|arbetar för endast|works for only|den näst största i Sverige|the second largest in Sweden|,\s*,|it is common to large bonfires|brukar [^.?!]* arrangerar|spreadinging|welcominging|Advent occurs (?:the four Sundays|a Saturday)|Travel to Asia and increased interest[^.?!]*\bis mentioned|^That Sweden's first mosques were built|skyddar rätten [^.?!]* och skydd mot|protects the right [^.?!]* and protection from|skyddar att staten väljer|protects that the state chooses|Många svenskar firar id al-fitr och Newroz även om|Many Swedes celebrate Eid al-Fitr and Newroz even if|fick rätt att bo i landet och utöva|gained the right to live in the country and practice|called Lucia procession|(?:fram till julafton|på kvällen)\s+med en adventskalender hemma|(?:until Christmas Eve|in the evening)\s+with an Advent calendar at home|^Det är (?:brottsligt enligt svensk lag|alltid en privat familjefråga)|^Sverige beslutade att barnkonventionen blev svensk lag|^(?:De|They) (?:företräder|bestämmer|represent|decide)|^En myndighet som|^An authority that/im,
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
