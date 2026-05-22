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
const privateWelfareTaxFundingStiltedEnglishPattern = /\b(?:tax-funded|tax revenue pays for it)\b/i;
const q071SocialInsuranceOverlapPattern =
  /\b(?:sjukförsäkring|föräldraförsäkring|arbetslöshetsförsäkring|sickness insurance|parental insurance|unemployment insurance)\b/i;
const traditionCommonToDoEnglishPattern =
  /\bWhat is common to do on (?:New Year(?:’|')s Eve|All Saints(?:’|') Day)\b/i;
const religiousFreedom1951StiltedEnglishPattern = /\bcompletely freely\b/i;
const religiousFreedom1860StiltedEnglishPattern =
  /\bchoose any religion or no religion at all completely freely\b/i;
const religiousFreedomOptionParallelismPattern =
  /\b(?:Rätten att utöva sin religion och skydd mot diskriminering på grund av tro|The right to practice (?:one’s|one's) religion and protection from discrimination because of belief)\b/i;
const mayDayEnglishCalquePattern = /\bFirst of May\b/i;
const workersDayHolidayEnglishPatterns = [
  /\bDemonstrations on workers[’'] day\b/i,
  /\bHolding demonstrations on workers[’'] day\b/i,
  /\bWorkers[’'] day with demonstrations and speeches\b/,
  /\bmarks workers[’'] day with demonstrations and speeches\b/i,
];
const euCooperationMissingArticleEnglishPattern =
  /\bThe EU is political and economic cooperation between European countries\b/i;
const goodFridayRemembersEnglishPattern =
  /\bGood Friday remembers Jesus' death and Easter Sunday his resurrection\b/i;
const councilOfEuropeWorkForEnglishPattern =
  /\b(?:What does the Council of Europe work for\??|The Council of Europe works (?:only )?for)\b/i;
const saltsjobadenAgreementStiltedEnglishPattern =
  /\b(?:What did the 1938 Saltsj(?:ö|o)baden Agreement become important for|bec(?:o|a)me important for)\b/i;
const humanRightsDefinitionCleftPattern =
  /\b(?:Att mänskliga rättigheter gäller alla betyder att|That human rights apply to everyone means)\b/i;
const policyGoalCleftPattern =
  /\b(?:The goal of .+?\bpolicy means(?: that)?|Målet med .+?politik(?:en)? betyder att)\b/i;
const civilDefenceContextlessPattern =
  /\b(?:Viktiga verksamheter som skola, arbete och hälso- och sjukvård kan fortsätta fungera|Important activities such as school, work, and health care can continue to function|Politiska val ersätts med militära beslut|Political elections are replaced with military decisions)\b/i;
const luciaExplanationRoleScaffoldPattern =
  /\b(?:In a Lucia procession,\s+one person is Lucia|I ett luciatåg\s+(?:är en person Lucia|en person är Lucia))\b/i;
const umeaDemonymOldSwedishPattern = /\bumebor\b/i;
const referendumAdvisorySwedishNaturalnessPattern =
  /\b(?:måste inte följa resultatet|betyder att politikerna måste (?:inte|alltid) följa resultatet)\b/i;
const taxVatTwoConceptPattern =
  /\b(?:skatt och moms|tax and VAT|Företag betalar också skatt,\s+och moms betalas|Companies also pay tax,\s+and VAT is paid|Skatt betalas både av personer som arbetar och av företag\.\s+Moms är|Both people who work and companies pay tax\.\s+VAT is)\b/i;
const q038OldVatDistractorPattern = /\b(?:Vilka varor som har moms|Which goods have VAT)\b/i;
const authoredWayToPromptPattern = /\b(?:Vilket är ett sätt att|Which is a way to)\b/i;
const q026OldMunicipalResponsibilitiesPromptPattern =
  /\b(?:Vilket exempel beskriver kommunernas ansvar|Which example describes municipal responsibilities)\b/i;
const q140OldChristmasPromptPattern =
  /\b(?:Vilket påstående stämmer om julfirande i Sverige|Which statement is correct about Christmas celebrations in Sweden)\b/i;
const christmasTreeStiltedEnglishPattern = /\bwith a tree at Christmas\b/i;
const sourceRecallPromptPattern =
  /\b(?:nämns som exempel|mentioned as examples?|nämns som en anledning|mentioned as a reason|Vad nämns som exempel|What is mentioned as an example|Vilken händelse från[^?!.]*nämns|Which event from[^?!.]*mentioned)\b/i;
const sourceCriticismStiltedEnglishPattern = /\bsource-critical\b/i;
const publicSectorStiltedEnglishPattern =
  /\b(?:What is meant by the public sector in Sweden|Activities for which the state, regions, and municipalities are responsible|The public sector(?: in Sweden)? means (?:activities|all privately owned companies))\b/i;
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

function parseCsvLine(line) {
  return [...line.matchAll(/"((?:""|[^"])*)"(?:,|$)/g)].map((match) =>
    match[1].replaceAll('""', '"'),
  );
}

function contentQuestionBankCsvRowsById(ids) {
  const targetIds = new Set(ids);
  return new Map(
    fs
      .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map(parseCsvLine)
      .filter((columns) => targetIds.has(columns[0]))
      .map((columns) => [columns[0], columns]),
  );
}

function religiousFreedom1951QuestionIds() {
  const sourceQuestions = buildSiteQuestionBank().questions.filter(
    (question) => question.questionProvenance === 'uhr',
  );

  return [
    'q093',
    generatedQuestionId(sourceQuestions, 'q093', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q093', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q093', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q093', 'judgement'),
  ];
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
    cwd: repoRoot,
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
  assert.equal(summary.questionGoodFridayEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(summary.generatedAnswerTemplateParityValidated, summary.generatedPublishedQuestions);
  assert.equal(
    summary.questionReferendumAdvisorySwedishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.questionPublicSectorEnglishNaturalnessValidated, summary.publishedQuestions);
  assert.equal(
    summary.questionSourceCriticismEnglishNaturalnessValidated,
    summary.publishedQuestions,
  );
  assert.equal(summary.derivedCivicStatementPromptMirrorValidated, 2);
});

test('q001 generated answer template parity includes localized true-false options', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.generatedAnswerTemplateParityValidated, summary.generatedPublishedQuestions);
});

test('q160-q169 published option parity keeps localized option overlays expected', () => {
  const result = spawnSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.doesNotMatch(output, /q16[0-9] published source options does not match authored source/);

  if (result.status === 0) {
    assert.match(output, /Content validation OK/);
    return;
  }

  const remainingOptionParityIds = [
    ...output.matchAll(/- (q\d{3}) published source options does not match authored source/g),
  ].map((match) => match[1]);
  const unexpectedIds = remainingOptionParityIds.filter(
    (id) => !/^q0(?:2[1-9]|3[0-9]|40)$/.test(id),
  );

  assert.deepEqual(unexpectedIds, []);
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
  assert.match(summary.criminalResponsibilityCurrentnessValidationDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(summary.criminalResponsibilityCurrentnessEffectiveDateRecheckDue, false);
  assert.equal(summary.criminalResponsibilityCurrentnessPostEffectiveDateRecheckValidated, true);
  assert.equal(summary.criminalResponsibilityCurrentnessPostEffectiveDateRecheckedAt, null);
  assert.equal(summary.criminalResponsibilityCurrentnessPostEffectiveDateStatus, null);
  assert.equal(summary.criminalResponsibilityCurrentnessQuestionsValidated, 5);
  assert.equal(summary.criminalResponsibilityCurrentnessParityValidated, true);
});

test('criminal-responsibility age copy fails closed on the proposal effective date without a recheck', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const RealDate = Date;
class MockDate extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : ['2026-08-02T12:00:00.000Z']));
  }
  static now() {
    return new RealDate('2026-08-02T12:00:00.000Z').getTime();
  }
}
global.Date = MockDate;
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q044 criminal-responsibility proposal outcome must be rechecked on or after 2026-08-02/,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q044 criminal-responsibility source metadata must be retrieved on or after 2026-08-02 once that date is reached/,
  );
});

test('criminal-responsibility age copy accepts an explicit post-effective provisional recheck', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const RealDate = Date;
class MockDate extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : ['2026-08-02T12:00:00.000Z']));
  }
  static now() {
    return new RealDate('2026-08-02T12:00:00.000Z').getTime();
  }
}
global.Date = MockDate;
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/scripts/validate-content.js')) {
    return String(contents)
      .replace("retrievedAt: '2026-05-20'", "retrievedAt: '2026-08-02'")
      .replace(
        'postEffectiveDateRecheck: {\\n    recheckedAt: null,\\n    status: null,',
        "postEffectiveDateRecheck: {\\n    recheckedAt: '2026-08-02',\\n    status: 'confirmed-still-provisional',",
      );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  const summary = JSON.parse(match[0]);
  assert.equal(summary.criminalResponsibilityCurrentnessEffectiveDateRecheckDue, true);
  assert.equal(summary.criminalResponsibilityCurrentnessPostEffectiveDateRecheckValidated, true);
  assert.equal(
    summary.criminalResponsibilityCurrentnessPostEffectiveDateStatus,
    'confirmed-still-provisional',
  );
  assert.equal(summary.criminalResponsibilityCurrentnessPostEffectiveDateRecheckedAt, '2026-08-02');
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

test('private welfare source and exports use natural tax-funding English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const fileFindings = [
    'data/additionalQuestions.ts',
    'content/question-bank.csv',
    'site/questions.js',
  ].filter((relativePath) =>
    privateWelfareTaxFundingStiltedEnglishPattern.test(
      fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
    ),
  );
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const bankFindings = [...generatedSiteBank, ...Array.from(actualSiteBank)]
    .filter((question) =>
      privateWelfareTaxFundingStiltedEnglishPattern.test(textForQuestion(question)),
    )
    .map((question) => question.id);
  const q155 = generatedSiteBank.find((question) => question.id === 'q155');
  const welfareVariantIds = ['q155', 'q776', 'q777', 'q778', 'q779'];
  const welfareVariants = generatedSiteBank.filter((question) =>
    welfareVariantIds.includes(question.id),
  );

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(bankFindings, []);
  assert.ok(q155, 'q155 should be published in the site bank');
  assert.equal(
    q155.q.en,
    'How can a welfare service be provided by a private company but still be funded by tax revenue?',
  );
  assert.equal(
    q155.opts[q155.answer].en,
    'A private company can provide the service while tax revenue funds it',
  );
  assert.equal(welfareVariants.length, welfareVariantIds.length);
  for (const question of welfareVariants) {
    assert.equal(
      privateWelfareTaxFundingStiltedEnglishPattern.test(textForQuestion(question)),
      false,
    );
  }
});

test('private welfare English naturalness guard rejects tax-funded calques', () => {
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
        'How can a welfare service be provided by a private company but still be funded by tax revenue?',
        'How can a welfare service be private and still tax-funded?',
      )
      .replace(
        'A private company can provide the service while tax revenue funds it',
        'A private company can provide the service while tax revenue pays for it',
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
    /q155 uses stilted state-welfare English wording/,
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

test('Umeå demonym source and exports use natural Swedish spelling', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const fileFindings = [
    'data/additionalQuestions.ts',
    'content/question-bank.csv',
    'site/questions.js',
  ].filter((relativePath) =>
    umeaDemonymOldSwedishPattern.test(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')),
  );
  const textForQuestion = (question) =>
    [question.q?.sv, ...(question.opts || []).map((option) => option.sv)].join(' ');
  const bankFindings = [...generatedSiteBank, ...Array.from(actualSiteBank)]
    .filter((question) => umeaDemonymOldSwedishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const umeaDemonymRows = generatedSiteBank.filter((question) =>
    textForQuestion(question).includes('Stockholmare, göteborgare, malmöbor, uppsalabor'),
  );

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(bankFindings, []);
  assert.ok(umeaDemonymRows.length >= 1, 'Umeå demonym distractor should be published');
  for (const question of umeaDemonymRows) {
    assert.match(textForQuestion(question), /umeåbor/);
  }
});

test('Umeå demonym naturalness guard rejects learner-facing umebor', () => {
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
      'Stockholmare, göteborgare, malmöbor, uppsalabor och umeåbor',
      'Stockholmare, göteborgare, malmöbor, uppsalabor och umebor',
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
      '--',
      '--focus-umea-demonym',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q058 uses nonstandard Umeå demonym Swedish wording/,
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

test('Christmas tree prompts keep natural English wording', () => {
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
    christmasTreeStiltedEnglishPattern.test(
      fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
    ),
  );
  const bankFindings = [...generatedSiteBank, ...Array.from(actualSiteBank)]
    .filter((question) => christmasTreeStiltedEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q138 = generatedSiteBank.find((question) => question.id === 'q138');
  const q138SingleChoice = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q138', 'singleChoice'),
  );
  const q138TrueStatement = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q138', 'trueStatement'),
  );
  const q138FalseStatement = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q138', 'falseStatement'),
  );
  const q138Judgement = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q138', 'judgement'),
  );

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(bankFindings, []);
  assert.equal(q138?.q.en, 'What do many people do with a Christmas tree at Christmas in Sweden?');
  assert.equal(
    q138SingleChoice?.q.en,
    'Which answer best matches? What do many people do with a Christmas tree at Christmas in Sweden?',
  );
  assert.equal(
    q138TrueStatement?.q.en,
    'At Christmas, many people bring a Christmas tree into the home and decorate it with strings of lights, baubles, and tinsel.',
  );
  assert.equal(
    q138FalseStatement?.q.en,
    'At Christmas, many people plant a Christmas tree at the cemetery and light grave candles.',
  );
  assert.equal(
    q138Judgement?.q.en,
    'Choose the correct option: What do many people do with a Christmas tree at Christmas in Sweden?',
  );
});

test('All Saints generated true/false stems keep English context', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const generatedById = new Map(generatedSiteBank.map((question) => [question.id, question]));
  const actualById = new Map(actualSiteBank.map((question) => [question.id, question]));
  const expectedQuestions = [
    {
      id: generatedQuestionId(sourceQuestions, 'q104', 'trueStatement'),
      questionSv:
        'På Alla helgons dag är det vanligt att tända ljus på gravar för att minnas och hedra dem som har dött.',
      questionEn:
        'On All Saints’ Day, it is common to light candles on graves to remember and honour people who have died.',
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q104', 'falseStatement'),
      questionSv:
        'På Alla helgons dag är det vanligt att öppna en adventskalender varje dag fram till julafton.',
      questionEn:
        'On All Saints’ Day, it is common to open an Advent calendar every day until Christmas Eve.',
    },
  ];

  for (const expectedQuestion of expectedQuestions) {
    const generatedQuestion = generatedById.get(expectedQuestion.id);
    const actualQuestion = actualById.get(expectedQuestion.id);

    assert.ok(generatedQuestion, `${expectedQuestion.id} should exist in generated site bank`);
    assert.ok(actualQuestion, `${expectedQuestion.id} should exist in static site bank`);
    assert.equal(generatedQuestion.q.sv, expectedQuestion.questionSv);
    assert.equal(generatedQuestion.q.en, expectedQuestion.questionEn);
    assert.equal(actualQuestion.q.sv, expectedQuestion.questionSv);
    assert.equal(actualQuestion.q.en, expectedQuestion.questionEn);
    assert.doesNotMatch(
      generatedQuestion.q.en,
      /^(?:Light candles on graves|Open an Advent calendar)\b/,
    );
  }
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
  assert.ok((output.match(/uses literal common-to-do English wording/g) || []).length >= 4, output);
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

test('referendum advisory Swedish copy stays natural across source and exports', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q020GeneratedIds = [
    generatedQuestionId(sourceQuestions, 'q020', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q020', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q020', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q020', 'judgement'),
  ];
  const q020Ids = ['q020', ...q020GeneratedIds];
  const textForQuestion = (question) =>
    [question.q?.sv, question.why?.sv, ...(question.opts || []).map((option) => option.sv)].join(
      ' ',
    );
  const fileFindings = ['data/questions.ts', 'content/question-bank.csv', 'site/questions.js']
    .filter((relativePath) =>
      referendumAdvisorySwedishNaturalnessPattern.test(
        fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
      ),
    )
    .map((relativePath) => path.normalize(relativePath));
  const generatedOffenders = generatedSiteBank
    .filter((question) => q020Ids.includes(question.id))
    .filter((question) =>
      referendumAdvisorySwedishNaturalnessPattern.test(textForQuestion(question)),
    )
    .map((question) => question.id);
  const actualOffenders = actualSiteBank
    .filter((question) => q020Ids.includes(question.id))
    .filter((question) =>
      referendumAdvisorySwedishNaturalnessPattern.test(textForQuestion(question)),
    )
    .map((question) => question.id);
  const q020 = generatedSiteBank.find((question) => question.id === 'q020');
  const q020True = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q020', 'trueStatement'),
  );
  const q020False = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q020', 'falseStatement'),
  );

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.ok(q020, 'q020 should be published in the site bank');
  assert.equal(q020.opts[0]?.sv, 'Politikerna behöver inte följa resultatet');
  assert.match(q020.why.sv, /politikerna behöver inte följa resultatet/);
  assert.ok(q020True, 'q020 true generated variant should be published');
  assert.ok(q020False, 'q020 false generated variant should be published');
  assert.equal(
    q020True.q.sv,
    'Att folkomröstningar i Sverige är rådgivande betyder att politikerna inte behöver följa resultatet.',
  );
  assert.equal(
    q020False.q.sv,
    'Att folkomröstningar i Sverige är rådgivande betyder att politikerna alltid måste följa resultatet.',
  );
});

test('referendum advisory Swedish naturalness guard rejects old måste inte wording', () => {
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
        'Politikerna behöver inte följa resultatet',
        'Politikerna måste inte följa resultatet',
      )
      .replace(
        'politikerna behöver inte följa resultatet.',
        'politikerna måste inte följa resultatet.',
      );
  }
  if (normalizedPath.endsWith('/scripts/validate-content.js')) {
    return String(contents).replace(
      'validateAuthoredSourceParity();',
      '// validateAuthoredSourceParity skipped for focused q020 fixture;',
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
    /q020 uses ambiguous advisory-referendum Swedish wording/,
  );
});

test('May Day holiday options use natural International Workers Day English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const holidayIds = [
    'q097',
    generatedQuestionId(sourceQuestions, 'q097', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q097', 'judgement'),
    'q100',
    generatedQuestionId(sourceQuestions, 'q100', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q100', 'judgement'),
    'q103',
    generatedQuestionId(sourceQuestions, 'q103', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q103', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q103', 'judgement'),
  ];
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const fileFindings = [
    'data/additionalQuestions.ts',
    'content/question-bank.csv',
    'site/questions.js',
  ].filter((relativePath) =>
    workersDayHolidayEnglishPatterns.some((pattern) =>
      pattern.test(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')),
    ),
  );
  const generatedOffenders = generatedSiteBank
    .filter((question) => holidayIds.includes(question.id))
    .filter((question) =>
      workersDayHolidayEnglishPatterns.some((pattern) => pattern.test(textForQuestion(question))),
    )
    .map((question) => question.id);
  const actualOffenders = actualSiteBank
    .filter((question) => holidayIds.includes(question.id))
    .filter((question) =>
      workersDayHolidayEnglishPatterns.some((pattern) => pattern.test(textForQuestion(question))),
    )
    .map((question) => question.id);
  const q097 = generatedSiteBank.find((question) => question.id === 'q097');
  const q100 = generatedSiteBank.find((question) => question.id === 'q100');
  const q103 = generatedSiteBank.find((question) => question.id === 'q103');

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.ok(q097?.opts.some((option) => option.en === 'May Day demonstrations'));
  assert.ok(q100?.opts.some((option) => option.en === 'Holding May Day demonstrations'));
  assert.ok(
    q103?.opts.some(
      (option) => option.en === "International Workers' Day with demonstrations and speeches",
    ),
  );
});

test('May Day holiday English guard rejects lower-case workers day labels', () => {
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
      .replace('May Day demonstrations', 'Demonstrations on workers’ day')
      .replace('Holding May Day demonstrations', 'Holding demonstrations on workers’ day')
      .replace(
        "International Workers' Day with demonstrations and speeches",
        "Workers' day with demonstrations and speeches",
      );
  }
  return contents;
};
const { buildSiteQuestionBank } = require('./scripts/export-site-question-bank.js');
const bad = buildSiteQuestionBank().questions
  .filter((question) => {
    const text = [
      question.q?.en,
      question.why?.en,
      ...(question.opts || []).map((option) => option.en),
    ].join(' ');
    return /(?:Demonstrations on workers[’'] day|Holding demonstrations on workers[’'] day|Workers[’'] day with demonstrations and speeches|marks workers[’'] day with demonstrations and speeches)/i.test(text);
  })
  .map((question) => question.id);
console.log(JSON.stringify(bad));
if (!bad.includes('q097') || !bad.includes('q100') || !bad.includes('q103') || bad.length < 8) {
  process.exit(1);
}
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, output);
  assert.match(output, /q097/);
  assert.match(output, /q100/);
  assert.match(output, /q103/);
});

test('Good Friday source and exports use natural commemorates English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q101GeneratedIds = [
    generatedQuestionId(sourceQuestions, 'q101', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q101', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q101', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q101', 'judgement'),
  ];
  const q101Ids = ['q101', ...q101GeneratedIds];
  const naturalExplanation =
    "Good Friday commemorates Jesus' death, and Easter Sunday celebrates his resurrection";
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const fileFindings = [
    'data/additionalQuestions.ts',
    'content/question-bank.csv',
    'site/questions.js',
  ].filter((relativePath) =>
    goodFridayRemembersEnglishPattern.test(
      fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
    ),
  );
  const generatedOffenders = generatedSiteBank
    .filter((question) => q101Ids.includes(question.id))
    .filter((question) => goodFridayRemembersEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = actualSiteBank
    .filter((question) => q101Ids.includes(question.id))
    .filter((question) => goodFridayRemembersEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  for (const id of q101Ids) {
    assert.match(
      generatedSiteBank.find((question) => question.id === id)?.why.en ?? '',
      new RegExp(naturalExplanation),
    );
    assert.match(
      actualSiteBank.find((question) => question.id === id)?.why.en ?? '',
      new RegExp(naturalExplanation),
    );
  }
});

test('Good Friday English naturalness guard rejects remembers wording', () => {
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
      "Good Friday commemorates Jesus' death, and Easter Sunday celebrates his resurrection",
      "Good Friday remembers Jesus' death and Easter Sunday his resurrection",
    );
  }
  return contents;
};
const { buildSiteQuestionBank } = require('./scripts/export-site-question-bank.js');
const bad = buildSiteQuestionBank().questions
  .filter((question) =>
    /Good Friday remembers Jesus' death and Easter Sunday his resurrection/i.test(question.why.en),
  )
  .map((question) => question.id);
console.log(JSON.stringify(bad));
if (!bad.includes('q101') || bad.length < 5) process.exit(1);
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, output);
  assert.match(output, /q101/);
});

test('EU cooperation source and exports use natural English article', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q086GeneratedIds = [
    generatedQuestionId(sourceQuestions, 'q086', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q086', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q086', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q086', 'judgement'),
  ];
  const q086Ids = ['q086', ...q086GeneratedIds];
  const naturalExplanation =
    'The EU is a form of political and economic cooperation among European countries';
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const fileFindings = [
    'data/additionalQuestions.ts',
    'content/question-bank.csv',
    'site/questions.js',
  ].filter((relativePath) =>
    euCooperationMissingArticleEnglishPattern.test(
      fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
    ),
  );
  const generatedOffenders = generatedSiteBank
    .filter((question) => q086Ids.includes(question.id))
    .filter((question) => euCooperationMissingArticleEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = actualSiteBank
    .filter((question) => q086Ids.includes(question.id))
    .filter((question) => euCooperationMissingArticleEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);

  assert.deepEqual(fileFindings, []);
  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  for (const id of q086Ids) {
    assert.match(
      generatedSiteBank.find((question) => question.id === id)?.why.en ?? '',
      new RegExp(naturalExplanation),
    );
    assert.match(
      actualSiteBank.find((question) => question.id === id)?.why.en ?? '',
      new RegExp(naturalExplanation),
    );
  }
});

test('EU cooperation English naturalness guard rejects missing article wording', () => {
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
      'The EU is a form of political and economic cooperation among European countries',
      'The EU is political and economic cooperation between European countries',
    );
  }
  return contents;
};
const { buildSiteQuestionBank } = require('./scripts/export-site-question-bank.js');
const bad = buildSiteQuestionBank().questions
  .filter((question) =>
    /The EU is political and economic cooperation between European countries/i.test(question.why.en),
  )
  .map((question) => question.id);
console.log(JSON.stringify(bad));
if (!bad.includes('q086') || bad.length < 5) process.exit(1);
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, output);
  assert.match(output, /q086/);
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

test('religious-freedom 1951 source and exports use natural English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q093GeneratedIds = [
    generatedQuestionId(sourceQuestions, 'q093', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q093', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q093', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q093', 'judgement'),
  ];
  const q093Ids = ['q093', ...q093GeneratedIds];
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const generatedOffenders = generatedSiteBank
    .filter((question) => q093Ids.includes(question.id))
    .filter((question) => religiousFreedom1951StiltedEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = actualSiteBank
    .filter((question) => q093Ids.includes(question.id))
    .filter((question) => religiousFreedom1951StiltedEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => q093Ids.includes(line.match(/^"([^"]+)"/)?.[1]))
    .filter((line) => religiousFreedom1951StiltedEnglishPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1]);
  const q093 = generatedSiteBank.find((question) => question.id === 'q093');
  const q093True = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q093', 'trueStatement'),
  );

  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
  assert.ok(q093, 'q093 should be published in the site bank');
  assert.equal(
    q093.why.en,
    'The Religious Freedom Act in 1951 marked the final breakthrough for religious freedom. The law made it possible to choose any religion freely, or not belong to a religion at all, so the Religious Freedom Act is the correct answer.',
  );
  assert.ok(q093True, 'q093 true generated variant should be published');
  assert.equal(q093True.why.en, q093.why.en);
});

test('religious-freedom 1951 English naturalness guard rejects the old phrasing', () => {
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
      'The Religious Freedom Act in 1951 marked the final breakthrough for religious freedom. The law made it possible to choose any religion freely, or not belong to a religion at all, so the Religious Freedom Act is the correct answer.',
      'The Religious Freedom Act in 1951 marked the final breakthrough for religious freedom. The law made it possible to choose a religion completely freely or not belong to any religion at all, so the Religious Freedom Act is the correct answer.',
    );
  }
  return contents;
};
process.argv.push('scripts/validate-content.js', '--focus-religious-freedom-1951-naturalness');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q093 uses stilted 1951 religious-freedom English wording/,
  );
});

test('religious-freedom 1951 English naturalness reports focused validator coverage', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-religious-freedom-1951-naturalness'],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const summary = JSON.parse(result.stdout.match(/\{[\s\S]*\}/)?.[0] || '{}');
  assert.equal(
    summary.questionReligiousFreedom1951NaturalnessValidated,
    religiousFreedom1951QuestionIds().length * 3,
  );
});

test('religious-freedom 1951 English naturalness guard rejects stale CSV wording', () => {
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
  if (normalizedPath.endsWith('/content/question-bank.csv')) {
    return String(contents).replace(
      'The law made it possible to choose any religion freely, or not belong to a religion at all',
      'The law made it possible to choose a religion completely freely or not belong to any religion at all',
    );
  }
  return contents;
};
process.argv.push('scripts/validate-content.js', '--focus-religious-freedom-1951-naturalness');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q093 uses stilted 1951 religious-freedom English wording in content\/question-bank\.csv/,
  );
});

test('religious-freedom 1951 English naturalness guard rejects stale static wording', () => {
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
  if (normalizedPath.endsWith('/site/questions.js')) {
    return String(contents).replace(
      'The law made it possible to choose any religion freely, or not belong to a religion at all',
      'The law made it possible to choose a religion completely freely or not belong to any religion at all',
    );
  }
  return contents;
};
process.argv.push('scripts/validate-content.js', '--focus-religious-freedom-1951-naturalness');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /site\/questions\.js q093 uses stilted 1951 religious-freedom English wording/,
  );
});

test('source-criticism source and single-choice exports use natural English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q050Ids = [
    'q050',
    generatedQuestionId(sourceQuestions, 'q050', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q050', 'judgement'),
  ];
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const generatedOffenders = generatedSiteBank
    .filter((question) => q050Ids.includes(question.id))
    .filter((question) => sourceCriticismStiltedEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = actualSiteBank
    .filter((question) => q050Ids.includes(question.id))
    .filter((question) => sourceCriticismStiltedEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => q050Ids.includes(line.match(/^"([^"]+)"/)?.[1]))
    .filter((line) => sourceCriticismStiltedEnglishPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1]);
  const q050 = generatedSiteBank.find((question) => question.id === 'q050');
  const q050SingleChoice = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q050', 'singleChoice'),
  );
  const q050Judgement = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q050', 'judgement'),
  );

  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
  assert.ok(q050, 'q050 should be published in the site bank');
  assert.equal(q050.q.en, 'What does source criticism mean?');
  assert.equal(
    q050.why.en,
    'Source criticism means checking and reviewing information by questioning whether what one reads, sees, or hears is correct. This matters because information can come from many kinds of sources and false information can spread quickly; never reading news, trusting only social media, or spreading unchecked claims does the opposite.',
  );
  assert.ok(q050SingleChoice, 'q050 generated single-choice variant should be published');
  assert.equal(
    q050SingleChoice.q.en,
    'Which answer best matches? What does source criticism mean?',
  );
  assert.ok(q050Judgement, 'q050 generated judgement variant should be published');
  assert.equal(q050Judgement.q.en, 'Choose the correct option: What does source criticism mean?');
});

test('source-criticism English naturalness guard rejects source-critical wording', () => {
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
        'What does source criticism mean?',
        'What does it mean to be source-critical?',
      )
      .replace(
        'Source criticism means checking and reviewing information by questioning whether what one reads, sees, or hears is correct.',
        'Being source-critical means checking and reviewing information by questioning whether what one reads, sees, or hears is correct.',
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
    /q050 uses stilted source-criticism English wording/,
  );
});

test('religious-freedom 1860 source and exports use natural English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q115GeneratedIds = [
    generatedQuestionId(sourceQuestions, 'q115', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q115', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q115', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q115', 'judgement'),
  ];
  const q115Ids = ['q115', ...q115GeneratedIds];
  const textForQuestion = (question) =>
    [question.q?.en, question.why?.en, ...(question.opts || []).map((option) => option.en)].join(
      ' ',
    );
  const generatedOffenders = generatedSiteBank
    .filter((question) => q115Ids.includes(question.id))
    .filter((question) => religiousFreedom1860StiltedEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = actualSiteBank
    .filter((question) => q115Ids.includes(question.id))
    .filter((question) => religiousFreedom1860StiltedEnglishPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => q115Ids.includes(line.match(/^"([^"]+)"/)?.[1]))
    .filter((line) => religiousFreedom1860StiltedEnglishPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1]);
  const q115 = generatedSiteBank.find((question) => question.id === 'q115');
  const q115False = generatedSiteBank.find(
    (question) => question.id === generatedQuestionId(sourceQuestions, 'q115', 'falseStatement'),
  );

  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
  assert.ok(q115, 'q115 should be published in the site bank');
  assert.equal(q115.opts?.[1]?.en, 'To freely choose any religion or none');
  assert.equal(
    q115.why.en,
    'In 1860, Swedes were allowed to leave the Church of Sweden, but only if they joined another Christian community. Full freedom to choose any religion or none came with the Religious Freedom Act of 1951, and the separation between the state and the Church of Sweden took place in 2000.',
  );
  assert.ok(q115False, 'q115 false generated variant should be published');
  assert.equal(q115False.q.en, 'In 1860, Swedes were free to choose any religion or none.');
});

test('religious-freedom 1860 English naturalness guard rejects the old phrasing', () => {
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
      'To freely choose any religion or none',
      'To choose any religion or no religion at all completely freely',
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
    /q115 uses stilted 1860 religious-freedom English wording/,
  );
});

test('religious-freedom option parallelism stays natural in exports', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const textForQuestion = (question) =>
    [
      question.q?.sv,
      question.q?.en,
      question.why?.sv,
      question.why?.en,
      ...(question.opts || []).flatMap((option) => [option.sv, option.en]),
    ].join(' ');
  const q116Ids = new Set(['q116', 'q630', 'q633']);
  const generatedOffenders = generatedSiteBank
    .filter((question) => q116Ids.has(question.id))
    .filter((question) => religiousFreedomOptionParallelismPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const actualOffenders = Array.from(actualSiteBank)
    .filter((question) => q116Ids.has(question.id))
    .filter((question) => religiousFreedomOptionParallelismPattern.test(textForQuestion(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => q116Ids.has(line.match(/^"([^"]+)"/)?.[1]))
    .filter((line) => religiousFreedomOptionParallelismPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1]);
  const q116 = generatedSiteBank.find((question) => question.id === 'q116');

  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
  assert.ok(q116, 'q116 should be published in the site bank');
  assert.equal(
    q116.opts?.[0]?.sv,
    'Rätten att utöva sin religion och att skyddas mot diskriminering på grund av tro',
  );
  assert.equal(
    q116.opts?.[0]?.en,
    'The right to practice one’s religion and to be protected from discrimination because of belief',
  );
});

test('religious-freedom option parallelism reports focused validator coverage', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-religious-freedom-parallelism'],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const match = result.stdout.match(/\{\s*"publishedQuestions"[\s\S]*\}/);
  assert.ok(match, 'focused religious-freedom validation should print JSON summary');
  const summary = JSON.parse(match[0]);
  assert.equal(summary.publishedQuestions, buildSiteQuestionBank().questions.length);
  assert.equal(summary.questionReligiousFreedomParallelismValidated, summary.publishedQuestions);
});

test('religious-freedom option parallelism guard rejects the old wording', () => {
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
        'Rätten att utöva sin religion och att skyddas mot diskriminering på grund av tro',
        'Rätten att utöva sin religion och skydd mot diskriminering på grund av tro',
      )
      .replace(
        'The right to practice one’s religion and to be protected from discrimination because of belief',
        'The right to practice one’s religion and protection from discrimination because of belief',
      );
  }
  return contents;
};
process.argv.push('scripts/validate-content.js', '--focus-religious-freedom-parallelism');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q116 uses nonparallel religious-freedom option wording/,
  );
});

test('religious-freedom option parallelism guard rejects stale CSV wording', () => {
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
  if (normalizedPath.endsWith('/content/question-bank.csv')) {
    return String(contents)
      .replace(
        'Rätten att utöva sin religion och att skyddas mot diskriminering på grund av tro',
        'Rätten att utöva sin religion och skydd mot diskriminering på grund av tro',
      )
      .replace(
        'The right to practice one’s religion and to be protected from discrimination because of belief',
        'The right to practice one’s religion and protection from discrimination because of belief',
      );
  }
  return contents;
};
process.argv.push('scripts/validate-content.js', '--focus-religious-freedom-parallelism');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /q116 uses nonparallel religious-freedom option wording in content\/question-bank\.csv/,
  );
});

test('religious-freedom option parallelism guard rejects stale static wording', () => {
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
  if (normalizedPath.endsWith('/site/questions.js')) {
    return String(contents)
      .replace(
        'Rätten att utöva sin religion och att skyddas mot diskriminering på grund av tro',
        'Rätten att utöva sin religion och skydd mot diskriminering på grund av tro',
      )
      .replace(
        'The right to practice one’s religion and to be protected from discrimination because of belief',
        'The right to practice one’s religion and protection from discrimination because of belief',
      );
  }
  return contents;
};
process.argv.push('scripts/validate-content.js', '--focus-religious-freedom-parallelism');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /site\/questions\.js contains nonparallel religious-freedom option wording/,
  );
});

test('religious-freedom option parallelism reports focused validator coverage', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-religious-freedom-parallelism'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  const summary = JSON.parse(result.stdout.match(/\{[\s\S]*\}/)?.[0] || '{}');

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(summary.publishedQuestions, buildSiteQuestionBank().questions.length);
  assert.equal(
    summary.questionReligiousFreedomParallelismValidated,
    buildSiteQuestionBank().questions.length,
  );
});

test('human-rights definition true/false exports use direct propositions', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q175TrueId = generatedQuestionId(sourceQuestions, 'q175', 'trueStatement');
  const q175FalseId = generatedQuestionId(sourceQuestions, 'q175', 'falseStatement');
  const expectedSv = [
    'Mänskliga rättigheter gäller varje människa oavsett bakgrund eller livssituation.',
    'Mänskliga rättigheter gäller bara svenska medborgare.',
  ];
  const expectedEn = [
    'Human rights apply to every person regardless of background or life situation.',
    'Human rights apply only to Swedish citizens.',
  ];
  const generatedRows = [q175TrueId, q175FalseId].map((id) =>
    generatedSiteBank.find((question) => question.id === id),
  );
  const actualRows = [q175TrueId, q175FalseId].map((id) =>
    Array.from(actualSiteBank).find((question) => question.id === id),
  );
  const csvRows = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => [q175TrueId, q175FalseId].includes(line.match(/^"([^"]+)"/)?.[1]));

  assert.ok(generatedRows.every(Boolean), 'generated q175 true/false rows should exist');
  assert.ok(actualRows.every(Boolean), 'static q175 true/false rows should exist');
  assert.equal(csvRows.length, 2);
  assert.deepEqual(
    generatedRows.map((question) => question.q.sv),
    expectedSv,
  );
  assert.deepEqual(
    generatedRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.sv),
    expectedSv,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    [...generatedRows, ...actualRows]
      .filter((question) =>
        humanRightsDefinitionCleftPattern.test(`${question.q.sv} ${question.q.en}`),
      )
      .map((question) => question.id),
    [],
  );
  assert.deepEqual(
    csvRows.filter((line) => humanRightsDefinitionCleftPattern.test(line)),
    [],
  );
});

test('source-criticism definition true/false exports use direct propositions', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const expectedRows = [
    {
      id: generatedQuestionId(sourceQuestions, 'q050', 'trueStatement'),
      sv: 'Källkritik innebär att man ifrågasätter och kontrollerar om information är korrekt.',
      en: 'Source criticism means questioning and checking whether information is correct.',
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q050', 'falseStatement'),
      sv: 'Källkritik innebär att man aldrig läser nyheter.',
      en: 'Source criticism means never reading news.',
    },
  ];
  const residualPattern = /\b(?:Att vara källkritisk betyder|To be source-critical means)\b/i;

  for (const bank of [generatedSiteBank, actualSiteBank]) {
    for (const expected of expectedRows) {
      const question = bank.find((candidate) => candidate.id === expected.id);
      assert.ok(question, `${expected.id} should be present in published bank`);
      assert.equal(question.q.sv, expected.sv);
      assert.equal(question.q.en, expected.en);
      assert.doesNotMatch(`${question.q.sv}\n${question.q.en}`, residualPattern);
    }
  }

  const csvRowsById = contentQuestionBankCsvRowsById(expectedRows.map((row) => row.id));
  const csvOffenders = [];
  for (const expected of expectedRows) {
    const columns = csvRowsById.get(expected.id);
    assert.ok(columns, `${expected.id} should be present in content/question-bank.csv`);
    assert.equal(columns[3], expected.sv);
    assert.equal(columns[4], expected.en);
    if (residualPattern.test(`${columns[3]}\n${columns[4]}`)) csvOffenders.push(expected.id);
  }
  assert.deepEqual(csvOffenders, []);
});

test('political-rights generated true/false exports use direct propositions', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q146TrueId = generatedQuestionId(sourceQuestions, 'q146', 'trueStatement');
  const q146FalseId = generatedQuestionId(sourceQuestions, 'q146', 'falseStatement');
  const expectedSv = [
    'I en demokrati får människor, grupper och partier försöka övertyga andra om sina politiska idéer.',
    'I en demokrati får människor, grupper och partier inte hindra andra från att rösta.',
  ];
  const expectedEn = [
    'In a democracy, people, groups, and parties may try to persuade others of their political ideas.',
    'In a democracy, people, groups, and parties may not stop others from voting.',
  ];
  const generatedRows = [q146TrueId, q146FalseId].map((id) =>
    generatedSiteBank.find((question) => question.id === id),
  );
  const actualRows = [q146TrueId, q146FalseId].map((id) =>
    Array.from(actualSiteBank).find((question) => question.id === id),
  );
  const csvRows = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => [q146TrueId, q146FalseId].includes(line.match(/^"([^"]+)"/)?.[1]));
  const barePhrasePattern = /^(?:Försöka övertyga|Hindra andra|Try to persuade|Stop others)/i;

  assert.ok(generatedRows.every(Boolean), 'generated q146 true/false rows should exist');
  assert.ok(actualRows.every(Boolean), 'static q146 true/false rows should exist');
  assert.equal(csvRows.length, 2);
  assert.deepEqual(
    generatedRows.map((question) => question.q.sv),
    expectedSv,
  );
  assert.deepEqual(
    generatedRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.sv),
    expectedSv,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    [...generatedRows, ...actualRows]
      .filter((question) => barePhrasePattern.test(`${question.q.sv}\n${question.q.en}`))
      .map((question) => question.id),
    [],
  );
  assert.deepEqual(
    csvRows.filter((line) => barePhrasePattern.test(line)),
    [],
  );
});

test('public-sector source and generated exports use direct English propositions', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const expectedExplanation =
    'The public sector consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes. Examples include health-care staff, teachers, childcare workers, police, and firefighters; private companies, banks, and non-profit associations are therefore wrong answers.';
  const expectedRows = [
    {
      id: 'q062',
      q: 'What is the public sector in Sweden?',
      why: expectedExplanation,
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q062', 'singleChoice'),
      q: 'Which answer best matches? What is the public sector in Sweden?',
      why: expectedExplanation,
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q062', 'trueStatement'),
      q: 'The public sector in Sweden consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes.',
      why: expectedExplanation,
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q062', 'falseStatement'),
      q: 'The public sector in Sweden consists only of privately owned companies.',
      why: expectedExplanation,
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q062', 'judgement'),
      q: 'Choose the correct option: What is the public sector in Sweden?',
      why: expectedExplanation,
    },
  ];

  for (const bank of [generatedSiteBank, actualSiteBank]) {
    for (const expected of expectedRows) {
      const question = bank.find((candidate) => candidate.id === expected.id);
      assert.ok(question, `${expected.id} should be present in published bank`);
      assert.equal(question.q.en, expected.q);
      assert.equal(question.why.en, expected.why);
      assert.doesNotMatch(
        `${question.q.en}\n${question.why.en}`,
        publicSectorStiltedEnglishPattern,
      );
    }
  }

  const sourceQuestion = generatedSiteBank.find((question) => question.id === 'q062');
  assert.ok(sourceQuestion, 'q062 should be published in the generated bank');
  assert.ok(
    sourceQuestion.opts.some(
      (option) =>
        option.en ===
        'Services and activities that the state, regions, and municipalities are responsible for and fund through taxes',
    ),
  );

  const csvRowsById = contentQuestionBankCsvRowsById(expectedRows.map((row) => row.id));
  const csvOffenders = [];
  for (const expected of expectedRows) {
    const columns = csvRowsById.get(expected.id);
    assert.ok(columns, `${expected.id} should be present in content/question-bank.csv`);
    assert.equal(columns[4], expected.q);
    assert.equal(columns[6], expected.why);
    if (publicSectorStiltedEnglishPattern.test(`${columns[4]}\n${columns[6]}`)) {
      csvOffenders.push(expected.id);
    }
  }
  assert.deepEqual(csvOffenders, []);
});

test('public-sector English naturalness guard rejects old means-activities wording', () => {
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
        'What is the public sector in Sweden?',
        'What is meant by the public sector in Sweden?',
      )
      .replace(
        'Services and activities that the state, regions, and municipalities are responsible for and fund through taxes',
        'Activities for which the state, regions, and municipalities are responsible',
      )
      .replace(
        'The public sector consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes.',
        'The public sector means activities for which the state, regions, and municipalities are responsible and that are financed by taxes.',
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
    /q062 uses stilted public-sector English wording/,
  );
});

test('gender-equality policy goal true/false exports use direct English propositions', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q053TrueId = generatedQuestionId(sourceQuestions, 'q053', 'trueStatement');
  const q053FalseId = generatedQuestionId(sourceQuestions, 'q053', 'falseStatement');
  const expectedEn = [
    'Sweden’s gender equality policy aims for women and men to have the same rights, duties, and power to influence society and their own lives.',
    'Sweden’s gender equality policy is only about how many women are in politics.',
  ];
  const generatedRows = [q053TrueId, q053FalseId].map((id) =>
    generatedSiteBank.find((question) => question.id === id),
  );
  const actualRows = [q053TrueId, q053FalseId].map((id) =>
    Array.from(actualSiteBank).find((question) => question.id === id),
  );
  const csvRows = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => [q053TrueId, q053FalseId].includes(line.match(/^"([^"]+)"/)?.[1]));

  assert.ok(generatedRows.every(Boolean), 'generated q053 true/false rows should exist');
  assert.ok(actualRows.every(Boolean), 'static q053 true/false rows should exist');
  assert.equal(csvRows.length, 2);
  assert.deepEqual(
    generatedRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    [...generatedRows, ...actualRows]
      .filter((question) => policyGoalCleftPattern.test(`${question.q.sv} ${question.q.en}`))
      .map((question) => question.id),
    [],
  );
  assert.deepEqual(
    csvRows.filter((line) => policyGoalCleftPattern.test(line)),
    [],
  );
});

test('voter-turnout generated true/false exports avoid when-splices', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q015TrueId = generatedQuestionId(sourceQuestions, 'q015', 'trueStatement');
  const q015FalseId = generatedQuestionId(sourceQuestions, 'q015', 'falseStatement');
  const expectedSv = [
    'Ett lågt valdeltagande kan minska människors möjlighet att påverka politiska beslut.',
    'Ett lågt valdeltagande ger alla väljare två röster var i nästa val.',
  ];
  const expectedEn = [
    "Low voter turnout can reduce people's opportunities to influence political decisions.",
    'Low voter turnout gives all voters two votes each in the next election.',
  ];
  const whenSplicePattern =
    /\b(?:när ett lågt valdeltagande påverkar demokratin|when a low voter turnout affects democracy)\b/i;
  const generatedRows = [q015TrueId, q015FalseId].map((id) =>
    generatedSiteBank.find((question) => question.id === id),
  );
  const actualRows = [q015TrueId, q015FalseId].map((id) =>
    Array.from(actualSiteBank).find((question) => question.id === id),
  );
  const csvRows = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => [q015TrueId, q015FalseId].includes(line.match(/^"([^"]+)"/)?.[1]));

  assert.ok(generatedRows.every(Boolean), 'generated q015 true/false rows should exist');
  assert.ok(actualRows.every(Boolean), 'static q015 true/false rows should exist');
  assert.equal(csvRows.length, 2);
  assert.deepEqual(
    generatedRows.map((question) => question.q.sv),
    expectedSv,
  );
  assert.deepEqual(
    generatedRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.sv),
    expectedSv,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    [...generatedRows, ...actualRows]
      .filter((question) => whenSplicePattern.test(`${question.q.sv} ${question.q.en}`))
      .map((question) => question.id),
    [],
  );
  assert.deepEqual(
    csvRows.filter((line) => whenSplicePattern.test(line)),
    [],
  );
});

test('civil-defence generated true/false exports keep war-or-crisis context', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q164TrueId = generatedQuestionId(sourceQuestions, 'q164', 'trueStatement');
  const q164FalseId = generatedQuestionId(sourceQuestions, 'q164', 'falseStatement');
  const expectedSv = [
    'Vid krig eller kris hjälper det civila försvaret viktiga verksamheter som skola, arbete och hälso- och sjukvård att fortsätta fungera.',
    'Vid krig eller kris ersätter det civila försvaret politiska val med militära beslut.',
  ];
  const expectedEn = [
    'During war or crisis, civil defence helps important services such as school, work, and health care continue.',
    'During war or crisis, civil defence replaces political elections with military decisions.',
  ];
  const generatedRows = [q164TrueId, q164FalseId].map((id) =>
    generatedSiteBank.find((question) => question.id === id),
  );
  const actualRows = [q164TrueId, q164FalseId].map((id) =>
    Array.from(actualSiteBank).find((question) => question.id === id),
  );
  const csvRows = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => [q164TrueId, q164FalseId].includes(line.match(/^"([^"]+)"/)?.[1]));

  assert.ok(generatedRows.every(Boolean), 'generated q164 true/false rows should exist');
  assert.ok(actualRows.every(Boolean), 'static q164 true/false rows should exist');
  assert.equal(csvRows.length, 2);
  assert.deepEqual(
    generatedRows.map((question) => question.q.sv),
    expectedSv,
  );
  assert.deepEqual(
    generatedRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.sv),
    expectedSv,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    [...generatedRows, ...actualRows]
      .filter((question) =>
        [question.q.sv, question.q.en].some((text) => civilDefenceContextlessPattern.test(text)),
      )
      .map((question) => question.id),
    [],
  );
  assert.deepEqual(
    csvRows.filter((line) => civilDefenceContextlessPattern.test(line)),
    [],
  );
});

test('media and web generated true/false exports keep direct propositions', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const rowIds = [
    generatedQuestionId(sourceQuestions, 'q151', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q151', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q152', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q152', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q153', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q153', 'falseStatement'),
  ];
  const expectedSv = [
    'Reklamfinansierade medier drivs ofta av privata företag och får inkomster genom reklam.',
    'Reklamfinansierade medier får aldrig sälja reklamplats.',
    'Många tidningar finns också på internet och uppdateras med nyheter flera gånger per dag.',
    'Många tidningar får bara säljas som ett exemplar per år.',
    'På webben och i sociala medier kan vem som helst skapa innehåll, och innehållet kontrolleras inte alltid som i andra medier.',
    'På webben och i sociala medier får bara ansvariga utgivare skriva inlägg.',
  ];
  const expectedEn = [
    'Advertising-funded media are often run by private companies and earn income from advertising.',
    'Advertising-funded media may never sell advertising space.',
    'Many newspapers are also available online and updated with news several times per day.',
    'Many newspapers may be sold only as one copy per year.',
    'On the web and in social media, anyone can create content, and it is not always checked the same way as in other media.',
    'On the web and in social media, only responsible publishers may write posts.',
  ];
  const residualFragmentPattern =
    /^(?:De|They)\s+(?:drivs|får|finns|are often|are also|may)\b|\b(?:innehåll där|content there|inlägg där|posts there)\b/i;
  const generatedRows = rowIds.map((id) =>
    generatedSiteBank.find((question) => question.id === id),
  );
  const actualRows = rowIds.map((id) =>
    Array.from(actualSiteBank).find((question) => question.id === id),
  );
  const csvRows = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => rowIds.includes(line.match(/^"([^"]+)"/)?.[1]));

  assert.ok(generatedRows.every(Boolean), 'generated media/web true/false rows should exist');
  assert.ok(actualRows.every(Boolean), 'static media/web true/false rows should exist');
  assert.equal(csvRows.length, rowIds.length);
  assert.deepEqual(
    generatedRows.map((question) => question.q.sv),
    expectedSv,
  );
  assert.deepEqual(
    generatedRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.sv),
    expectedSv,
  );
  assert.deepEqual(
    actualRows.map((question) => question.q.en),
    expectedEn,
  );
  assert.deepEqual(
    [...generatedRows, ...actualRows]
      .filter((question) => residualFragmentPattern.test(`${question.q.sv} ${question.q.en}`))
      .map((question) => question.id),
    [],
  );
  assert.deepEqual(
    csvRows.filter((line) => residualFragmentPattern.test(line)),
    [],
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
    'People can influence society and participate in democracy by contacting politicians, joining a demonstration, or signing a petition.',
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
  assert.equal(
    q026SectionPractice.q.sv,
    'Vilket svar stämmer bäst? Vilka vardagstjänster ansvarar kommuner för?',
  );
  assert.equal(
    q026SectionPractice.q.en,
    'Which answer best matches? Which everyday services are municipalities responsible for?',
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

test('generated parity validator derives expectations from the production generator', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'scripts/validate-content.js'), 'utf8');

  assert.match(
    source,
    /const derivedQuestionModule = loadTs\('lib\/content\/derivedQuestions\.ts'\);/,
  );
  assert.match(
    source,
    /derivePublishedQuestions\(sourceQuestions,\s*sourceQuestions\.length \+ 1\)/,
  );
  assert.doesNotMatch(source, /const expected = expectedGeneratedPrompt\(sourceQuestion/);
  assert.doesNotMatch(source, /const expected = expectedGeneratedExplanation\(sourceQuestion/);
  assert.doesNotMatch(source, /const expected = expectedGeneratedAnswerShape\(sourceQuestion/);
});

test('criminal-responsibility currentness guard derives generated ids from the source row', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'scripts/validate-content.js'), 'utf8');

  assert.match(source, /sourceId: 'q044'/);
  assert.match(source, /function criminalResponsibilityCurrentnessQuestionIds\(\)/);
  assert.match(source, /sourceIndex \* GENERATED_VARIANTS_PER_SOURCE/);
  assert.doesNotMatch(source, /ids:\s*\[[^\]]*q\d{3}/);
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

test('published question schema validates localized q001 generated answer templates', () => {
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
      "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(\\n  sourceQuestions,\\n  sourceQuestions.length + 1,\\n).map(applyQuestionLocalizationPilot);",
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(",
        "  sourceQuestions,",
        "  sourceQuestions.length + 1,",
        ").map(applyQuestionLocalizationPilot).map((question) =>",
        "  question.id === generatedFixtureId('q001', 1)",
        "    ? {",
        "        ...question,",
        "        options: question.options.map((option, index) =>",
        "          index === 0",
        "            ? { ...option, text: { ...option.text, en: 'Template drift' } }",
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
    /q001 generated variant\[1\] options do not match generated answer template/,
  );
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

test('generated definition true/false variants use direct bilingual propositions', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = Array.from(actualStaticQuestions());
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const expectedRows = [
    {
      id: generatedQuestionId(sourceQuestions, 'q027', 'trueStatement'),
      sv: 'I Sveriges konstitutionella monarki är statschefen kung eller drottning utan politisk makt.',
      en: "In Sweden's constitutional monarchy, the head of state is a king or queen without political power.",
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q027', 'falseStatement'),
      sv: 'I Sveriges konstitutionella monarki har monarken all politisk makt.',
      en: "In Sweden's constitutional monarchy, the monarch has all political power.",
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q092', 'trueStatement'),
      sv: 'Sverige är en sekulär stat, så staten är religiöst neutral och varken tar ställning för eller diskriminerar någon religion.',
      en: 'Sweden is a secular state, so the state is religiously neutral and neither takes sides for nor discriminates against any religion.',
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q092', 'falseStatement'),
      sv: 'Sverige är en sekulär stat, så alla måste tillhöra samma religion.',
      en: 'Sweden is a secular state, so everyone must belong to the same religion.',
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q145', 'trueStatement'),
      sv: 'Hemliga val betyder att väljare inte behöver avslöja hur de röstar.',
      en: 'Secret elections mean voters do not have to reveal how they vote.',
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q145', 'falseStatement'),
      sv: 'Hemliga val betyder att bara myndigheter får veta hur varje person röstar.',
      en: 'Secret elections mean only authorities may know how each person votes.',
    },
  ];
  const residualPattern =
    /\b(?:Att (?:Sverige är (?:en konstitutionell monarki|en sekulär stat)|val i en demokrati är hemliga) betyder att|That (?:Sweden is (?:a constitutional monarchy|a secular state)|elections in a democracy are secret) means\b)/i;

  for (const bank of [generatedSiteBank, actualSiteBank]) {
    for (const expected of expectedRows) {
      const question = bank.find((candidate) => candidate.id === expected.id);
      assert.ok(question, `${expected.id} should be present in published bank`);
      assert.equal(question.q.sv, expected.sv);
      assert.equal(question.q.en, expected.en);
    }
  }

  const targetIds = new Set(expectedRows.map((row) => row.id));
  const learnerText = (question) => `${question.q.sv}\n${question.q.en}`;
  const generatedOffenders = generatedSiteBank
    .filter((question) => targetIds.has(question.id))
    .filter((question) => residualPattern.test(learnerText(question)))
    .map((question) => question.id);
  const actualOffenders = actualSiteBank
    .filter((question) => targetIds.has(question.id))
    .filter((question) => residualPattern.test(learnerText(question)))
    .map((question) => question.id);
  const csvOffenders = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => targetIds.has(line.match(/^"([^"]+)"/)?.[1]))
    .filter((line) => residualPattern.test(line))
    .map((line) => line.match(/^"([^"]+)"/)?.[1]);

  assert.deepEqual(generatedOffenders, []);
  assert.deepEqual(actualOffenders, []);
  assert.deepEqual(csvOffenders, []);
  assert.equal(
    residualPattern.test(fs.readFileSync(path.join(repoRoot, 'site/questions.js'), 'utf8')),
    false,
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

test('published question schema guards generated statement-choice meta prompts and boilerplate', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );

  assert.match(validatorSource, /Vilket påstående är korrekt/);
  assert.match(validatorSource, /Vilket påstående stämmer bäst/);
  assert.match(validatorSource, /Which statement is correct/);
  assert.match(validatorSource, /Which statement best matches/);
  assert.match(validatorSource, /påståendet som motsvarar den uppgiften/);
  assert.match(validatorSource, /statement that matches that fact/);
  assert.match(validatorSource, /universalHumanRightsStatementSv/);
  assert.match(validatorSource, /Mänskliga rättigheter gäller varje människa/);
  assert.match(validatorSource, /Human rights apply to every person/);
  assert.match(validatorSource, /That human rights apply to everyone means/);
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

test('published question schema rejects generated true/false English stems that drop Sweden scope', () => {
  const sourceQuestions = buildSiteQuestionBank().questions.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q055TrueId = generatedQuestionId(sourceQuestions, 'q055', 'trueStatement');
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
      'What applies to buying sex in Sweden?',
      'What applies to buying sex?',
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
    new RegExp(`${q055TrueId} contains a generated true/false grammar-splice stem`),
  );
});

test('published question schema rejects generated how-can-affect when-splices', () => {
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
        'Falska uppgifter kan spridas snabbt när falsk information påverkar demokratin.',
      )
      .replace(
        "Sweden's northernmost part lies north of the Arctic Circle.",
        'False information can spread quickly when false information affects democracy.',
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

test('published question schema rejects voter-turnout generated when-splice residuals', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q015TrueId = generatedQuestionId(sourceQuestions, 'q015', 'trueStatement');
  const q015FalseId = generatedQuestionId(sourceQuestions, 'q015', 'falseStatement');
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
        "const voterTurnoutWhenSpliceResiduals = {",
        "  [generatedFixtureId('q015', 1)]: { questionSv: 'Människor kan få mindre möjlighet att påverka politiska beslut när ett lågt valdeltagande påverkar demokratin.', questionEn: 'People may have fewer opportunities to influence political decisions when a low voter turnout affects democracy.' },",
        "  [generatedFixtureId('q015', 2)]: { questionSv: 'Alla väljare får två röster var i nästa val när ett lågt valdeltagande påverkar demokratin.', questionEn: 'All voters get two votes each in the next election when a low voter turnout affects democracy.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  voterTurnoutWhenSpliceResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...voterTurnoutWhenSpliceResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
process.argv.push('--focus-generated-true-false-naturalness');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(
    output,
    new RegExp(`${q015TrueId} contains a generated true/false grammar-splice stem`),
  );
  assert.match(
    output,
    new RegExp(`${q015FalseId} contains a generated true/false grammar-splice stem`),
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
  const fixtures = [
    [
      'Att Sverige är en sekulär stat betyder att staten är religiöst neutral.',
      'That Sweden is a secular state means the state is religiously neutral.',
    ],
    [
      'Att val i en demokrati är hemliga betyder att väljare inte behöver avslöja hur de röstar.',
      'That elections in a democracy are secret means voters do not have to reveal how they vote.',
    ],
  ];

  for (const [questionSv, questionEn] of fixtures) {
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
	        ${JSON.stringify(questionSv)},
	      )
	      .replace(
	        "Sweden's northernmost part lies north of the Arctic Circle.",
	        ${JSON.stringify(questionEn)},
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
  }
});

test('published question schema rejects human-rights definition-cleft true/false stems', () => {
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
        "const humanRightsDefinitionResiduals = {",
        "  [generatedFixtureId('q175', 1)]: { questionSv: 'Att mänskliga rättigheter gäller alla betyder att varje människa har rättigheter oavsett bakgrund eller livssituation.', questionEn: 'That human rights apply to everyone means every person has rights regardless of background or life situation.' },",
        "  [generatedFixtureId('q175', 2)]: { questionSv: 'Att mänskliga rättigheter gäller alla betyder att bara svenska medborgare har mänskliga rättigheter.', questionEn: 'That human rights apply to everyone means only Swedish citizens have human rights.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  humanRightsDefinitionResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...humanRightsDefinitionResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
process.argv.push('--focus-generated-true-false-naturalness');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /q877 contains a generated true\/false grammar-splice stem/);
  assert.match(output, /q878 contains a generated true\/false grammar-splice stem/);
});

test('published question schema rejects source-criticism definition-cleft true/false stems', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q050TrueId = generatedQuestionId(sourceQuestions, 'q050', 'trueStatement');
  const q050FalseId = generatedQuestionId(sourceQuestions, 'q050', 'falseStatement');
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
        "const sourceCriticismDefinitionResiduals = {",
        "  [generatedFixtureId('q050', 1)]: { questionSv: 'Att vara källkritisk betyder att ifrågasätta och kontrollera om information är korrekt.', questionEn: 'To be source-critical means questioning and checking whether information is correct.' },",
        "  [generatedFixtureId('q050', 2)]: { questionSv: 'Att vara källkritisk betyder att aldrig läsa nyheter.', questionEn: 'To be source-critical means never reading news.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  sourceCriticismDefinitionResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...sourceCriticismDefinitionResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
process.argv.push('--focus-generated-true-false-naturalness');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(
    output,
    new RegExp(`${q050TrueId} contains a generated true/false grammar-splice stem`),
  );
  assert.match(
    output,
    new RegExp(`${q050FalseId} contains a generated true/false grammar-splice stem`),
  );
});

test('published question schema rejects policy-goal cleft true/false stems', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q053TrueId = generatedQuestionId(sourceQuestions, 'q053', 'trueStatement');
  const q053FalseId = generatedQuestionId(sourceQuestions, 'q053', 'falseStatement');
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
        "const genderEqualityPolicyGoalResiduals = {",
        "  [generatedFixtureId('q053', 1)]: { questionSv: 'Målet med Sveriges folkhälsopolitik betyder att människor ska ha lika möjligheter till en god hälsa.', questionEn: 'The goal of Sweden’s public health policy means people should have equal opportunities for good health.' },",
        "  [generatedFixtureId('q053', 2)]: { questionSv: 'Målet med Sveriges jämställdhetspolitik betyder att jämställdhet bara handlar om hur många kvinnor som finns i politiken.', questionEn: 'The goal of Sweden’s gender equality policy means that gender equality is only about how many women are in politics.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  genderEqualityPolicyGoalResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...genderEqualityPolicyGoalResiduals[question.id],",
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
  assert.match(
    output,
    new RegExp(`${q053TrueId} contains a generated true/false grammar-splice stem`),
  );
  assert.match(
    output,
    new RegExp(`${q053FalseId} contains a generated true/false grammar-splice stem`),
  );
});

test('published question schema rejects generated variants that drop Sweden scope in English', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q070SingleChoiceId = generatedQuestionId(sourceQuestions, 'q070', 'singleChoice');
  const q070JudgementId = generatedQuestionId(sourceQuestions, 'q070', 'judgement');
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
        "const generatedScopeResiduals = {",
        "  [generatedFixtureId('q070', 0)]: { questionSv: 'Vilka betalar skatt i Sverige?', questionEn: 'Who pays tax?' },",
        "  [generatedFixtureId('q070', 3)]: { questionSv: 'Vilket svar stämmer bäst? Vilka betalar skatt i Sverige?', questionEn: 'Which answer best matches? Who pays tax?' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  generatedScopeResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...generatedScopeResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
process.argv.push('--focus-generated-sweden-scope-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(
    output,
    new RegExp(`${q070SingleChoiceId} drops Sweden scope from generated English question`),
  );
  assert.match(
    output,
    new RegExp(`${q070JudgementId} drops Sweden scope from generated English question`),
  );
});

test('published question schema rejects civil-defence contextless true/false stems', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q164TrueId = generatedQuestionId(sourceQuestions, 'q164', 'trueStatement');
  const q164FalseId = generatedQuestionId(sourceQuestions, 'q164', 'falseStatement');
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
        "const civilDefenceContextlessResiduals = {",
        "  [generatedFixtureId('q164', 1)]: { questionSv: 'Viktiga verksamheter som skola, arbete och hälso- och sjukvård kan fortsätta fungera.', questionEn: 'Important activities such as school, work, and health care can continue to function.' },",
        "  [generatedFixtureId('q164', 2)]: { questionSv: 'Politiska val ersätts med militära beslut.', questionEn: 'Political elections are replaced with military decisions.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  civilDefenceContextlessResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...civilDefenceContextlessResiduals[question.id],",
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
  assert.match(
    output,
    new RegExp(`${q164TrueId} contains a generated true/false grammar-splice stem`),
  );
  assert.match(
    output,
    new RegExp(`${q164FalseId} contains a generated true/false grammar-splice stem`),
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

test('q146 political-rights generated true/false exports direct propositions', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const byId = new Map(generatedSiteBank.map((question) => [question.id, question]));
  const trueStatement = byId.get(generatedQuestionId(sourceQuestions, 'q146', 'trueStatement'));
  const falseStatement = byId.get(generatedQuestionId(sourceQuestions, 'q146', 'falseStatement'));

  assert.equal(
    trueStatement?.q.sv,
    'I en demokrati får människor, grupper och partier försöka övertyga andra om sina politiska idéer.',
  );
  assert.equal(
    trueStatement?.q.en,
    'In a democracy, people, groups, and parties may try to persuade others of their political ideas.',
  );
  assert.equal(
    falseStatement?.q.sv,
    'I en demokrati får människor, grupper och partier inte hindra andra från att rösta.',
  );
  assert.equal(
    falseStatement?.q.en,
    'In a democracy, people, groups, and parties may not stop others from voting.',
  );
});

test('task-question generated true/false exports use direct propositions', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const expectedRows = [
    {
      id: generatedQuestionId(sourceQuestions, 'q022', 'trueStatement'),
      sv: 'Riksdagen beslutar om lagar och hur statens pengar ska användas.',
      en: 'The Riksdag passes laws and decides how state funds are used.',
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q022', 'falseStatement'),
      sv: 'Riksdagen sköter regionernas kollektivtrafik.',
      en: 'The Riksdag manages regional public transport.',
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q059', 'trueStatement'),
      sv: 'Sametinget representerar den samiska befolkningen i frågor om språk, kultur och identitet.',
      en: 'The Sami Parliament represents the Sami population on questions of language, culture, and identity.',
    },
    {
      id: generatedQuestionId(sourceQuestions, 'q059', 'falseStatement'),
      sv: 'Sametinget beslutar statens budget.',
      en: 'The Sami Parliament decides the state budget.',
    },
  ];
  const generatedById = new Map(generatedSiteBank.map((question) => [question.id, question]));
  const actualById = new Map(Array.from(actualSiteBank).map((question) => [question.id, question]));
  const residualPattern = /\b(?:har uppgiften att|has the task to|One task of .+? is to)\b/i;

  for (const expected of expectedRows) {
    const generated = generatedById.get(expected.id);
    const actual = actualById.get(expected.id);
    assert.ok(generated, `${expected.id} should be present in generated bank`);
    assert.ok(actual, `${expected.id} should be present in static bank`);
    assert.equal(generated.q.sv, expected.sv);
    assert.equal(generated.q.en, expected.en);
    assert.equal(actual.q.sv, expected.sv);
    assert.equal(actual.q.en, expected.en);
    assert.doesNotMatch(`${generated.q.sv}\n${generated.q.en}`, residualPattern);
    assert.doesNotMatch(`${actual.q.sv}\n${actual.q.en}`, residualPattern);
  }

  const csvRowsById = contentQuestionBankCsvRowsById(expectedRows.map((row) => row.id));
  for (const expected of expectedRows) {
    const columns = csvRowsById.get(expected.id);
    assert.ok(columns, `${expected.id} should be present in content/question-bank.csv`);
    assert.equal(columns[3], expected.sv);
    assert.equal(columns[4], expected.en);
    assert.doesNotMatch(`${columns[3]}\n${columns[4]}`, residualPattern);
  }
});

test('q062 public-sector exports natural English in canonical and static banks', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const actualSiteBank = actualStaticQuestions();
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const rowIds = [
    'q062',
    generatedQuestionId(sourceQuestions, 'q062', 'singleChoice'),
    generatedQuestionId(sourceQuestions, 'q062', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q062', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q062', 'judgement'),
  ];
  const byId = new Map(generatedSiteBank.map((question) => [question.id, question]));
  const actualById = new Map(Array.from(actualSiteBank).map((question) => [question.id, question]));
  const stalePattern =
    /What is meant by the public sector|public sector(?: in Sweden)? means (?:activities for which|all privately owned companies)|Activities for which the state, regions, and municipalities are responsible/i;

  assert.equal(byId.get('q062')?.q.en, 'What is the public sector in Sweden?');
  assert.equal(
    byId.get(generatedQuestionId(sourceQuestions, 'q062', 'trueStatement'))?.q.en,
    'The public sector in Sweden consists of services and activities that the state, regions, and municipalities are responsible for and fund through taxes.',
  );
  assert.equal(
    byId.get(generatedQuestionId(sourceQuestions, 'q062', 'falseStatement'))?.q.en,
    'The public sector in Sweden consists only of privately owned companies.',
  );
  assert.ok(
    rowIds.every((id) => byId.has(id)),
    'canonical q062 generated rows should exist',
  );
  assert.ok(
    rowIds.every((id) => actualById.has(id)),
    'static q062 generated rows should exist',
  );

  const combinedText = [
    ...rowIds.map((id) => byId.get(id)),
    ...rowIds.map((id) => actualById.get(id)),
  ]
    .map(
      (question) =>
        `${question?.q.en} ${question?.why.en} ${question?.opts?.map((option) => option.en).join(' ')}`,
    )
    .join('\n');
  assert.doesNotMatch(combinedText, stalePattern);

  const csvRows = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/)
    .filter((line) => rowIds.includes(line.match(/^"([^"]+)"/)?.[1]));
  assert.equal(csvRows.length, rowIds.length);
  assert.deepEqual(
    csvRows.filter((line) => stalePattern.test(line)),
    [],
  );
});

test('published question schema rejects generated true/false bare answer phrases', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const expectedOffenderIds = [
    generatedQuestionId(sourceQuestions, 'q146', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q146', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q157', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q157', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q158', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q158', 'falseStatement'),
    generatedQuestionId(sourceQuestions, 'q159', 'trueStatement'),
    generatedQuestionId(sourceQuestions, 'q159', 'falseStatement'),
  ];
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
process.argv.push('--focus-generated-true-false-naturalness');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  for (const id of expectedOffenderIds) {
    assert.match(output, new RegExp(`${id} contains a generated true/false grammar-splice stem`));
  }
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 8);
});

test('published question schema uses the shared generated true/false naturalness pattern source', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  assert.match(validatorSource, /require\('\.\/generated-true-false-naturalness-patterns'\)/);
  assert.doesNotMatch(
    validatorSource,
    /const\s+QUESTION_GENERATED_TRUE_FALSE_NATURALNESS_PATTERNS\s*=\s*\[/,
  );

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
        "const sharedPatternOnlyResiduals = {",
        "  [generatedFixtureId('q146', 1)]: { questionSv: 'Det stämmer i sak att människor får övertyga andra.', questionEn: 'It is factually true that people may persuade others.' },",
        "  [generatedFixtureId('q146', 2)]: { questionSv: 'Det stämmer i sak att partier får hindra röster.', questionEn: 'It is factually true that parties may stop votes.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  sharedPatternOnlyResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...sharedPatternOnlyResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
process.argv.push('--focus-generated-true-false-naturalness');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.equal(output.match(/contains a generated true\/false grammar-splice stem/g)?.length, 2);
});

test('published question schema rejects All Saints generated true/false English action fragments', () => {
  const generatedSiteBank = buildSiteQuestionBank().questions;
  const sourceQuestions = generatedSiteBank.filter(
    (question) => question.questionProvenance === 'uhr',
  );
  const q104TrueId = generatedQuestionId(sourceQuestions, 'q104', 'trueStatement');
  const q104FalseId = generatedQuestionId(sourceQuestions, 'q104', 'falseStatement');
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
        "const allSaintsEnglishFragmentResiduals = {",
        "  [generatedFixtureId('q104', 1)]: { questionEn: 'Light candles on graves to remember and honour people who have died.' },",
        "  [generatedFixtureId('q104', 2)]: { questionEn: 'Open an Advent calendar every day until Christmas Eve.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  allSaintsEnglishFragmentResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...allSaintsEnglishFragmentResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
process.argv.push('--focus-generated-true-false-naturalness');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(
    output,
    new RegExp(`${q104TrueId} contains a generated true/false grammar-splice stem`),
  );
  assert.match(
    output,
    new RegExp(`${q104FalseId} contains a generated true/false grammar-splice stem`),
  );
  assert.ok(
    (output.match(/contains a generated true\/false grammar-splice stem/g) ?? []).length >= 2,
    output,
  );
});

test('published question schema rejects generated municipal-services answer fragments', () => {
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
        "const municipalServicesResiduals = {",
        "  [generatedFixtureId('q026', 1)]: { questionSv: 'Vatten och avlopp, omsorg, snöröjning, parkskötsel och vuxenutbildning.', questionEn: 'Water and sewage, care services, snow removal, park maintenance, and adult education.' },",
        "  [generatedFixtureId('q026', 2)]: { questionSv: 'Skicka ambassadörer till andra länder.', questionEn: 'Sending ambassadors to other countries.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  municipalServicesResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...municipalServicesResiduals[question.id],",
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

test('published question schema guards capitalized generated reason clauses', () => {
  const patternSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/generated-true-false-naturalness-patterns.js'),
    'utf8',
  );

  assert.match(patternSource, /\/\^En anledning är att Det\\b\//);
  assert.match(patternSource, /\/\^One reason is that It\\b\//);
});

test('published question schema guards targetless generated why-reason stems', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );

  assert.match(validatorSource, /\/\^En anledning är\\b\//);
  assert.match(validatorSource, /\/\^One reason is\\b\//);
});

test('published question schema reports focused generated why-reason guard coverage', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-generated-why-reason-stems'],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const match = result.stdout.match(/\{\s*"generatedWhyReasonTargetStemsValidated"[\s\S]*\}/);
  assert.ok(match, 'focused generated why-reason validation should print JSON summary');
  const summary = JSON.parse(match[0]);
  assert.ok(summary.generatedWhyReasonTargetStemsValidated > 0);
  assert.equal(summary.generatedWhyReasonTargetStemParityValidated, true);
});

test('published question schema reports focused generated localization overlay parity', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-generated-localization-template-parity'],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const match = result.stdout.match(/\{\s*"generatedLocalizationTemplateParityValidated"[\s\S]*\}/);
  assert.ok(match, 'focused generated localization validation should print JSON summary');
  const summary = JSON.parse(match[0]);
  assert.ok(summary.generatedLocalizationTemplateParityValidated > 0);
  assert.ok(summary.generatedPromptTemplateParityValidated > 0);
  assert.ok(summary.generatedAnswerTemplateParityValidated > 0);
  assert.ok(summary.generatedPublishedQuestions > 0);
});

test('published question schema rejects unlocalized expected generated option text maps in focused mode', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const scriptPath = path.join(process.cwd(), 'scripts/validate-content.js');
const source = fs
  .readFileSync(scriptPath, 'utf8')
  .replace(
    ".map((question) =>\\n        typeof applyQuestionLocalizationPilot === 'function'\\n          ? applyQuestionLocalizationPilot(question)\\n          : question,\\n      )",
    '',
  );
const mod = new Module(scriptPath, module);
mod.filename = scriptPath;
mod.paths = Module._nodeModulePaths(path.dirname(scriptPath));
process.argv.push('scripts/validate-content.js', '--focus-generated-localization-template-parity');
mod._compile(source, scriptPath);
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /text map does not match localization overlay/,
  );
});

test('published question schema rejects targetless generated why-reason stems in focused mode', () => {
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
        "const targetlessWhyReasonResiduals = {",
        "  [generatedFixtureId('q032', 1)]: { questionSv: 'En anledning är att valet är hemligt och ingen annan ska se vilket val de gör.', questionEn: 'One reason is the vote is secret and no one else should see their choice.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  targetlessWhyReasonResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...targetlessWhyReasonResiduals[question.id],",
        "      }",
        "    : question,",
        ");",
      ].join('\\n'),
    );
  }
  return contents;
};
process.argv.push('scripts/validate-content.js', '--focus-generated-why-reason-stems');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /contains a targetless generated why-reason stem/,
  );
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
process.argv.push('--focus-generated-true-false-naturalness');
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

test('published question schema rejects generated media pronoun answer fragments', () => {
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
        "const mediaPronounResiduals = {",
        "  [generatedFixtureId('q151', 1)]: { questionSv: 'De drivs ofta av privata företag och får inkomster genom reklam.', questionEn: 'They are often run by private companies and earn income from advertising.' },",
        "  [generatedFixtureId('q151', 2)]: { questionSv: 'De får aldrig sälja reklamplats.', questionEn: 'They may never sell advertising space.' },",
        "  [generatedFixtureId('q152', 1)]: { questionSv: 'De finns också på internet och uppdateras med nyheter flera gånger per dag.', questionEn: 'They are also available online and updated with news several times per day.' },",
        "  [generatedFixtureId('q152', 2)]: { questionSv: 'De får bara säljas som ett exemplar per år.', questionEn: 'They may be sold only as one copy per year.' },",
        "};",
        "export const questions: PracticeQuestion[] = [...sourceQuestions, ...generatedPublishedQuestions].map((question) =>",
        "  mediaPronounResiduals[question.id]",
        "    ? {",
        "        ...question,",
        "        ...mediaPronounResiduals[question.id],",
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
      "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(\\n  sourceQuestions,\\n  sourceQuestions.length + 1,\\n).map(applyQuestionLocalizationPilot);",
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(",
        "  sourceQuestions,",
        "  sourceQuestions.length + 1,",
        ").map(applyQuestionLocalizationPilot).map((question) =>",
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
        ").map(applyQuestionLocalizationPilot);",
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
      "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(\\n  sourceQuestions,\\n  sourceQuestions.length + 1,\\n).map(applyQuestionLocalizationPilot);",
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(",
        "  sourceQuestions,",
        "  sourceQuestions.length + 1,",
        ").map(applyQuestionLocalizationPilot).map((question) =>",
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
        ").map(applyQuestionLocalizationPilot);",
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

test('published question schema rejects generated single-choice meta prompts', () => {
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
      "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(\\n  sourceQuestions,\\n  sourceQuestions.length + 1,\\n).map(applyQuestionLocalizationPilot);",
      [
        ${JSON.stringify(generatedFixtureIdHelperSource())},
        "export const generatedPublishedQuestions: PracticeQuestion[] = derivePublishedQuestions(",
        "  sourceQuestions,",
        "  sourceQuestions.length + 1,",
        ").map(applyQuestionLocalizationPilot).map((question) =>",
        "  question.id === generatedFixtureId('q001', 0)",
        "    ? {",
        "        ...question,",
        "        questionSv: 'Vilket svar är korrekt? Var ligger Sverige?',",
        "        questionEn: 'Which answer is correct? Where is Sweden located?',",
        "      }",
        "    : question,",
        ").map(applyQuestionLocalizationPilot);",
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
    /generated variant\[0\] uses generated single-choice meta-stem wording/,
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
