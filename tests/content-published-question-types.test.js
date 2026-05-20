const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const { buildSiteQuestionBank } = require('../scripts/export-site-question-bank');
const {
  generatedFixtureIdExpression,
  generatedFixtureIdHelperSource,
  generatedQuestionId,
} = require('../scripts/generated-question-fixture-ids');

const repoRoot = path.resolve(__dirname, '..');
const trueFalsePrefixPattern = /^\s*(?:Sant eller falskt|True or false)\s*:/i;
const stateWelfareStiltedEnglishPattern =
  /\bstate(?:[-\s]funded|\s+finances)?\s+security\s+systems\b/i;
const q071SocialInsuranceOverlapPattern =
  /\b(?:sjukförsäkring|föräldraförsäkring|arbetslöshetsförsäkring|sickness insurance|parental insurance|unemployment insurance)\b/i;
const traditionCommonToDoEnglishPattern =
  /\bWhat is common to do on (?:New Year(?:’|')s Eve|All Saints(?:’|') Day)\b/i;
const mayDayEnglishCalquePattern = /\bFirst of May\b/i;
const councilOfEuropeWorkForEnglishPattern =
  /\b(?:What does the Council of Europe work for\??|The Council of Europe works (?:only )?for)\b/i;
const saltsjobadenAgreementStiltedEnglishPattern =
  /\b(?:What did the 1938 Saltsj(?:ö|o)baden Agreement become important for|bec(?:o|a)me important for)\b/i;
const luciaExplanationRoleScaffoldPattern =
  /\b(?:In a Lucia procession,\s+one person is Lucia|I ett luciatåg\s+(?:är en person Lucia|en person är Lucia))\b/i;
const taxVatTwoConceptPattern =
  /\b(?:skatt och moms|tax and VAT|Företag betalar också skatt,\s+och moms betalas|Companies also pay tax,\s+and VAT is paid|Skatt betalas både av personer som arbetar och av företag\.\s+Moms är|Both people who work and companies pay tax\.\s+VAT is)\b/i;
const q038OldVatDistractorPattern = /\b(?:Vilka varor som har moms|Which goods have VAT)\b/i;
const authoredWayToPromptPattern = /\b(?:Vilket är ett sätt att|Which is a way to)\b/i;
const q026OldMunicipalResponsibilitiesPromptPattern =
  /\b(?:Vilket exempel beskriver kommunernas ansvar|Which example describes municipal responsibilities)\b/i;
const q140OldChristmasPromptPattern =
  /\b(?:Vilket påstående stämmer om julfirande i Sverige|Which statement is correct about Christmas celebrations in Sweden)\b/i;
const sourceRecallPromptPattern =
  /\b(?:nämns som exempel|mentioned as examples?|nämns som en anledning|mentioned as a reason|Vad nämns som exempel|What is mentioned as an example|Vilken händelse från[^?!.]*nämns|Which event from[^?!.]*mentioned)\b/i;
const generatedIdLiteralPatterns = [
  {
    label: 'question.id equality',
    pattern: /question\.id\s*={2,3}\s*['"`](q\d{3,})['"`]/g,
  },
  {
    label: 'byId lookup',
    pattern: /byId\.get\(\s*['"`](q\d{3,})['"`]\s*\)/g,
  },
  {
    label: 'residual map key',
    pattern: /(?:^|[{,\s])['"`]?(q\d{3,})['"`]?\s*:/gm,
  },
];

function actualStaticQuestions() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'site/questions.js'), 'utf8'), context, {
    filename: 'site/questions.js',
    timeout: 3000,
  });
  return context.window.SMT_QUESTIONS;
}

function firstGeneratedQuestionNumber() {
  const firstGenerated = buildSiteQuestionBank().questions.find(
    (question) => question.questionProvenance !== 'uhr',
  );
  assert.ok(firstGenerated, 'question bank should include generated questions');
  return Number(firstGenerated.id.replace(/^q/, ''));
}

function lineNumberForIndex(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function hardcodedGeneratedIdFindingsForSource(
  relativePath,
  source,
  firstGeneratedNumber = firstGeneratedQuestionNumber(),
) {
  const findings = [];

  for (const { label, pattern } of generatedIdLiteralPatterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const id = match[1];
      const numericId = Number(id.replace(/^q/, ''));
      if (numericId < firstGeneratedNumber) continue;
      const lineNumber = lineNumberForIndex(source, match.index ?? 0);
      findings.push(`${relativePath}:${lineNumber} hardcodes generated ${label} ${id}`);
    }
  }

  return findings;
}

function hardcodedGeneratedIdFindings(relativePath) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  return hardcodedGeneratedIdFindingsForSource(relativePath, source);
}

function contentMutationFixtureFiles() {
  const testFiles = fs
    .readdirSync(path.join(repoRoot, 'tests'))
    .filter((fileName) => /^content-.*\.test\.js$/.test(fileName))
    .map((fileName) => `tests/${fileName}`);
  const scriptFiles = fs
    .readdirSync(path.join(repoRoot, 'scripts'))
    .filter((fileName) => /^.*content.*\.test\.js$/.test(fileName))
    .map((fileName) => `scripts/${fileName}`);

  return [...testFiles, ...scriptFiles].sort();
}

test('published question types stay answerable by quiz runtime', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.publishedQuestionTypesValidated, summary.publishedQuestions);
  assert.equal(
    summary.questionCouncilOfEuropeWorkForEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.questionMayDayEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.questionLuciaExplanationRoleScaffoldValidated, summary.publishedQuestions);
  assert.equal(summary.derivedCivicStatementPromptMirrorValidated, 2);
});

test('criminal-responsibility age copy is date-stamped to the current main-rule boundary', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.criminalResponsibilityCurrentnessOfficialSourcesValidated, 3);
  assert.equal(summary.criminalResponsibilityCurrentnessSourceMetadataValidated, true);
  assert.equal(summary.criminalResponsibilityCurrentnessSourceRetrievedAt, '2026-05-20');
  assert.equal(summary.criminalResponsibilityCurrentnessProposalEffectiveDate, '2026-08-02');
  assert.equal(summary.criminalResponsibilityCurrentnessQuestionsValidated, 5);
  assert.equal(summary.criminalResponsibilityCurrentnessParityValidated, true);
});

test('criminal-responsibility age copy rejects undated 13-year proposal wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'Proposition 2025/26:246, lämnad till riksdagen den 16 april 2026, föreslår en tidsbegränsad sänkning till 13 år för vissa allvarliga brott som föreslås börja gälla den 2 augusti 2026 och behöver kontrolleras på nytt efter det datumet.',
        'Uppgiften om 13 år gäller ett regeringsförslag under 2026 vid allvarliga brott, inte den huvudregel som frågan gäller.',
      )
      .replace(
        'Proposition 2025/26:246, submitted to the Riksdag on 16 April 2026, proposes a time-limited lowering to age 13 for certain serious crimes from 2 August 2026 and should be rechecked after that date.',
        'The age 13 option refers to a 2026 government proposal for serious crimes, not the main rule asked about here.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q044 criminal-responsibility age currentness uses stale proposal wording/,
  );
});

test('state welfare source and exports use natural social-insurance English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const fileFindings = [
    'data/additionalQuestions.ts',
    'content/question-bank.csv',
    'site/questions.js',
  ].filter((relativePath) =>
    stateWelfareStiltedEnglishPattern.test(
      fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
    ),
  );
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const bankFindings = [...generatedSiteBank, ...Array.from(actualSiteBank)]
    .filter((question) => stateWelfareStiltedEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const q156 = generatedSiteBank.find((question) => question.id === 'q156');

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(bankFindings, []);
  assert.ok(q156, 'q156 should be published in the site bank');
  assert.match(q156.q.en, /state-funded social insurance systems/);
  assert.match(q156.why.en, /state funds social insurance systems/);
});

test('state welfare English naturalness guard rejects literal state-security wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'Which state-funded social insurance systems can provide financial support during illness, parenthood, or unemployment?',
        'Which state-funded security systems can provide financial support during illness, parenthood, or unemployment?',
      )
      .replace(
        'The state funds social insurance systems such as sickness insurance, parental insurance, and unemployment insurance.',
        'The state finances security systems such as sickness insurance, parental insurance, and unemployment insurance.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q156 uses stilted state-welfare English wording/,
  );
});

test('Lucia explanation copy and exports avoid role-scaffold wording', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const fileFindings = [
    'data/additionalQuestions.ts',
    'content/question-bank.csv',
    'site/questions.js',
  ].filter((relativePath) =>
    luciaExplanationRoleScaffoldPattern.test(
      fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
    ),
  );
  const textForQuestion = (question) =>
    [question.q?.sv, question.q?.en, question.why?.sv, question.why?.en].join(' ');
  const bankFindings = [...generatedSiteBank, ...Array.from(actualSiteBank)]
    .filter((question) => luciaExplanationRoleScaffoldPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const q129 = generatedSiteBank.find((question) => question.id === 'q129');

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(bankFindings, []);
  assert.ok(q129, 'q129 should be published in the site bank');
  assert.match(q129.why.sv, /I ett luciatåg bär Lucia en ljuskrona på huvudet/);
  assert.match(q129.why.en, /In a Lucia procession, Lucia wears a crown of lights on her head/);
});

test('Lucia explanation naturalness guard rejects role-scaffold wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'I ett luciatåg bär Lucia en ljuskrona på huvudet, medan andra deltagare bär ljus i händerna och sjunger särskilda sånger.',
        'I ett luciatåg är en person Lucia och bär en ljuskrona på huvudet, medan andra deltagare bär ljus i händerna och sjunger särskilda sånger.',
      )
      .replace(
        'In a Lucia procession, Lucia wears a crown of lights on her head, while other participants carry candles and sing special songs.',
        'In a Lucia procession, one person is Lucia and wears a crown of lights on their head, while other participants carry candles and sing special songs.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q129 uses Lucia role-scaffold explanation wording/,
  );
});

test('state welfare source coverage separates q071 higher education from q156 social insurance', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const textForQuestion = (question) =>
    [
      question.q?.sv,
      question.q?.en,
      question.why?.sv,
      question.why?.en,
      ...(question.opts || []).flatMap((option) => [option.sv, option.en]),
    ].join(' ');
  const q071Ids = [
    'q071',
    generatedQuestionId(sourceQuestions, 'q071', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q071', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q071', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q071', 'judgement'),
  ];
  const q071Rows = q071Ids.map((id) => generatedSiteBank.find((question) => question.id === id));
  const q071StaticRows = actualSiteBank.filter((question) => q071Ids.includes(question.id));
  const q156 = generatedSiteBank.find((question) => question.id === 'q156');

  assert.equal(q071Rows.length, 5);
  q071Rows.forEach((question, index) => {
    assert.ok(question, `q071 row ${q071Ids[index]} should be published`);
    assert.doesNotMatch(textForQuestion(question), q071SocialInsuranceOverlapPattern);
  });
  q071StaticRows.forEach((question) => {
    assert.doesNotMatch(textForQuestion(question), q071SocialInsuranceOverlapPattern);
  });
  assert.equal(
    q071Rows[0].q.en,
    'What does the state finance within higher education and research?',
  );
  assert.equal(
    q071Rows[0].opts[0]?.en,
    'Higher education and research at colleges and universities',
  );
  assert.match(textForQuestion(q071Rows[0]), /högre utbildning/i);
  assert.match(textForQuestion(q071Rows[0]), /forskning/i);
  assert.match(textForQuestion(q071Rows[0]), /higher education/i);
  assert.match(textForQuestion(q071Rows[0]), /research/i);

  assert.ok(q156, 'q156 should be published in the site bank');
  assert.match(q156.q.en, /state-funded social insurance systems/);
  assert.match(textForQuestion(q156), /sickness insurance/i);
  assert.match(textForQuestion(q156), /parental insurance/i);
  assert.match(textForQuestion(q156), /unemployment insurance/i);
  assert.doesNotMatch(textForQuestion(q156), /higher education|research at colleges/i);
});

test('state welfare source coverage guard rejects q071 social-insurance duplication', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'Högre utbildning och forskning vid högskolor och universitet',
        'Sjukförsäkring, föräldraförsäkring och arbetslöshetsförsäkring',
      )
      .replace(
        'Higher education and research at colleges and universities',
        'Sickness insurance, parental insurance, and unemployment insurance',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q071 overlaps q071\/q156 state-welfare source coverage/,
  );
});

test('tradition prompts avoid literal common-to-do English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const fileFindings = [
    'data/additionalQuestions.ts',
    'content/question-bank.csv',
    'site/questions.js',
  ].filter((relativePath) =>
    traditionCommonToDoEnglishPattern.test(
      fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
    ),
  );
  const bankFindings = [...generatedSiteBank, ...Array.from(actualSiteBank)]
    .filter((question) => traditionCommonToDoEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q097 = generatedSiteBank.find((question) => question.id === 'q097');
  const q104 = generatedSiteBank.find((question) => question.id === 'q104');
  const q097SingleChoice = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q097', 'singleChoice'),
  );
  const q097Judgement = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q097', 'judgement'),
  );
  const q104SingleChoice = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q104', 'singleChoice'),
  );
  const q104Judgement = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q104', 'judgement'),
  );

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(bankFindings, []);
  assert.ok(q097, 'q097 should be published in the site bank');
  assert.ok(q104, 'q104 should be published in the site bank');
  assert.equal(q097.q.en, 'How is New Year’s Eve on 31 December commonly celebrated in Sweden?');
  assert.equal(q104.q.en, 'How is All Saints’ Day commonly observed in Sweden?');
  assert.equal(
    q097SingleChoice?.q.en,
    'Which answer best matches? How is New Year’s Eve on 31 December commonly celebrated in Sweden?',
  );
  assert.equal(
    q097Judgement?.q.en,
    'Choose the correct option: How is New Year’s Eve on 31 December commonly celebrated in Sweden?',
  );
  assert.equal(
    q104SingleChoice?.q.en,
    'Which answer best matches? How is All Saints’ Day commonly observed in Sweden?',
  );
  assert.equal(
    q104Judgement?.q.en,
    'Choose the correct option: How is All Saints’ Day commonly observed in Sweden?',
  );
});

test('tradition common-to-do guard rejects literal English prompts', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'How is New Year’s Eve on 31 December commonly celebrated in Sweden?',
        'What is common to do on New Year’s Eve, 31 December, in Sweden?',
      )
      .replace(
        'How is All Saints’ Day commonly observed in Sweden?',
        'What is common to do on All Saints’ Day in Sweden?',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /q097 uses literal common-to-do English wording/);
  assert.match(output, /q104 uses literal common-to-do English wording/);
  assert.ok((output.match(/uses literal common-to-do English wording/g) || []).length >= 6, output);
});

test('May Day source and exports use natural English holiday name', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const fileFindings = [
    'data/additionalQuestions.ts',
    'content/question-bank.csv',
    'site/questions.js',
  ].filter((relativePath) =>
    mayDayEnglishCalquePattern.test(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')),
  );
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const bankFindings = [...generatedSiteBank, ...actualSiteBank]
    .filter((question) => mayDayEnglishCalquePattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const q103 = generatedSiteBank.find((question) => question.id === 'q103');

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(bankFindings, []);
  assert.ok(q103, 'q103 should be published in the site bank');
  assert.equal(q103.q.en, 'What is marked on May Day in Sweden?');
  assert.match(q103.why.en, /^May Day is International Workers’ Day and a public holiday/);
});

test('May Day English naturalness guard rejects literal First of May wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents).replace(
      'What is marked on May Day in Sweden?',
      'What is marked on First of May in Sweden?',
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /q103 uses literal First of May English wording/);
});

test('Council of Europe source and exports use natural promote English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q088GeneratedIds = [
    generatedQuestionId(sourceQuestions, 'q088', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q088', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q088', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q088', 'judgement'),
  ];
  const q088Ids = ['q088', ...q088GeneratedIds];
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const generatedOffenders = generatedSiteBank
    .filter((question) => q088Ids.includes(question.id))
    .filter((question) => councilOfEuropeWorkForEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = actualSiteBank
    .filter((question) => q088Ids.includes(question.id))
    .filter((question) => councilOfEuropeWorkForEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split('\n')
    .filter((line) => /^"q0?88"|"q50[89]"|"q51[01]"/.test(line))
    .filter((line) => councilOfEuropeWorkForEnglishPattern.test(line));

  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
  assert.equal(
    generatedSiteBank.find((question) => question.id === 'q088')?.q.en,
    'What does the Council of Europe promote?',
  );
  assert.equal(
    generatedSiteBank.find((question) => question.id === q088GeneratedIds[2])?.q.en,
    'The Council of Europe promotes only agricultural policy.',
  );
});

test('Council of Europe English naturalness guard rejects literal work-for prompts', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'What does the Council of Europe promote?',
        'What does the Council of Europe work for?',
      )
      .replace(
        'The Council of Europe promotes human rights, democracy, and rule-of-law principles.',
        'The Council of Europe works for human rights, democracy, and rule-of-law principles.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /q088 uses literal Council of Europe work-for English wording/);
  assert.ok(
    (output.match(/uses literal Council of Europe work-for English wording/g) || []).length >= 5,
    output,
  );
});

test('Saltsjöbaden Agreement source and exports use natural English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q081GeneratedIds = [
    generatedQuestionId(sourceQuestions, 'q081', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q081', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q081', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q081', 'judgement'),
  ];
  const q081Ids = ['q081', ...q081GeneratedIds];
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const generatedOffenders = generatedSiteBank
    .filter((question) => q081Ids.includes(question.id))
    .filter((question) =>
      saltsjobadenAgreementStiltedEnglishPattern.test(textForQuestion(question)),
    )
    .map((question) => question.id);
  const actualOffenders = actualSiteBank
    .filter((question) => q081Ids.includes(question.id))
    .filter((question) =>
      saltsjobadenAgreementStiltedEnglishPattern.test(textForQuestion(question)),
    )
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => q081Ids.includes(line.match(/^"([^"]+)"/)?.[1]))
    .filter((line) => saltsjobadenAgreementStiltedEnglishPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1]);
  const q081 = generatedSiteBank.find((question) => question.id === 'q081');
  const q081True = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q081', 'trueStatement'),
  );

  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
  assert.ok(q081, 'q081 should be published in the site bank');
  assert.equal(q081.q.en, 'What was the 1938 Saltsjöbaden Agreement important for?');
  assert.equal(
    q081.why.en,
    'The Saltsjöbaden Agreement was made in 1938 between employers and trade unions. It was important for cooperation between them and laid the foundation for the Swedish model, where employers and trade unions agree on labour-market conditions through collective agreements.',
  );
  assert.ok(q081True, 'q081 true generated variant should be published');
  assert.equal(
    q081True.q.en,
    'The 1938 Saltsjöbaden Agreement was important for cooperation between trade unions and employers.',
  );
});

test('Saltsjöbaden Agreement English naturalness guard rejects the old phrasing', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'What was the 1938 Saltsjöbaden Agreement important for?',
        'What did the 1938 Saltsjöbaden Agreement become important for?',
      )
      .replace(
        'It was important for cooperation between them',
        'It became important for cooperation between them',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q081 uses stilted Saltsjöbaden Agreement English wording/,
  );
});

test('free-media source prompts ask the civic concept directly in exports', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const answerKeyPromptPattern = /\b(?:Vilket svar beskriver|Which answer describes)\b/i;
  const textForQuestion = (question) => [question.q?.sv, question.q?.en].join(' ');
  const generatedOffenders = generatedSiteBank
    .filter((question) => answerKeyPromptPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = Array.from(actualSiteBank)
    .filter((question) => answerKeyPromptPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => answerKeyPromptPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1] ?? line.slice(0, 80));
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q045 = generatedSiteBank.find((question) => question.id === 'q045');
  const q045True = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q045', 'trueStatement'),
  );
  const q045False = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q045', 'falseStatement'),
  );

  assert.ok(q045, 'q045 should be published in the site bank');
  assert.equal(q045.q.sv, 'Vilka viktiga uppgifter har fria medier i en demokrati?');
  assert.equal(q045.q.en, 'What important roles do free media play in a democracy?');
  assert.ok(q045True, 'q045 true generated variant should be published');
  assert.equal(
    q045True.q.sv,
    'I en demokrati har fria medier viktiga uppgifter: att informera, möjliggöra samhällsdebatt och granska personer med makt.',
  );
  assert.equal(
    q045True.q.en,
    'In a democracy, free media play important roles: informing, enabling public debate, and scrutinizing people with power.',
  );
  assert.ok(q045False, 'q045 false generated variant should be published');
  assert.equal(q045False.q.sv, 'I en demokrati ska fria medier ersätta politiska val.');
  assert.equal(q045False.q.en, 'In a democracy, free media should replace political elections.');
  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
});

test('published question prompts do not use source-recall wording', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const textForQuestion = (question) => [question.q?.sv, question.q?.en].join(' ');
  const generatedOffenders = generatedSiteBank
    .filter((question) => sourceRecallPromptPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = Array.from(actualSiteBank)
    .filter((question) => sourceRecallPromptPattern.test(textForQuestion(question)))
    .map((question) => question.id);

  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
});

test('free-media source prompt guard rejects answer-key wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'Vilka viktiga uppgifter har fria medier i en demokrati?',
        'Vilket svar beskriver en viktig uppgift för fria medier i en demokrati?',
      )
      .replace(
        'What important roles do free media play in a democracy?',
        'Which answer describes an important role of free media in a democracy?',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q045 source prompt asks about the answer instead of the civic concept/,
  );
});

test('participation source prompts ask the civic concept directly in exports', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const textForQuestion = (question) => [question.q?.sv, question.q?.en].join(' ');
  const generatedOffenders = generatedSiteBank
    .filter((question) => authoredWayToPromptPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = Array.from(actualSiteBank)
    .filter((question) => authoredWayToPromptPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => authoredWayToPromptPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1] ?? line.slice(0, 80));
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q013 = generatedSiteBank.find((question) => question.id === 'q013');
  const q013True = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q013', 'trueStatement'),
  );
  const q013False = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q013', 'falseStatement'),
  );

  assert.ok(q013, 'q013 should be published in the site bank');
  assert.equal(q013.q.sv, 'Hur kan människor påverka samhället och delta i demokratin?');
  assert.equal(q013.q.en, 'How can people influence society and participate in democracy?');
  assert.ok(q013True, 'q013 true generated variant should be published');
  assert.equal(
    q013True.q.sv,
    'Människor kan påverka samhället och delta i demokratin genom att kontakta politiker, demonstrera eller skriva på en namninsamling.',
  );
  assert.equal(
    q013True.q.en,
    'People can influence society and participate in democracy by contacting politicians, demonstrating, or signing a petition.',
  );
  assert.ok(q013False, 'q013 false generated variant should be published');
  assert.equal(
    q013False.q.sv,
    'Människor kan påverka samhället och delta i demokratin genom att förbjuda andra från att rösta i politiska val.',
  );
  assert.equal(
    q013False.q.en,
    'People can influence society and participate in democracy by banning others from voting in political elections.',
  );
  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
});

test('participation source prompt guard rejects way-to answer-key wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Hur kan människor påverka samhället och delta i demokratin?',
        'Vilket är ett sätt att påverka och delta i samhället?',
      )
      .replace(
        'How can people influence society and participate in democracy?',
        'Which is a way to influence and participate in society?',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q013 source prompt asks about the answer instead of the civic concept/,
  );
});

test('tax-liability source and exports keep VAT as a separate concept', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const textForQuestion = (question) =>
    [question.q?.sv, question.q?.en, question.why?.sv, question.why?.en]
      .concat((question.opts || []).flatMap((option) => [option.sv, option.en]))
      .join(' ');
  const generatedOffenders = generatedSiteBank
    .filter((question) => taxVatTwoConceptPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = Array.from(actualSiteBank)
    .filter((question) => taxVatTwoConceptPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => taxVatTwoConceptPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1] ?? line.slice(0, 80));
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q070 = generatedSiteBank.find((question) => question.id === 'q070');
  const q070True = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q070', 'trueStatement'),
  );
  const q070False = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q070', 'falseStatement'),
  );

  assert.ok(q070, 'q070 should be published in the site bank');
  assert.equal(q070.q.sv, 'Vilka betalar skatt i Sverige?');
  assert.equal(q070.q.en, 'Who pays tax in Sweden?');
  assert.deepEqual(
    q070.opts.map((option) => option.sv),
    [
      'Både personer som arbetar och företag betalar skatt i Sverige',
      'Bara personer som arbetar betalar skatt i Sverige',
      'Bara företag betalar skatt i Sverige',
      'Varken personer som arbetar eller företag betalar skatt i Sverige',
    ],
  );
  assert.ok(q070True, 'q070 true generated variant should be published');
  assert.equal(q070True.q.sv, 'Både personer som arbetar och företag betalar skatt i Sverige.');
  assert.equal(q070True.q.en, 'Both people who work and companies pay tax in Sweden.');
  assert.ok(q070False, 'q070 false generated variant should be published');
  assert.equal(q070False.q.sv, 'Bara personer som arbetar betalar skatt i Sverige.');
  assert.equal(q070False.q.en, 'Only people who work pay tax in Sweden.');
  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
});

test('tax/VAT single-concept guard rejects the old combined prompt', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'Vilka betalar skatt i Sverige?',
        'Vilket påstående om skatt och moms stämmer?',
      )
      .replace(
        'Who pays tax in Sweden?',
        'Which statement about tax and VAT is correct?',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q070 combines tax liability and VAT purchase taxation in one learner-facing item/,
  );
});

test('municipal responsibilities source and generated prompts ask directly about services', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const textForQuestion = (question) =>
    [question.q?.sv, question.q?.en, question.why?.sv, question.why?.en]
      .concat((question.opts || []).flatMap((option) => [option.sv, option.en]))
      .join(' ');
  const generatedOffenders = generatedSiteBank
    .filter((question) =>
      q026OldMunicipalResponsibilitiesPromptPattern.test(textForQuestion(question)),
    )
    .map((question) => question.id);
  const actualOffenders = Array.from(actualSiteBank)
    .filter((question) =>
      q026OldMunicipalResponsibilitiesPromptPattern.test(textForQuestion(question)),
    )
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => q026OldMunicipalResponsibilitiesPromptPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1] ?? line.slice(0, 80));
  const q026 = generatedSiteBank.find((question) => question.id === 'q026');
  const q026SectionPractice = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q026', 'singleChoice'),
  );
  const q026Judgement = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q026', 'judgement'),
  );
  const q026True = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q026', 'trueStatement'),
  );
  const q026False = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q026', 'falseStatement'),
  );

  assert.ok(q026, 'q026 should be published in the site bank');
  assert.equal(q026.q.sv, 'Vilka vardagstjänster ansvarar kommuner för?');
  assert.equal(q026.q.en, 'Which everyday services are municipalities responsible for?');
  assert.ok(q026SectionPractice, 'q026 section-practice generated variant should be published');
  assert.match(q026SectionPractice.q.sv, /Vilka vardagstjänster ansvarar kommuner för/);
  assert.match(
    q026SectionPractice.q.en,
    /Which everyday services are municipalities responsible for/,
  );
  assert.ok(q026Judgement, 'q026 judgement generated variant should be published');
  assert.match(q026Judgement.q.sv, /Vilka vardagstjänster ansvarar kommuner för/);
  assert.match(q026Judgement.q.en, /Which everyday services are municipalities responsible for/);
  assert.equal(
    q026True?.q.sv,
    'Kommuner ansvarar för vatten och avlopp, omsorg, snöröjning, parkskötsel och vuxenutbildning.',
  );
  assert.equal(
    q026True?.q.en,
    'Municipalities are responsible for water and sewage, care services, snow removal, park maintenance, and adult education.',
  );
  assert.equal(q026False?.q.sv, 'Kommuner ansvarar för att skicka ambassadörer till andra länder.');
  assert.equal(
    q026False?.q.en,
    'Municipalities are responsible for sending ambassadors to other countries.',
  );
  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
});

test('municipal responsibilities prompt guard rejects the old answer-key phrasing', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'Vilka vardagstjänster ansvarar kommuner för?',
        'Vilket exempel beskriver kommunernas ansvar?',
      )
      .replace(
        'Which everyday services are municipalities responsible for?',
        'Which example describes municipal responsibilities?',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q026 source prompt asks about the answer instead of the civic concept/,
  );
});

test('Christmas celebration source and generated prompts use a direct civic question', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const textForQuestion = (question) =>
    [question.q?.sv, question.q?.en, question.why?.sv, question.why?.en]
      .concat((question.opts || []).flatMap((option) => [option.sv, option.en]))
      .join(' ');
  const generatedOffenders = generatedSiteBank
    .filter((question) => q140OldChristmasPromptPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = Array.from(actualSiteBank)
    .filter((question) => q140OldChristmasPromptPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => q140OldChristmasPromptPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1] ?? line.slice(0, 80));
  const q140 = generatedSiteBank.find((question) => question.id === 'q140');
  const q140SectionPractice = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q140', 'singleChoice'),
  );
  const q140Judgement = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q140', 'judgement'),
  );
  const q140True = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q140', 'trueStatement'),
  );
  const q140False = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q140', 'falseStatement'),
  );

  assert.ok(q140, 'q140 should be published in the site bank');
  assert.equal(
    q140.q.sv,
    'Hur firar många jul i Sverige även när julen inte har religiös betydelse för dem?',
  );
  assert.equal(
    q140.q.en,
    'How do many people in Sweden celebrate Christmas even when it has no religious meaning for them?',
  );
  assert.ok(q140SectionPractice, 'q140 section-practice generated variant should be published');
  assert.match(q140SectionPractice.q.sv, /Hur firar många jul i Sverige/);
  assert.match(q140SectionPractice.q.en, /How do many people in Sweden celebrate Christmas/);
  assert.ok(q140Judgement, 'q140 judgement generated variant should be published');
  assert.match(q140Judgement.q.sv, /Hur firar många jul i Sverige/);
  assert.match(q140Judgement.q.en, /How do many people in Sweden celebrate Christmas/);
  assert.equal(
    q140True?.q.sv,
    'Många firar jul som en familjehögtid även när julen inte har religiös betydelse för dem.',
  );
  assert.equal(
    q140True?.q.en,
    'Many people celebrate Christmas as a family holiday even when it has no religious meaning for them.',
  );
  assert.equal(q140False?.q.sv, 'Jul firas alltid med demonstrationer om sociala frågor.');
  assert.equal(
    q140False?.q.en,
    'Christmas is always celebrated with demonstrations about social issues.',
  );
  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
});

test('Christmas celebration prompt guard rejects the old answer-key phrasing', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'Hur firar många jul i Sverige även när julen inte har religiös betydelse för dem?',
        'Vilket påstående stämmer om julfirande i Sverige?',
      )
      .replace(
        'How do many people in Sweden celebrate Christmas even when it has no religious meaning for them?',
        'Which statement is correct about Christmas celebrations in Sweden?',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q140 asks about the answer instead of the civic concept/,
  );
});

test('succession source and exports use a natural VAT distractor clause', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const textForQuestion = (question) =>
    [question.q?.sv, question.q?.en, question.why?.sv, question.why?.en]
      .concat((question.opts || []).flatMap((option) => [option.sv, option.en]))
      .join(' ');
  const generatedOffenders = generatedSiteBank
    .filter((question) => q038OldVatDistractorPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = Array.from(actualSiteBank)
    .filter((question) => q038OldVatDistractorPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => q038OldVatDistractorPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1] ?? line.slice(0, 80));
  const q038 = generatedSiteBank.find((question) => question.id === 'q038');
  const q038SectionPractice = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q038', 'singleChoice'),
  );

  assert.ok(q038, 'q038 should be published in the site bank');
  assert.ok(q038SectionPractice, 'q038 section-practice generated variant should be published');
  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
  assert.ok(
    q038.opts.some(
      (option) =>
        option.sv === 'När moms betalas på varor och tjänster' &&
        option.en === 'When VAT is paid on goods and services',
    ),
    'q038 should publish the natural VAT distractor clause',
  );
  assert.ok(
    q038SectionPractice.opts.some(
      (option) =>
        option.sv === 'När moms betalas på varor och tjänster' &&
        option.en === 'When VAT is paid on goods and services',
    ),
    'q038 generated variants should inherit the natural VAT distractor clause',
  );
});

test('succession VAT distractor guard rejects the old answer-fragment wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents)
      .replace(
        'När moms betalas på varor och tjänster',
        'Vilka varor som har moms',
      )
      .replace(
        'When VAT is paid on goods and services',
        'Which goods have VAT',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q038 uses the old q038 VAT distractor wording/,
  );
});

test('mutation fixtures derive generated question ids from source ids', () => {
  const scannedFiles = contentMutationFixtureFiles();

  assert.ok(
    scannedFiles.includes('tests/content-published-question-types.test.js'),
    'scan should include content test files',
  );
  assert.ok(
    scannedFiles.includes('scripts/derived-content.test.js'),
    'scan should include scripts',
  );
  assert.deepEqual(scannedFiles.flatMap(hardcodedGeneratedIdFindings), []);
});

test('derived civic statement mirror guard rejects validator-only prompt drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/scripts/validate-content.js')) {
    return String(contents).replace(
      'match = q.match(/^Vad heter (.+)$/i);',
      'match = q.match(/^Vad kallas (.+)$/i);',
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /civicStatementSv prompt patterns differ between lib\/content\/derivedQuestions\.ts and scripts\/validate-content\.js/,
  );
});

test('generated id fixture guard rejects raw generated ids in newly added content test files', () => {
  const firstGeneratedNumber = firstGeneratedQuestionNumber();
  const generatedId = `q${String(firstGeneratedNumber).padStart(3, '0')}`;
  const findings = hardcodedGeneratedIdFindingsForSource(
    'tests/content-new-mutation-fixture.test.js',
    [
      "test('bad generated fixture', () => {",
      `  const match = questions.find((question) => question.id === '${generatedId}');`,
      `  const generated = byId.get('${generatedId}');`,
      '  const residuals = {',
      `    ${generatedId}: { questionSv: 'stale fixture' },`,
      '  };',
      '});',
    ].join('\n'),
    firstGeneratedNumber,
  );

  assert.deepEqual(findings, [
    `tests/content-new-mutation-fixture.test.js:2 hardcodes generated question.id equality ${generatedId}`,
    `tests/content-new-mutation-fixture.test.js:3 hardcodes generated byId lookup ${generatedId}`,
    `tests/content-new-mutation-fixture.test.js:5 hardcodes generated residual map key ${generatedId}`,
  ]);
});

test('generated id fixture guard allows source ids and helper-derived ids', () => {
  const firstGeneratedNumber = firstGeneratedQuestionNumber();
  const source = [
    "const source = sourceQuestions.find((question) => question.id === 'q001');",
    "const generatedA = generatedFixtureId('q001', 1);",
    "const generatedB = generatedQuestionId(sourceQuestions, 'q002', 'trueStatement');",
    'const residuals = {',
    "  [generatedFixtureId('q032', 1)]: { questionSv: 'fixture text' },",
    '};',
  ].join('\n');

  assert.deepEqual(
    hardcodedGeneratedIdFindingsForSource(
      'scripts/new-content-mutation-fixture.test.js',
      source,
      firstGeneratedNumber,
    ),
    [],
  );
});

test('published true/false question banks omit UI-afforded prefixes', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const csvLines = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/);

  const generatedStaticOffenders = generatedSiteBank
    .filter((question) => question.type === 'true_false')
    .filter(
      (question) =>
        trueFalsePrefixPattern.test(question.q.sv) || trueFalsePrefixPattern.test(question.q.en),
    )
    .map((question) => question.id);
  const actualStaticOffenders = Array.from(actualSiteBank)
    .filter((question) => question.type === 'true_false')
    .filter(
      (question) =>
        trueFalsePrefixPattern.test(question.q.sv) || trueFalsePrefixPattern.test(question.q.en),
    )
    .map((question) => question.id);
  const csvOffenders = csvLines
    .filter((line) => line.includes('"true_false"'))
    .filter((line) => /"(?:Sant eller falskt|True or false)\s*:/.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1] ?? line.slice(0, 80));

  assert.deepEqual(generatedStaticOffenders, []);
  assert.deepEqual(actualStaticOffenders, []);
  assert.deepEqual(csvOffenders, []);
});

test('secret-ballot Swedish copy uses plural voter wording across published banks', () => {
  const secretBallotPronounPattern = /\bhur\s+den\s+röstar\b/i;
  const expectedOption = 'Att väljare inte behöver avslöja hur de röstar';
  const source = fs.readFileSync(path.join(repoRoot, 'data/additionalQuestions.ts'), 'utf8');
  const csv = fs.readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8');
  const staticSource = fs.readFileSync(path.join(repoRoot, 'site/questions.js'), 'utf8');
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();

  function learnerFacingSvText(question) {
    return [
      question.q?.sv,
      question.why?.sv,
      ...(question.opts || []).map((option) => option.sv),
    ].join(' ');
  }

  function bankFindings(bank) {
    return Array.from(bank)
      .filter((question) => secretBallotPronounPattern.test(learnerFacingSvText(question)))
      .map((question) => question.id);
  }

  assert.equal(source.includes(expectedOption), true);
  assert.equal(secretBallotPronounPattern.test(source), false);
  assert.equal(secretBallotPronounPattern.test(csv), false);
  assert.equal(secretBallotPronounPattern.test(staticSource), false);
  assert.deepEqual(bankFindings(generatedSiteBank), []);
  assert.deepEqual(bankFindings(actualSiteBank), []);
});

test('secret-ballot Swedish copy rejects singular den voting wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/additionalQuestions.ts')) {
    return String(contents).replace(
      'Att väljare inte behöver avslöja hur de röstar',
      'Ingen behöver avslöja hur den röstar',
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q145 uses unnatural secret-ballot Swedish voting pronoun/,
  );
});

test('generated single-choice banks omit true-false and filler option shells', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const fillerOptionPattern =
    /^(?:Inget av alternativen stämmer|None of the options is correct|Endast ibland|Only sometimes)$/i;
  const metaStemPattern = /^(?:Vilket svar är korrekt\?|Which answer is correct\?)/i;
  const absentTrueFalseExplanationPattern =
    /\b(?:Påståendet är sant|alternativet\s+Sant|medan\s+Falskt|That makes True correct|True is correct|while False)\b/i;

  function singleChoiceOptionTexts(question) {
    return (question.opts || []).flatMap((option) => [option.sv, option.en]);
  }

  function fillerRows(questions) {
    return Array.from(questions)
      .filter((question) => question.type === 'single_choice')
      .filter((question) =>
        singleChoiceOptionTexts(question).some((text) => fillerOptionPattern.test(text)),
      )
      .map((question) => question.id);
  }

  function trueFalseShellRows(questions) {
    return Array.from(questions)
      .filter((question) => question.type === 'single_choice')
      .filter((question) => {
        const texts = new Set(singleChoiceOptionTexts(question));
        return (
          texts.has('Sant') &&
          texts.has('Falskt') &&
          texts.has('True') &&
          texts.has('False') &&
          singleChoiceOptionTexts(question).some((text) => fillerOptionPattern.test(text))
        );
      })
      .map((question) => question.id);
  }

  function metaStemRows(questions) {
    return Array.from(questions)
      .filter((question) => question.type === 'single_choice')
      .filter(
        (question) => metaStemPattern.test(question.q.sv) || metaStemPattern.test(question.q.en),
      )
      .map((question) => question.id);
  }

  function absentTrueFalseExplanationRows(questions) {
    return Array.from(questions)
      .filter((question) => question.type === 'single_choice')
      .filter(
        (question) =>
          !singleChoiceOptionTexts(question).some((text) =>
            /^(?:Sant|Falskt|True|False)$/.test(text),
          ),
      )
      .filter((question) =>
        absentTrueFalseExplanationPattern.test(
          `${question.why?.sv || ''} ${question.why?.en || ''}`,
        ),
      )
      .map((question) => question.id);
  }

  assert.deepEqual(fillerRows(generatedSiteBank), []);
  assert.deepEqual(fillerRows(actualSiteBank), []);
  assert.deepEqual(trueFalseShellRows(generatedSiteBank), []);
  assert.deepEqual(trueFalseShellRows(actualSiteBank), []);
  assert.deepEqual(metaStemRows(generatedSiteBank), []);
  assert.deepEqual(metaStemRows(actualSiteBank), []);
  assert.deepEqual(absentTrueFalseExplanationRows(generatedSiteBank), []);
  assert.deepEqual(absentTrueFalseExplanationRows(actualSiteBank), []);
});

test('published question type schema rejects non-answerable flashcards', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      "    type: 'single_choice',",
      "    type: 'flashcard',",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 published question type flashcard is not quiz-answerable/,
  );
});

test('published question answer schema rejects orphaned correct option ids', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      "    correctOptionId: 'a',",
      "    correctOptionId: 'missing',",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 correctOptionId does not match an option/,
  );
});

test('published question answer schema rejects duplicate option ids', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      "      { id: 'b',",
      "      { id: 'a',",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /q001 has duplicate option id a/);
});

test('published question schema rejects nested generated true/false meta-stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Var ligger Sverige?',
        'Sant eller falskt: Ett korrekt svar på frågan "Sant eller falskt: Sveriges nordligaste del ligger norr om polcirkeln." är "Sant".',
      )
      .replace(
        'Where is Sweden located?',
        'True or false: A correct answer to "True or false: Sweden is in northern Europe." is "True".',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 contains a generated true\/false meta-stem instead of a civic statement/,
  );
});

test('published question schema rejects nested single-choice true/false source prompts', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Var ligger Sverige?',
        'Vilket svar stämmer bäst? Sant eller falskt: Sveriges nordligaste del ligger norr om polcirkeln.',
      )
      .replace(
        'Where is Sweden located?',
        'Which answer best matches? True or false: Sweden is in northern Europe.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 contains a generated true\/false meta-stem instead of a civic statement/,
  );
});

test('published question schema rejects generated judgement meta-stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Var ligger Sverige?',
        'Vilket alternativ motsvarar rätt bedömning av påståendet? Var ligger Sverige?',
      )
      .replace(
        'Where is Sweden located?',
        'Which option gives the correct judgment of the statement? Where is Sweden located?',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q001 contains a generated judgement meta-stem instead of a civic-study prompt/,
  );
});

test('published question schema rejects generated true/false grammar-splice stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Det stämmer att Ungefär nästan 11 miljoner människor bor i Sverige.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'It is true that Approximately almost 11 million people live in Sweden.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects same-sex marriage infinitive splices', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      'Sveriges nordligaste del ligger norr om polcirkeln.',
      'Äktenskap mellan personer av samma kön i Sverige är tillåtet att gifta sig med en person av samma kön.',
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects generated true/false answer-scaffold stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Det är korrekt att Svaret är genom att kontrollera information.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'It is correct that the answer is checking information.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects generated true/false describes-that stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Det är korrekt att Det att Sverige är en konstitutionell monarki betyder att statschefen saknar politisk makt.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'That the head of state lacks political power describes that Sweden is a constitutional monarchy.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual generated true/false option-fragment stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Alla som har rätt att rösta har en röst var ingår i fria val i en demokrati.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'Everyone who has the right to vote has one vote each is part of free elections in a democracy.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual generated true/false applies-to stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Man måste vara svensk medborgare och ha fyllt 18 år gäller för att rösta i Sveriges riksdagsval.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'You must be a Swedish citizen and at least 18 years old applies to voting in Sweden’s Riksdag election.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual generated true/false definition splices', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'De genomför beslut och måste följa lagar och regeringens instruktioner beskriver statliga myndigheter.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'They implement decisions and must follow laws and government instructions describes government agencies.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual generated true/false list and meaning splices', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Allemansrätten innebär att den ger alla möjlighet att vara i naturen.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'The right of public access means it gives everyone the opportunity to be in nature.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual generated true/false fragment-only stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Genom att allmänna handlingar kan begäras ut.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'By allowing public documents to be requested.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects generated true/false English gerund fragments', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const gerundFragmentResiduals = {",
        "  [generatedFixtureId('q147', 1)]: { questionEn: 'Many people voting, getting involved, and learning about social issues.' },",
        "  [generatedFixtureId('q147', 2)]: { questionEn: 'Fewer people taking part in elections.' },",
        "  [generatedFixtureId('q149', 1)]: { questionEn: 'People with different backgrounds and economic situations living closer to one another and feeling included.' },",
        "  [generatedFixtureId('q149', 2)]: { questionEn: 'People living completely separated by income or ethnic background.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  gerundFragmentResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...gerundFragmentResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 4);
});

test('published question schema rejects generated true/false bare answer phrases', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const bareAnswerPhraseResiduals = {",
        "  [generatedFixtureId('q146', 1)]: { questionSv: 'Försöka övertyga andra om sina politiska idéer.', questionEn: 'Try to persuade others of their political ideas.' },",
        "  [generatedFixtureId('q146', 2)]: { questionSv: 'Hindra andra från att rösta.', questionEn: 'Stop others from voting.' },",
        "  [generatedFixtureId('q157', 1)]: { questionSv: 'Vårdcentraler, barnavårdscentraler och mödravårdscentraler.', questionEn: 'Health centres, child health centres, and maternity clinics.' },",
        "  [generatedFixtureId('q157', 2)]: { questionSv: 'Domstolar, åklagare och kriminalvård.', questionEn: 'Courts, prosecutors, and prison and probation services.' },",
        "  [generatedFixtureId('q158', 1)]: { questionSv: 'Ordna förskolor, fritidshem, grundskolor och gymnasieskolor.', questionEn: 'Arrange preschools, after-school centres, compulsory schools, and upper-secondary schools.' },",
        "  [generatedFixtureId('q158', 2)]: { questionSv: 'Betala sjukförsäkring och statliga pensioner.', questionEn: 'Pay sickness insurance and state pensions.' },",
        "  [generatedFixtureId('q159', 1)]: { questionSv: 'Vård och service hemma eller boende som är anpassat för äldre personer.', questionEn: 'Care and services at home or housing adapted for older people.' },",
        "  [generatedFixtureId('q159', 2)]: { questionSv: 'Automatiskt studiestöd och plats på universitet.', questionEn: 'Automatic study support and a university place.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  bareAnswerPhraseResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...bareAnswerPhraseResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 8);
});

test('published question schema rejects generated true/false statement-about-statement stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Påståendet är sant: Sveriges nordligaste del ligger norr om polcirkeln.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'The statement is true: Sweden is in the Nordic region.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects generated true/false negative meta-stems', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents)
      .replace(
        'Sveriges nordligaste del ligger norr om polcirkeln.',
        'Det är inte sant att Sveriges nordligaste del ligger norr om polcirkeln.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'It is not true that Sweden is in northern Europe.',
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q002 contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects false-answer explanations that say True is correct', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === generatedFixtureId('q002', 2)",
        "    ? {",
        "        ...question,",
        "        explanationSv:",
        "          'Påståendet är sant: Sveriges nordligaste del ligger norr om polcirkeln. Därför stämmer alternativet Sant, medan Falskt motsäger uppgiften.',",
        '        explanationEn:',
        '          "The statement is true: Sweden\\'s northernmost part lies north of the Arctic Circle. That makes True correct, while False contradicts the fact.",',
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /contains a false-answer explanation that says True is correct/,
  );
});

test('published question schema rejects generated true-answer explanation meta wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === generatedFixtureId('q002', 1)",
        "    ? {",
        "        ...question,",
        "        explanationSv:",
        "          'Påståendet är sant: Sveriges nordligaste del ligger norr om polcirkeln. Därför stämmer alternativet Sant, medan Falskt motsäger uppgiften.',",
        '        explanationEn:',
        '          "The statement is true: Sweden\\'s northernmost part lies north of the Arctic Circle. That makes True correct, while False contradicts the fact.",',
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /contains a generated true\/false explanation meta-judgement/,
  );
});

test('published question schema rejects generated false-answer explanation meta wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === generatedFixtureId('q002', 2)",
        "    ? {",
        "        ...question,",
        "        explanationSv:",
        "          'Sveriges nordligaste del ligger norr om polcirkeln. Därför är påståendet i frågan falskt, och alternativet Falskt stämmer.',",
        '        explanationEn:',
        '          "Sweden\\'s northernmost part lies north of the Arctic Circle. Therefore the statement in the question is false, so False is correct.",',
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /contains a generated true\/false explanation meta-judgement/,
  );
});

test('published question schema rejects residual q256-q305 reason-target wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const q256Residuals = {",
        "  [generatedFixtureId('q032', 1)]: { questionSv: 'En anledning är att valet är hemligt och ingen annan ska se vilket val de gör.', questionEn: 'One reason is the vote is secret and no one else should see their choice.' },",
        "  [generatedFixtureId('q032', 2)]: { questionSv: 'En anledning är att rösterna ska räknas snabbare.', questionEn: 'One reason is votes are counted faster.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q256Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q256Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 2);
});

test('published question schema rejects residual q306-q355 true/false wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === generatedFixtureId('q044', 1)",
        "    ? {",
        "        ...question,",
        "        questionEn: 'A person in Sweden is criminally responsible and able to be prosecuted for a crime from 15 years.',",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual q356-q405 true/false wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === generatedFixtureId('q064', 1)",
        "    ? {",
        "        ...question,",
        "        questionEn: 'They represent employees, negotiate wages, and can help members.',",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual q406-q455 true/false wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  question.id === generatedFixtureId('q076', 1)",
        "    ? {",
        "        ...question,",
        "        questionEn: 'One reason is eU membership.',",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /contains a generated true\/false grammar-splice stem/,
  );
});

test('published question schema rejects residual q456-q505 true/false wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const q456Residuals = {",
        "  [generatedFixtureId('q078', 1)]: { questionSv: 'Förändringen genom den nya grundlagen år 1809 var att Kungens makt begränsades.' },",
        "  [generatedFixtureId('q081', 1)]: { questionSv: 'Saltsjöbadsavtalet från 1938 blev viktigt för Samarbetet mellan fackföreningar och arbetsgivare.', questionEn: 'The 1938 Saltsjöbaden Agreement became important for Cooperation between trade unions and employers.' },",
        "  [generatedFixtureId('q082', 1)]: { questionSv: 'En anledning är att Sverige hade långvarig stark ekonomisk tillväxt och kunde genomföra stora reformer.', questionEn: 'One reason is that Sweden had long-lasting strong economic growth and could carry out major reforms.' },",
        "  [generatedFixtureId('q082', 2)]: { questionSv: 'En anledning är att Sverige saknade nästan all industri.', questionEn: 'One reason is that Sweden had almost no industry.' },",
        "  [generatedFixtureId('q084', 2)]: { questionSv: 'Den digitala revolutionen har förändrat bara hur människor firar midsommar.', questionEn: 'The digital revolution has changed only how people celebrate Midsummer.' },",
        "  [generatedFixtureId('q088', 2)]: { questionSv: 'Europarådet arbetar för endast jordbrukspolitik.', questionEn: 'The Council of Europe works for only agricultural policy.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q456Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q456Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 6);
});

test('published question schema rejects residual q506-q555 true/false wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const q506Residuals = {",
        "  [generatedFixtureId('q096', 1)]: { questionEn: 'Islam is described as the second largest in Sweden.' },",
        "  [generatedFixtureId('q096', 2)]: { questionEn: 'Judaism is described as the second largest in Sweden.' },",
        "  [generatedFixtureId('q097', 1)]: { questionEn: 'On New Year’s Eve, 31 December,, it is common to celebrate with parties and dinners and at night with fireworks.' },",
        "  [generatedFixtureId('q097', 2)]: { questionEn: 'On New Year’s Eve, 31 December,, it is common to large bonfires and spring songs.' },",
        "  [generatedFixtureId('q098', 2)]: { questionSv: 'På Sveriges nationaldag den 6 juni brukar arbetarrörelsen arrangerar demonstrationer.' },",
        "  [generatedFixtureId('q100', 1)]: { questionEn: 'Lucia celebration is largely about spreadinging light when the year is at its darkest.' },",
        "  [generatedFixtureId('q100', 2)]: { questionEn: 'Lucia celebration is largely about welcominging spring with large bonfires.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q506Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q506Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 7);
});

test('published question schema rejects residual q556-q605 true/false wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const q556Residuals = {",
        "  [generatedFixtureId('q105', 2)]: { questionEn: 'Advent occurs a Saturday at the end of October or beginning of November.' },",
        "  [generatedFixtureId('q108', 1)]: { questionEn: 'In different places in Sweden, there are buddhist and Hindu congregations and temples for Buddhists and Hindus.' },",
        "  [generatedFixtureId('q114', 1)]: { questionEn: 'Travel to Asia and increased interest in meditation and yoga is a way to contacts with Hindus and Buddhists in Sweden during the 20th century.' },",
        "  [generatedFixtureId('q114', 2)]: { questionEn: \\"By the building of Sweden's first mosques during the 1970s contributed to contacts with Hindus and Buddhists in Sweden during the 20th century.\\" },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q556Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q556Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 4);
});

test('published question schema rejects residual q606-q655 true/false wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const q606Residuals = {",
        "  [generatedFixtureId('q116', 1)]: { questionSv: 'Regeringsformen skyddar rätten att utöva sin religion och skydd mot diskriminering på grund av tro.', questionEn: 'The Instrument of Government protects the right to practice one’s religion and protection from discrimination because of belief.' },",
        "  [generatedFixtureId('q116', 2)]: { questionSv: 'Regeringsformen skyddar att staten väljer religion åt varje invånare.', questionEn: 'The Instrument of Government protects that the state chooses a religion for each resident.' },",
        "  [generatedFixtureId('q117', 2)]: { questionSv: 'Många svenskar firar id al-fitr och Newroz även om de inte ser sig som religiösa.', questionEn: 'Many Swedes celebrate Eid al-Fitr and Newroz even if they do not see themselves as religious.' },",
        "  [generatedFixtureId('q120', 1)]: { questionSv: 'Judar fick rätt att bo i landet och utöva sin religion.', questionEn: 'Jews gained the right to live in the country and practice their religion.' },",
        "  [generatedFixtureId('q120', 2)]: { questionSv: 'Judar fick rätt att bli Sveriges största religiösa grupp.', questionEn: 'Jews gained the right to become Sweden’s largest religious group.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q606Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q606Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 5);
});

test('published question schema rejects residual q656-q705 proper-noun lowercasing', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const q656Residuals = {",
        "  [generatedFixtureId('q139', 1)]: { questionSv: 'Julen firar traditionellt jesu födelse inom kristendomen.', questionEn: \\"Christmas traditionally celebrates jesus' birth in Christianity.\\" },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q656Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q656Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /contains a generated true\/false grammar-splice stem/);
});

test('published question schema rejects residual q656-q705 holiday wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const q656Residuals = {",
        "  [generatedFixtureId('q130', 2)]: { questionSv: 'Gudstjänsten tidigt på morgonen den 25 december kallas Luciatåg.', questionEn: 'The church service early on the morning of 25 December is called Lucia procession.' },",
        "  [generatedFixtureId('q132', 1)]: { questionSv: 'Barn öppnar en lucka varje dag fram till julafton med en adventskalender hemma.', questionEn: 'Children often open one door each day until Christmas Eve with an Advent calendar at home.' },",
        "  [generatedFixtureId('q132', 2)]: { questionSv: 'Barn tänder stora brasor på kvällen med en adventskalender hemma.', questionEn: 'Children often light large bonfires in the evening with an Advent calendar at home.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  q656Residuals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...q656Residuals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 3);
});

test('published question schema rejects generated web/social-media target fragments', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const webSocialMediaResiduals = {",
        "  [generatedFixtureId('q153', 1)]: { questionSv: 'Vem som helst kan skapa innehåll där, och det kontrolleras inte alltid som i andra medier.', questionEn: 'Anyone can create content there, and it is not always checked the same way as in other media.' },",
        "  [generatedFixtureId('q153', 2)]: { questionSv: 'Bara ansvariga utgivare får skriva inlägg där.', questionEn: 'Only responsible publishers may write posts there.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  webSocialMediaResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...webSocialMediaResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 2);
});

test('published question schema rejects generated proportional-party referent splices', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    const marker = "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions];";
    return String(contents).replace(
      marker,
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "const proportionalPartyResiduals = {",
        "  [generatedFixtureId('q034', 1)]: { questionSv: 'I ett proportionellt val får partiet 20 procent av platserna om ett parti får 20 procent av rösterna.', questionEn: 'In a proportional election, the party receives 20 percent of the seats if a party receives 20 percent of the votes.' },",
        "  [generatedFixtureId('q034', 2)]: { questionSv: 'I ett proportionellt val får partiet alla platser om ett parti får 20 procent av rösterna.', questionEn: 'In a proportional election, the party receives all seats if a party receives 20 percent of the votes.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  proportionalPartyResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...proportionalPartyResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 2);
});

test('published question schema rejects source-material generated option fallbacks', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(\\n  sourceQuestions,\\n  sourceQuestions.length + 1,\\n);",
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(",
        "  sourceQuestions,",
        "  sourceQuestions.length + 1,",
        ").map((question) =>",
        "  question.id === generatedFixtureId('q001', 0)",
        "    ? {",
        "        ...question,",
        "        options: question.options.map((option, index) =>",
        "          index === 2",
        "            ? { ...option, textSv: 'Det går inte att avgöra av materialet', textEn: 'It cannot be determined from the material' }",
        "            : option,",
        "        ),",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /generated variant\[0\] option\[2\] uses source-material fallback wording/,
  );
});

test('published question schema rejects generated single-choice filler options', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(\\n  sourceQuestions,\\n  sourceQuestions.length + 1,\\n);",
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(",
        "  sourceQuestions,",
        "  sourceQuestions.length + 1,",
        ").map((question) =>",
        "  question.id === generatedFixtureId('q001', 3)",
        "    ? {",
        "        ...question,",
        "        options: question.options.map((option, index) =>",
        "          index === 2",
        "            ? { ...option, textSv: 'Inget av alternativen stämmer', textEn: 'None of the options is correct' }",
        "            : option,",
        "        ),",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /generated variant\[3\] option\[2\] uses generated single-choice filler option "(?:Inget av alternativen stämmer|None of the options is correct)"/,
  );
});

test('published question metadata schema rejects invalid difficulty values', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/data/questions.ts')) {
    return String(contents).replace(
      "    difficulty: 'easy',",
      "    difficulty: 'expert',",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /q001 has invalid difficulty expert/);
});
