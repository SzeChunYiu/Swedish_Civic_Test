const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

const expectedAreaIds = [
  'identity',
  'residenceStatus',
  'habitualResidence',
  'conduct',
  'selfSupport',
  'civicKnowledge',
  'swedishLanguage',
];

const expectedSourceIds = [
  'migrationsverketAdultApplication',
  'migrationsverketRules2026',
  'uhrCivicTestOverview',
  'uhrCivicTestRegistration',
  'uhrCivicStudyMaterial',
  'governmentCivicTestSchedule',
  'governmentIncomeBaseAmount2026',
];

const expectedOfficialUrls = [
  'https://www.migrationsverket.se/du-vill-ansoka/svenskt-medborgarskap/medborgarskap-for-vuxna/medborgarskap-for-vuxna.html',
  'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.regeringen.se/regeringsuppdrag/2026/02/andring-av-uppdraget-till-goteborgs-universitet-och-stockholms-universitet-att-bista-universitets--och-hogskoleradet-med-utvecklingen-av-ett-medborgarskapsprov/',
  'https://www.regeringen.se/artiklar/2025/11/inkomstbasbelopp-och-inkomstindex-for-ar-2026-faststallt/',
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadTs(relativePath) {
  const source = read(relativePath);
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };

  new Function('module', 'exports', output)(mod, mod.exports);

  return mod.exports;
}

function assertLocalizedText(value, label) {
  assert.equal(typeof value, 'object', `${label} should be a localized object`);

  for (const language of ['sv', 'en']) {
    assert.equal(typeof value[language], 'string', `${label}.${language} should be text`);
    assert.ok(value[language].trim().length >= 4, `${label}.${language} should not be empty`);
  }
}

test('citizenship requirements data covers seven sourced bilingual planning areas', () => {
  const data = loadTs('data/citizenshipRequirements.ts');
  const areas = data.citizenshipRequirementAreas;
  const sources = data.citizenshipRequirementSources;
  const sourceIds = new Set(sources.map((source) => source.id));

  assert.deepEqual(
    areas.map((area) => area.id),
    expectedAreaIds,
  );
  assert.deepEqual(
    areas.map((area) => area.order),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.deepEqual(
    sources.map((source) => source.id),
    expectedSourceIds,
  );
  assert.equal(data.CITIZENSHIP_REQUIREMENTS_RETRIEVED_DATE, '2026-05-19');
  assert.equal(data.CITIZENSHIP_REQUIREMENTS_EFFECTIVE_DATE, '2026-06-06');
  assert.equal(data.CITIZENSHIP_CIVIC_TEST_FIRST_DATE, '2026-08-15');
  assert.equal(data.CITIZENSHIP_CIVIC_KNOWLEDGE_TEST_DEADLINE_DATE, '2026-08-17');
  assert.equal(data.CITIZENSHIP_SWEDISH_READING_LISTENING_DEADLINE_DATE, '2027-10-01');
  assert.equal(data.CITIZENSHIP_REQUIREMENTS_INCOME_BASE_AMOUNT_2026_SEK, 83400);
  assert.equal(data.CITIZENSHIP_REQUIREMENTS_SELF_SUPPORT_YEARLY_SEK_2026, 250200);

  for (const area of areas) {
    assertLocalizedText(area.badge, `${area.id}.badge`);
    assertLocalizedText(area.title, `${area.id}.title`);
    assertLocalizedText(area.summary, `${area.id}.summary`);
    assertLocalizedText(area.detail, `${area.id}.detail`);
    assertLocalizedText(area.checklistPrompt, `${area.id}.checklistPrompt`);
    assert.ok(area.sourceIds.length >= 1, `${area.id} should cite at least one source`);
    for (const sourceId of area.sourceIds) {
      assert.equal(sourceIds.has(sourceId), true, `${area.id} cites unknown source ${sourceId}`);
    }
  }

  assert.match(areas.find((area) => area.id === 'selfSupport').summary.sv, /250 200 kronor/);
  assert.match(areas.find((area) => area.id === 'selfSupport').summary.en, /SEK 250,200/);
  assert.match(areas.find((area) => area.id === 'civicKnowledge').summary.sv, /15 augusti 2026/);
  assert.match(areas.find((area) => area.id === 'swedishLanguage').detail.en, /1 October 2027/);
});

test('citizenship requirement sources are official, dated, and currentness-labelled', () => {
  const { citizenshipRequirementSources } = loadTs('data/citizenshipRequirements.ts');

  assert.deepEqual(
    citizenshipRequirementSources.map((source) => source.url),
    expectedOfficialUrls,
  );

  for (const source of citizenshipRequirementSources) {
    assertLocalizedText(source.title, `${source.id}.title`);
    assert.match(source.url, /^https:\/\/(www\.)?(migrationsverket|uhr|regeringen)\.se\//);
    if (source.sourceDate) {
      assert.match(source.sourceDate, /^\d{4}-\d{2}-\d{2}$/);
    }
    assert.equal(source.retrievedDate, '2026-05-19');
  }
});

test('citizenship requirements screen renders interactive sourced checklist without eligibility overclaim', () => {
  const routeSource = read('app/citizenship-requirements.tsx');

  assert.match(routeSource, /citizenshipRequirementAreas\.map/);
  assert.match(routeSource, /useSettingsStore/);
  assert.match(routeSource, /QuestionDisclaimer/);
  assert.match(routeSource, /ComplianceActionLink/);
  assert.match(routeSource, /getVisibleLinkDestination/);
  assert.match(routeSource, /accessibilityRole="checkbox"/);
  assert.match(routeSource, /accessibilityState=\{\{\s*checked\s*\}\}/);
  assert.match(routeSource, /aria-checked=\{checked\}/);
  assert.match(routeSource, /buildSummary\(/);
  assert.match(routeSource, /formatSourceMeta\(/);
  assert.match(routeSource, /sourceIds\.map\(sourceForId\)/);
  assert.match(routeSource, /openSourceAccessibilityLabel: \(publisher, title\) =>/);
  assert.match(routeSource, /accessibilityHint=\{copy\.openSourceHint\}/);
  assert.match(routeSource, /accessibilityLabel=\{copy\.openSourceAccessibilityLabel\(/);
  assert.match(routeSource, /detail=\{getVisibleLinkDestination\(source\.url\)\}/);
  assert.match(routeSource, /href=\{source\.url\}/);
  assert.match(routeSource, /rel="noreferrer"/);
  assert.match(routeSource, /target="_blank"/);
  assert.match(routeSource, /Migrationsverket always decides the application/);
  assert.match(routeSource, /Migrationsverket avgör alltid ansökan/);
  assert.doesNotMatch(routeSource, /Linking\.openURL\(source\.url\)/);
  assert.doesNotMatch(routeSource, /guaranteed eligible|garanterat behörig|official app/i);
});

test('citizenship requirements route is discoverable from about-the-test copy', () => {
  const aboutSource = read('app/about-the-test.tsx');

  assert.match(aboutSource, /href="\/citizenship-requirements"/);
  assert.match(aboutSource, /Se kravguiden/);
  assert.match(aboutSource, /View requirements guide/);
  assert.match(aboutSource, /accessibilityLabel=\{copy\.openRequirementsAccessibilityLabel\}/);
});
