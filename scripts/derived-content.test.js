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
  assert.equal(derived[1].questionSv, 'Sant eller falskt: Sverige ligger i Norden.');
  assert.equal(derived[1].questionEn, 'True or false: Sweden is located in the Nordic region.');
  assert.equal(derived[2].questionSv, 'Sant eller falskt: Sverige ligger i Asien.');
  assert.equal(derived[2].questionEn, 'True or false: Sweden is located in Asia.');
  assert.equal(derived[3].questionSv, 'Vilket svar är korrekt? Var ligger Sverige?');
  assert.equal(derived[3].questionEn, 'Which answer is correct? Where is Sweden located?');
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
    questionSv: 'Sant eller falskt: Sverige ligger i Norden.',
    questionEn: 'True or false: Sweden is in the Nordic region.',
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
  const generatedOptionText = singleChoiceVariants
    .flatMap((question) => question.options.flatMap((option) => [option.textSv, option.textEn]))
    .join('\n');
  assert.match(generatedOptionText, /Alla alternativen är korrekta/);
  assert.match(generatedOptionText, /All of the options are correct/);
  assert.doesNotMatch(generatedOptionText, /materialet|from the material/i);
  singleChoiceVariants.forEach((question) => {
    assert.deepEqual(
      question.options.map((option) => option.id),
      ['a', 'b', 'c', 'd'],
    );
  });
  assert.ok(singleChoiceVariants.every((question) => question.correctOptionId === 'a'));
  assert.equal(
    derived[0].questionSv,
    'Välj rätt alternativ för påståendet: Sverige ligger i Norden.',
  );
  assert.equal(
    derived[0].questionEn,
    'Choose the correct option for the statement: Sweden is in the Nordic region.',
  );
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
    [
      'Sant eller falskt: Det stämmer i sak att Sverige ligger i Norden.',
      'Sant eller falskt: Det stämmer inte att Sverige ligger i Norden.',
    ],
  );
  assert.deepEqual(
    trueFalseVariants.map((question) => question.questionEn),
    [
      'True or false: It is factually true that Sweden is in the Nordic region.',
      'True or false: It is not true that Sweden is in the Nordic region.',
    ],
  );
  assert.equal(
    derived[3].questionSv,
    'Vilket alternativ stämmer med påståendet? Sverige ligger i Norden.',
  );
  assert.equal(
    derived[3].questionEn,
    'Which option matches the statement? Sweden is in the Nordic region.',
  );
  assert.ok(
    trueFalseVariants.every(
      (question) =>
        !/Sant eller falskt:\s*Ett korrekt svar|True or false:\s*A correct answer/.test(
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
  assert.equal(
    derived[1].questionSv,
    'Sant eller falskt: Havet vid Sveriges östra kust heter Östersjön.',
  );
  assert.equal(
    derived[1].questionEn,
    "True or false: The sea along Sweden's eastern coast is called the Baltic Sea.",
  );
  assert.equal(
    derived[5].questionSv,
    'Sant eller falskt: Nästan 11 miljoner människor bor i Sverige.',
  );
  assert.equal(derived[5].questionEn, 'True or false: Almost 11 million people live in Sweden.');
  assert.equal(
    derived[9].questionSv,
    'Sant eller falskt: Ett parti måste få minst 4 procent av rösterna för att komma in i riksdagen.',
  );
  assert.equal(
    derived[9].questionEn,
    'True or false: A party must receive at least 4 percent of the votes to enter the Riksdag.',
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
      'Sant eller falskt: Att folkomröstningar i Sverige är rådgivande betyder att politikerna måste inte följa resultatet.',
    ),
  );
  assert.ok(
    text.includes(
      'True or false: That referendums in Sweden are advisory means politicians do not have to follow the result.',
    ),
  );
  assert.ok(
    text.includes(
      "True or false: The foremost task of Sweden's regions is to be responsible for health care.",
    ),
  );
  assert.ok(
    text.includes(
      'True or false: Water and sewage, care services, snow removal, park maintenance, and adult education belong among municipal responsibilities.',
    ),
  );
  assert.ok(
    text.includes(
      "True or false: Sweden's three largest lakes are the Baltic Sea, Kattegat, and Skagerrak.",
    ),
  );
  assert.ok(
    text.includes(
      'True or false: A feature of free elections in a democracy is that everyone who has the right to vote has one vote each.',
    ),
  );
  assert.ok(
    text.includes(
      'True or false: One way to influence and participate in society is to contact politicians, demonstrate, or sign a petition.',
    ),
  );
  assert.ok(
    text.includes(
      'True or false: To vote in Sweden’s Riksdag election, you must be a Swedish citizen and at least 18 years old.',
    ),
  );
  assert.ok(
    text.includes(
      'True or false: A suspected person should be considered innocent until the person has been convicted.',
    ),
  );
});

test('derivePublishedQuestions cleans residual generated true/false splice rows', () => {
  const { questions } = loadTs('data/questions.ts');
  const byId = new Map(questions.map((question) => [question.id, question]));

  const expectedRows = {
    q206: [
      'Sant eller falskt: Domstolarna väljer alla riksdagsledamöter.',
      'True or false: The courts elect all members of the Riksdag.',
    ],
    q237: [
      'Sant eller falskt: Statliga myndigheter genomför beslut och måste följa lagar och regeringens instruktioner.',
      'True or false: Government agencies implement decisions and must follow laws and government instructions.',
    ],
    q270: [
      'Sant eller falskt: En anledning är att rösterna ska räknas snabbare.',
      'True or false: One reason is that votes are counted faster.',
    ],
    q273: [
      'Sant eller falskt: Människor i ett politiskt parti har gemensamma idéer om hur samhället ska styras.',
      'True or false: People in a political party have shared ideas about how society should be governed.',
    ],
    q285: [
      'Sant eller falskt: Listan med regeringsformen, tryckfrihetsförordningen, yttrandefrihetsgrundlagen och successionsordningen innehåller bara Sveriges fyra grundlagar.',
      "True or false: The list with the Instrument of Government, Freedom of the Press Act, Fundamental Law on Freedom of Expression, and Act of Succession contains only Sweden's four constitutional laws.",
    ],
    q289: [
      'Sant eller falskt: Regeringsformen säger att all offentlig makt utgår från folket.',
      'True or false: The Instrument of Government says that all public power comes from the people.',
    ],
    q297: [
      'Sant eller falskt: Allemansrätten ger alla möjlighet att vara i naturen, men man måste visa ansvar.',
      'True or false: The right of public access gives everyone the opportunity to be in nature, but people must act responsibly.',
    ],
    q321: [
      'Sant eller falskt: En viktig uppgift för fria medier i en demokrati är att informera, möjliggöra samhällsdebatt och granska personer med makt.',
      'True or false: An important role of free media in a democracy is to inform, enable public debate, and scrutinize people with power.',
    ],
    q441: [
      'Sant eller falskt: För tvåhundra år sedan var Sverige ett typiskt jordbruksland där nästan alla bodde på landet.',
      'True or false: Two hundred years ago, Sweden was a typical agricultural country where almost everyone lived in the countryside.',
    ],
  };

  for (const [id, [questionSv, questionEn]] of Object.entries(expectedRows)) {
    assert.equal(byId.get(id)?.questionSv, questionSv, `${id} Swedish generated stem`);
    assert.equal(byId.get(id)?.questionEn, questionEn, `${id} English generated stem`);
  }

  const residualText = [
    'q206',
    'q237',
    'q238',
    'q253',
    'q254',
    'q265',
    'q266',
    'q270',
    'q273',
    'q274',
    'q285',
    'q286',
    'q289',
    'q290',
    'q297',
    'q298',
    'q305',
    'q306',
    'q313',
    'q314',
    'q321',
    'q322',
    'q357',
    'q358',
    'q361',
    'q362',
    'q381',
    'q382',
    'q441',
    'q442',
  ]
    .map((id) => `${byId.get(id)?.questionSv} ${byId.get(id)?.questionEn}`)
    .join('\n');

  assert.doesNotMatch(
    residualText,
    /describes (?:government agencies|legal certainty|the role|an important role|Sweden two hundred years ago)|beskriver (?:statliga myndigheter|rättssäkerhet|polisens uppgift|en viktig uppgift|Sverige för tvåhundra år sedan)|is the list that contains|är listan som innehåller|about public power in Sweden|om offentlig makt i Sverige|means it gives|innebär att den ger|One reason is that so|have they|har de|applies to|gäller för/i,
  );
});
