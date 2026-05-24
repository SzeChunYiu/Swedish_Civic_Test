const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function resolveLocalModule(filePath, request) {
  if (request.startsWith('.')) {
    const base = path.resolve(path.dirname(filePath), request);
    for (const extension of ['.ts', '.tsx', '.js', '.json']) {
      const candidate = `${base}${extension}`;
      if (fs.existsSync(candidate)) return candidate;
    }
    if (fs.existsSync(base)) return base;
  }
  return request;
}

function loadTs(relativePath, exportName) {
  const filePath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filePath,
  }).outputText;

  const module = { exports: {} };
  const localRequire = (request) => {
    if (request === 'react-native') return {};
    if (request.endsWith('.css')) return {};
    return request.startsWith('.')
      ? loadTs(path.relative(repoRoot, resolveLocalModule(filePath, request)))
      : require(request);
  };

  const compiled = new Function('require', 'module', 'exports', output);
  compiled(localRequire, module, module.exports);
  return exportName ? module.exports[exportName] : module.exports;
}

const sourceQuestions = loadTs('data/questions.ts', 'sourceQuestions');
const publishedQuestions = loadTs('data/questions.ts', 'questions');
const getQuestionProvenance = loadTs('lib/content/provenance.ts', 'getQuestionProvenance');

const expectedQuestions = [
  {
    id: 'q041',
    chapterId: 'ch05',
    type: 'single_choice',
    correctOptionId: 'a',
    uhr: ['Lag och rätt', 'Rättssäkerhet', 17],
    stemSv: 'Vilket påstående beskriver rättssäkerhet i Sverige?',
    stemEn: 'Which statement describes the rule of law in Sweden?',
    correctSv: 'Domstolarna är oberoende, och alla har rätt att försvara sig och överklaga en dom',
    correctEn:
      'Courts are independent, and everyone has the right to defend themselves and appeal a judgment',
    explanationSv: ['alla behandlas lika inför lagen', 'rättvis rättegång', 'advokat'],
    explanationEn: ['everyone is treated equally before the law', 'fair trial', 'lawyer'],
  },
  {
    id: 'q042',
    chapterId: 'ch05',
    type: 'single_choice',
    correctOptionId: 'a',
    uhr: ['Lag och rätt', 'Domstolar', 18],
    stemSv: 'Vad gäller för en person som är misstänkt för brott i Sverige?',
    stemEn: 'What applies to a person suspected of a crime in Sweden?',
    correctSv: 'En misstänkt person ska betraktas som oskyldig tills personen har dömts',
    correctEn:
      'A suspected person should be considered innocent until the person has been convicted',
    explanationSv: ['Domstolar bedömer', 'oskyldig tills personen har dömts', 'överklagas'],
    explanationEn: ['Courts decide', 'innocent until convicted', 'appealed'],
  },
  {
    id: 'q043',
    chapterId: 'ch05',
    type: 'single_choice',
    correctOptionId: 'a',
    uhr: ['Lag och rätt', 'Polisen', 18],
    stemSv: 'Vilket påstående beskriver polisens uppgift i Sverige?',
    stemEn: 'Which statement describes the role of the police in Sweden?',
    correctSv: 'Att upprätthålla lag och ordning samt förebygga och utreda brott',
    correctEn: 'To maintain law and order and prevent and investigate crimes',
    explanationSv: ['upprätthålla lag och ordning', 'förebygga och utreda brott', 'trygghet'],
    explanationEn: ['maintain law and order', 'prevent and investigate crimes', 'safety'],
  },
  {
    id: 'q044',
    chapterId: 'ch05',
    type: 'single_choice',
    correctOptionId: 'b',
    uhr: ['Lag och rätt', 'Straffmyndighet och belastningsregister', 19],
    stemSv:
      'Från vilken ålder är en person i Sverige enligt huvudregeln straffmyndig och kan bli åtalad för brott?',
    stemEn:
      'From what age is a person in Sweden criminally responsible and able to be prosecuted for a crime under the main rule?',
    correctSv: '15 år',
    correctEn: '15 years',
    explanationSv: ['huvudregeln', '1 kap. 6 § brottsbalken', '15 års ålder'],
    explanationEn: ['main rule', 'Chapter 1, Section 6 of the Swedish Penal Code', 'age 15'],
  },
  {
    id: 'q045',
    chapterId: 'ch06',
    type: 'single_choice',
    correctOptionId: 'a',
    uhr: ['Mediernas roll', 'Fria medier', 20],
    stemSv: 'Vilka viktiga uppgifter har fria medier i en demokrati?',
    stemEn: 'What important roles do free media play in a democracy?',
    correctSv: 'Att informera, möjliggöra samhällsdebatt och granska personer med makt',
    correctEn: 'To inform, enable public debate, and scrutinize people with power',
    explanationSv: ['informerar om nyheter', 'samhällsdiskussion', 'granska'],
    explanationEn: ['inform people about news', 'public discussion', 'scrutinize'],
  },
  {
    id: 'q046',
    chapterId: 'ch06',
    type: 'single_choice',
    correctOptionId: 'a',
    uhr: ['Mediernas roll', 'Fria medier', 20],
    stemSv: 'Hur underlättar offentlighetsprincipen granskning av myndigheter?',
    stemEn: 'How does the principle of public access make it easier to scrutinize authorities?',
    correctSv: 'Genom att allmänna handlingar kan begäras ut om de inte omfattas av sekretess',
    correctEn:
      'By allowing public documents to be requested unless they are covered by secrecy rules',
    explanationSv: ['allmänna handlingar', 'begära ut', 'sekretess'],
    explanationEn: ['public documents', 'request', 'secrecy rules'],
  },
  {
    id: 'q047',
    chapterId: 'ch06',
    type: 'true_false',
    correctOptionId: 'true',
    uhr: ['Mediernas roll', 'Fria medier', 20],
    stemSv: 'Den som lämnar uppgifter till tidningar, radio och tv har rätt att vara anonym.',
    stemEn:
      'A person who gives information to newspapers, radio, and TV has the right to be anonymous.',
    correctSv: 'Sant',
    correctEn: 'True',
    explanationSv: ['utan att straffas', 'rätt att vara anonym', 'skyddar källan'],
    explanationEn: ['without being punished', 'right to remain anonymous', 'protects the source'],
  },
  {
    id: 'q048',
    chapterId: 'ch06',
    type: 'single_choice',
    correctOptionId: 'a',
    uhr: ['Mediernas roll', 'Public service', 21],
    stemSv: 'Vilka tre företag kallas public service i Sverige?',
    stemEn: "Which three companies are Sweden's public service broadcasters?",
    correctSv: 'Sveriges Radio (SR), Sveriges Television (SVT) och Utbildningsradion (UR)',
    correctEn:
      'Swedish Radio (SR), Swedish Television (SVT), and Swedish Educational Broadcasting Company (UR)',
    explanationSv: ['Sveriges Radio', 'Sveriges Television', 'Utbildningsradion'],
    explanationEn: [
      'Swedish Radio',
      'Swedish Television',
      'Swedish Educational Broadcasting Company',
    ],
  },
  {
    id: 'q049',
    chapterId: 'ch06',
    type: 'true_false',
    correctOptionId: 'true',
    uhr: ['Mediernas roll', 'Public service', 21],
    stemSv: 'Public service-företag ska vara oberoende av politiska och andra intressen.',
    stemEn: 'Public service companies should be independent of political and other interests.',
    correctSv: 'Sant',
    correctEn: 'True',
    explanationSv: ['oberoende av politiska och andra intressen', 'utan att välja sida', 'reklam'],
    explanationEn: [
      'independent of political and other interests',
      'without taking sides',
      'advertising',
    ],
  },
  {
    id: 'q050',
    chapterId: 'ch06',
    type: 'single_choice',
    correctOptionId: 'a',
    uhr: ['Mediernas roll', 'Källkritik', 21],
    stemSv: 'Vad betyder det att vara källkritisk?',
    stemEn: 'What does source criticism mean?',
    correctSv: 'Att ifrågasätta och kontrollera om information är korrekt',
    correctEn: 'Questioning and checking whether information is correct',
    explanationSv: ['kontrollera och granska information', 'falska uppgifter', 'spridas snabbt'],
    explanationEn: ['checking and reviewing information', 'false information', 'spread quickly'],
  },
];

const byId = new Map(sourceQuestions.map((question) => [question.id, question]));
const publishedById = new Map(publishedQuestions.map((question) => [question.id, question]));

function assertIncludesAll(actual, expectedParts, label) {
  for (const part of expectedParts) {
    assert.match(actual, new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), label);
  }
}

test('CONTENT-VERIFY q041-q050 pins audited UHR source rows and answer keys', () => {
  for (const expected of expectedQuestions) {
    const question = byId.get(expected.id);
    assert.ok(question, `${expected.id} source question exists`);
    assert.equal(question.chapterId, expected.chapterId);
    assert.equal(question.type, expected.type);
    assert.equal(question.correctOptionId, expected.correctOptionId);
    assert.equal(question.reviewStatus, 'published');
    assert.equal(getQuestionProvenance(question), 'uhr');
    assert.deepEqual(
      [
        question.uhrReference?.chapter,
        question.uhrReference?.section,
        question.uhrReference?.pageApprox,
      ],
      expected.uhr,
    );

    assert.equal(question.questionSv, expected.stemSv);
    assert.equal(question.questionEn, expected.stemEn);
    assert.equal(
      question.options.find((option) => option.id === expected.correctOptionId)?.textSv,
      expected.correctSv,
    );
    assert.equal(
      question.options.find((option) => option.id === expected.correctOptionId)?.textEn,
      expected.correctEn,
    );
    assertIncludesAll(
      question.explanationSv,
      expected.explanationSv,
      `${expected.id} Swedish explanation`,
    );
    assertIncludesAll(
      question.explanationEn,
      expected.explanationEn,
      `${expected.id} English explanation`,
    );
  }
});

test('CONTENT-VERIFY q041-q050 keeps source rows published without source/published drift', () => {
  for (const expected of expectedQuestions) {
    const source = byId.get(expected.id);
    const published = publishedById.get(expected.id);
    assert.ok(published, `${expected.id} published question exists`);
    assert.deepEqual(
      published,
      source,
      `${expected.id} published row should match authored source row`,
    );
  }
});

test('CONTENT-VERIFY q041-q050 keeps true/false rows free of UI prefixes and judgement boilerplate', () => {
  const forbiddenStemPrefix = /^(Sant eller falskt|True or false):/i;
  const forbiddenExplanationPrefix =
    /^(Påståendet är (sant|falskt)|The statement is (true|false)):/i;

  for (const expected of expectedQuestions.filter((question) => question.type === 'true_false')) {
    const question = byId.get(expected.id);
    assert.doesNotMatch(question.questionSv, forbiddenStemPrefix);
    assert.doesNotMatch(question.questionEn, forbiddenStemPrefix);
    assert.doesNotMatch(question.explanationSv, forbiddenExplanationPrefix);
    assert.doesNotMatch(question.explanationEn, forbiddenExplanationPrefix);
    assert.deepEqual(
      question.options.map((option) => option.id),
      ['true', 'false'],
    );
    assert.deepEqual(
      question.options.map((option) => [option.textSv, option.textEn]),
      [
        ['Sant', 'True'],
        ['Falskt', 'False'],
      ],
    );
  }
});
