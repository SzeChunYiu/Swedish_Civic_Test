const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { createMemoryMMKV, loadTsWithStorage } = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const themeModeUtilityE2ePath = path.join(repoRoot, 'tests/e2e/theme-mode-utility-routes.spec.ts');
const citizenshipRequirementsStorageId = 'citizenship-requirements';
const checkedAreaIdsKey = 'citizenshipRequirements.checkedAreaIds.v1';
const legacyChecklistStateKey = 'citizenshipRequirementsChecklistState';

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
  'uhrCivicTestFaq',
  'uhrCivicTestRegistration',
  'uhrCivicStudyMaterial',
  'governmentCivicTestSchedule',
  'governmentIncomeBaseAmount2026',
];

const expectedOfficialUrls = [
  'https://www.migrationsverket.se/du-vill-ansoka/svenskt-medborgarskap/medborgarskap-for-vuxna/medborgarskap-for-vuxna.html',
  'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.regeringen.se/regeringsuppdrag/2026/02/andring-av-uppdraget-till-goteborgs-universitet-och-stockholms-universitet-att-bista-universitets--och-hogskoleradet-med-utvecklingen-av-ett-medborgarskapsprov/',
  'https://www.regeringen.se/artiklar/2025/11/inkomstbasbelopp-och-inkomstindex-for-ar-2026-faststallt/',
];
const forbiddenCitizenshipRequirementSourceAuthorityPatterns = [
  /\bUHR says\b/i,
  /\bUHR\s+säger\b/i,
  /säger\s+Migrationsverket\b/i,
  /\bMigrationsverket\s+says\b/i,
  /\bMigrationsverket\s+(?:also\s+)?describes\b/i,
  /\bMigrationsverket\s+anger\s+(?:också\s+)?krav\b/i,
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readThemeModeUtilityE2eSource() {
  return fs.readFileSync(themeModeUtilityE2ePath, 'utf8');
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

function loadCitizenshipRequirementsStore(initialStorageValues) {
  return loadCitizenshipRequirementsStoreWithStorage(createMemoryMMKV(initialStorageValues));
}

function loadCitizenshipRequirementsStoreWithStorage(storage) {
  const storeModule = loadTsWithStorage(repoRoot, 'lib/storage/citizenshipRequirementsStore.ts', {
    [citizenshipRequirementsStorageId]: storage,
  });

  return {
    storage,
    store: storeModule.useCitizenshipRequirementsChecklistStore,
  };
}

function runFocusedCitizenshipRequirementsActionsValidation() {
  return spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-citizenship-requirements-actions'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
}

function extractNamedStyle(source, styleName) {
  const match = source.match(new RegExp(`${styleName}:\\s*\\{[\\s\\S]*?\\n\\s*\\},`));
  assert.ok(match, `${styleName} style must exist`);
  return match[0];
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
  assert.match(
    areas.find((area) => area.id === 'civicKnowledge').detail.sv,
    /Anmälan öppnar i början av juni 2026/,
  );
  assert.match(
    areas.find((area) => area.id === 'civicKnowledge').detail.sv,
    /samhällskunskapsprovet kan bara göras på svenska/,
  );
  assert.doesNotMatch(areas.find((area) => area.id === 'civicKnowledge').detail.sv, /UHR säger/);
  assert.match(
    areas.find((area) => area.id === 'civicKnowledge').detail.sv,
    /Antalet platser är begränsat/,
  );
  assert.match(
    areas.find((area) => area.id === 'civicKnowledge').detail.en,
    /Registration opens in early June 2026/,
  );
  assert.match(
    areas.find((area) => area.id === 'civicKnowledge').detail.en,
    /civic-knowledge test itself can only be taken in Swedish/,
  );
  assert.doesNotMatch(areas.find((area) => area.id === 'civicKnowledge').detail.en, /UHR says/);
  assert.match(areas.find((area) => area.id === 'civicKnowledge').detail.en, /Seats are limited/);
  assert.match(areas.find((area) => area.id === 'swedishLanguage').detail.en, /1 October 2027/);
});

test('citizenship requirements area copy avoids redundant source-authority phrasing', () => {
  const { citizenshipRequirementAreas } = loadTs('data/citizenshipRequirements.ts');

  for (const area of citizenshipRequirementAreas) {
    for (const field of ['summary', 'detail']) {
      for (const language of ['sv', 'en']) {
        for (const pattern of forbiddenCitizenshipRequirementSourceAuthorityPatterns) {
          assert.doesNotMatch(
            area[field][language],
            pattern,
            `${area.id}.${field}.${language} should state facts neutrally; source rows carry provenance`,
          );
        }
      }
    }
  }

  const identity = citizenshipRequirementAreas.find((area) => area.id === 'identity');
  const selfSupport = citizenshipRequirementAreas.find((area) => area.id === 'selfSupport');
  const habitualResidence = citizenshipRequirementAreas.find(
    (area) => area.id === 'habitualResidence',
  );

  assert.match(identity.detail.sv, /kan medborgarskap normalt bli aktuellt tidigast efter 10 år/);
  assert.match(identity.detail.en, /citizenship can normally become possible no earlier/);
  assert.match(selfSupport.detail.sv, /Kraven gäller också varaktig inkomst/);
  assert.match(selfSupport.detail.en, /The requirements also cover long-term income/);
  assert.match(habitualResidence.detail.sv, /Migrationsverket avgör/);
  assert.match(habitualResidence.detail.en, /Migrationsverket decides/);
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

test('citizenship requirement area copy states sourced facts without UHR-says phrasing', () => {
  const { citizenshipRequirementAreas } = loadTs('data/citizenshipRequirements.ts');

  for (const area of citizenshipRequirementAreas) {
    for (const field of ['summary', 'detail']) {
      for (const language of ['sv', 'en']) {
        const text = area[field][language];

        for (const pattern of forbiddenCitizenshipRequirementSourceAuthorityPatterns) {
          assert.doesNotMatch(
            text,
            pattern,
            `${area.id}.${field}.${language} should state the fact and rely on source rows for provenance`,
          );
        }
      }
    }
  }

  const civicKnowledge = citizenshipRequirementAreas.find((area) => area.id === 'civicKnowledge');

  assert.match(civicKnowledge.detail.sv, /Anmälan öppnar i början av juni 2026/);
  assert.match(civicKnowledge.detail.en, /Registration opens in early June 2026/);
  assert.match(civicKnowledge.detail.sv, /skilt från de prov i svenska som införs senare/);
  assert.match(civicKnowledge.detail.en, /separate from the Swedish-language tests/);
  assert.ok(civicKnowledge.sourceIds.includes('uhrCivicTestFaq'));
  assert.ok(civicKnowledge.sourceIds.includes('uhrCivicTestRegistration'));
});

test('citizenship requirements screen renders interactive sourced checklist without eligibility overclaim', () => {
  const routeSource = read('app/citizenship-requirements.tsx');
  const checkboxRowCheckedStyle = extractNamedStyle(routeSource, 'checkboxRowChecked');
  const checkboxBoxCheckedStyle = extractNamedStyle(routeSource, 'checkboxBoxChecked');
  const checkboxDotStyle = extractNamedStyle(routeSource, 'checkboxDot');

  assert.match(routeSource, /citizenshipRequirementAreas\.map/);
  assert.match(routeSource, /useSettingsStore/);
  assert.match(routeSource, /QuestionDisclaimer/);
  assert.match(routeSource, /clearPersistenceWarning/);
  assert.match(routeSource, /onDismiss=\{clearPersistenceWarning\}/);
  assert.match(routeSource, /accessibilityRole="checkbox"/);
  assert.match(routeSource, /accessibilityState=\{\{\s*checked\s*\}\}/);
  assert.match(routeSource, /aria-checked=\{checked\}/);
  assert.match(routeSource, /buildSummary\(/);
  assert.match(routeSource, /sourceIds\.map\(sourceForId\)/);
  assert.match(
    routeSource,
    /accessibilityLabel=\{`\$\{copy\.openSourceHint\}: \$\{source\.title\[language\]\}`\}/,
  );
  assert.match(routeSource, /href=\{source\.url\}/);
  assert.match(routeSource, /target="_blank"/);
  assert.match(routeSource, /rel="noreferrer"/);
  assert.match(routeSource, /<Text style=\{styles\.sourceUrl\}>\{source\.url\}<\/Text>/);
  assert.doesNotMatch(routeSource, /Linking\.openURL\(source\.url\)/);
  assert.match(routeSource, /Migrationsverket always decides the application/);
  assert.match(routeSource, /Migrationsverket avgör alltid ansökan/);
  assert.match(routeSource, /const \{ colors: themeColors \} = useTheme\(\);/);
  assert.match(
    routeSource,
    /const styles = useMemo\(\(\) => createStyles\(themeColors\), \[themeColors\]\);/,
  );
  assert.match(routeSource, /testID=\{`citizenship-requirement-\$\{area\.id\}-checkbox`\}/);
  assert.match(routeSource, /testID=\{`citizenship-requirement-\$\{area\.id\}-checkbox-box`\}/);
  assert.match(routeSource, /testID=\{`citizenship-requirement-\$\{area\.id\}-checkbox-check`\}/);
  assert.match(routeSource, /<ScreenShell[\s\S]*themeColors=\{themeColors\}/);
  assert.match(routeSource, /<QuestionDisclaimer themeColors=\{themeColors\}/);
  assert.match(routeSource, /function createStyles\(themeColors: ThemeColors\)/);
  assert.match(checkboxRowCheckedStyle, /backgroundColor: themeColors\.successSoft/);
  assert.match(checkboxRowCheckedStyle, /borderColor: themeColors\.success/);
  assert.match(checkboxBoxCheckedStyle, /backgroundColor: themeColors\.success/);
  assert.match(checkboxBoxCheckedStyle, /borderColor: themeColors\.success/);
  assert.match(checkboxDotStyle, /backgroundColor: themeColors\.surface/);
  assert.doesNotMatch(routeSource, /import \{ colors[,}]/);
  assert.doesNotMatch(routeSource, /\bcolors\./);
  assert.doesNotMatch(routeSource, /guaranteed eligible|garanterat behörig|official app/i);
});

test('citizenship requirements cards surface precise source titles and currentness metadata', () => {
  const routeSource = read('app/citizenship-requirements.tsx');
  const routeLinkSource = read('components/ui/RouteLink.tsx');
  const sourceHrefCount = (routeSource.match(/href=\{source\.url\}/g) || []).length;
  const sourceRefRowStyle = extractNamedStyle(routeSource, 'sourceRefRow');
  const sourceRefRowFocusedStyle = extractNamedStyle(routeSource, 'sourceRefRowFocused');
  const sourceRowFocusedStyle = extractNamedStyle(routeSource, 'sourceRowFocused');

  assert.match(routeSource, /areaSourceAccessibilityPrefix/);
  assert.match(routeSource, /areaSourceAccessibilityPrefix: 'Källa för'/);
  assert.match(routeSource, /areaSourceAccessibilityPrefix: 'Source for'/);
  assert.match(routeSource, /source\.title\[language\]/);
  assert.match(routeSource, /formatSourceMeta\(source, copy\)/);
  assert.match(routeSource, /source\.sourceDate/);
  assert.match(routeSource, /source\.retrievedDate/);
  assert.match(routeSource, /source\.url/);
  assert.match(routeSource, /styles\.sourceRefRow/);
  assert.match(routeSource, /const \[focusedSourceRow, setFocusedSourceRow\] = useState/);
  assert.match(routeSource, /onFocus=\{\(\) => setFocusedSourceRow\(sourceFocusKey\)\}/);
  assert.match(routeSource, /onBlur=\{\(\) => setFocusedSourceRow\(null\)\}/);
  assert.match(
    routeSource,
    /focusedSourceRow === sourceFocusKey \? styles\.sourceRefRowFocused : null/,
  );
  assert.match(
    routeSource,
    /focusedSourceRow === sourceFocusKey \? styles\.sourceRowFocused : null/,
  );
  assert.match(routeLinkSource, /accessibilityRole="link"/);
  assert.match(routeSource, /rel="noreferrer"/);
  assert.match(routeSource, /target="_blank"/);
  assert.match(sourceRefRowStyle, /minHeight: space\[6\]/);
  assert.match(sourceRefRowFocusedStyle, /backgroundColor: themeColors\.focusSoft/);
  assert.match(sourceRefRowFocusedStyle, /borderColor: themeColors\.focus/);
  assert.match(sourceRowFocusedStyle, /backgroundColor: themeColors\.focusSoft/);
  assert.match(sourceRowFocusedStyle, /borderColor: themeColors\.focus/);
  assert.equal(
    sourceHrefCount >= 2,
    true,
    'area source refs and official source list should both render source URL anchors',
  );
  assert.doesNotMatch(routeSource, /Linking\.openURL\(source\.url\)/);
  assert.doesNotMatch(
    routeSource,
    /areaSources\.map\(\(source\) => source\.publisher\)\.join\(' · '\)/,
    'area cards must not collapse source provenance to publisher-only labels',
  );
});

test('citizenship dark source-affordance e2e covers Swedish and English locale names', () => {
  const source = readThemeModeUtilityE2eSource();

  assert.match(source, /const citizenshipSourceAffordanceCases = \[/);
  assert.match(source, /for \(const testCase of citizenshipSourceAffordanceCases\)/);
  assert.match(
    source,
    /checkboxName: \/Ej markerad:\/[\s\S]*disclaimerLabel: \/Studieinformation: Oberoende studieverktyg\/[\s\S]*language: 'sv'[\s\S]*practiceLinkName: 'Öppna övningsläget för samhällskunskap'[\s\S]*sourceLinkName: \/Migrationsverket: Ansök om svenskt medborgarskap\//,
  );
  assert.match(
    source,
    /checkboxName: \/Not marked:\/[\s\S]*disclaimerLabel: \/Study disclaimer: Independent study tool\/[\s\S]*language: 'en'[\s\S]*practiceLinkName: 'Open civic knowledge practice mode'[\s\S]*sourceLinkName: \/Migrationsverket: Apply for Swedish citizenship\//,
  );
  assert.match(source, /checkedCheckboxName: \/Markerad:\//);
  assert.match(source, /checkedCheckboxName: \/Marked:\//);
  assert.match(source, /citizenship-requirement-identity-checkbox/);
  assert.match(source, /citizenship-requirement-identity-checkbox-box/);
  assert.match(source, /citizenship-requirement-identity-checkbox-check/);
  assert.match(source, /darkColors\.successSoft/);
  assert.match(source, /darkColors\.success/);
  assert.match(source, /darkColors\.surfaceWarm/);
  assert.match(source, /darkColors\.textDisclaimer/);
  assert.match(source, /darkColors\.accent/);
  assert.match(source, /await expectNoHorizontalOverflow\(page\);/);
});

test('citizenship requirements route is discoverable from about-the-test copy', () => {
  const aboutSource = read('app/about-the-test.tsx');

  assert.match(aboutSource, /href="\/citizenship-requirements"/);
  assert.match(aboutSource, /Se kravguiden/);
  assert.match(aboutSource, /View requirements guide/);
  assert.match(aboutSource, /accessibilityLabel=\{copy\.openRequirementsAccessibilityLabel\}/);
});

test('citizenship requirements bottom actions use shared RouteLink variants', () => {
  const result = runFocusedCitizenshipRequirementsActionsValidation();
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused citizenship requirements action validation should print JSON');
  const summary = JSON.parse(match[0]);
  assert.equal(summary.citizenshipRequirementsActionRouteLinkRulesValidated, 8);
  assert.equal(summary.citizenshipRequirementsActionRouteLinkParityValidated, true);

  const routeSource = read('app/citizenship-requirements.tsx');
  const routeLinkSource = read('components/ui/RouteLink.tsx');
  const actionsMatch = routeSource.match(
    /<View style=\{styles\.actions\}>\s*([\s\S]*?)\s*<\/View>/,
  );
  assert.ok(actionsMatch, 'bottom action block should exist');

  const actionsSource = actionsMatch[1];
  assert.equal(actionsSource.match(/<RouteLink\b/g)?.length, 2);
  assert.match(
    actionsSource,
    /accessibilityLabel=\{copy\.openPracticeAccessibilityLabel\}[\s\S]*href="\/practice"[\s\S]*variant="primary"/,
  );
  assert.match(
    actionsSource,
    /accessibilityLabel=\{copy\.backAboutAccessibilityLabel\}[\s\S]*href="\/about-the-test"[\s\S]*variant="secondary"/,
  );
  assert.doesNotMatch(actionsSource, /<Link\b/);
  assert.doesNotMatch(routeSource, /from 'expo-router'/);
  assert.doesNotMatch(routeSource, /styles\.(?:primaryLink|secondaryLink)/);
  assert.doesNotMatch(routeSource, /\b(?:primaryLink|secondaryLink):\s*\{/);
  assert.match(routeLinkSource, /base:\s*\{[\s\S]*minHeight:\s*space\[6\]/);
  assert.match(routeLinkSource, /primaryInteractive:\s*\{[\s\S]*themeColors\.accentActive/);
  assert.match(routeLinkSource, /interactive:\s*\{[\s\S]*themeColors\.focusSoft/);
  assert.match(routeLinkSource, /pressed:\s*\{[\s\S]*themeColors\.focusSoft/);
  assert.match(routeLinkSource, /primaryPressed:\s*\{[\s\S]*themeColors\.accentActive/);
});

test('citizenship requirements checklist reads valid primary state before legacy state', () => {
  const { store } = loadCitizenshipRequirementsStore({
    [checkedAreaIdsKey]: JSON.stringify(['conduct', 'identity', 'unknown', 'conduct']),
    [legacyChecklistStateKey]: JSON.stringify({
      checkedAreaIds: ['selfSupport', 'swedishLanguage'],
    }),
  });

  const state = store.getState();

  assert.deepEqual(state.checkedAreaIds, ['identity', 'conduct']);
  assert.equal(state.persistenceWarning, null);
});

test('citizenship requirements checklist recovers legacy state when primary JSON is corrupt', () => {
  const { storage, store } = loadCitizenshipRequirementsStore({
    [checkedAreaIdsKey]: '{not-json',
    [legacyChecklistStateKey]: JSON.stringify({
      checkedAreaIds: ['selfSupport', 'identity', 'prototype', 'swedishLanguage', 'identity'],
    }),
  });

  const state = store.getState();

  assert.deepEqual(state.checkedAreaIds, ['identity', 'selfSupport', 'swedishLanguage']);
  assert.equal(state.persistenceWarning?.storageId, citizenshipRequirementsStorageId);
  assert.equal(state.persistenceWarning?.key, checkedAreaIdsKey);
  assert.equal(state.persistenceWarning?.operation, 'read');
  assert.match(state.persistenceWarning?.errorMessage || '', /JSON|Unexpected|position/i);
  assert.equal(
    storage.getString(checkedAreaIdsKey),
    JSON.stringify(['identity', 'selfSupport', 'swedishLanguage']),
  );
  assert.equal(
    storage.getString(legacyChecklistStateKey),
    JSON.stringify({ checkedAreaIds: ['identity', 'selfSupport', 'swedishLanguage'] }),
  );
});

test('citizenship requirements checklist keeps recovered legacy state if writeback fails', () => {
  const storage = createMemoryMMKV({
    [checkedAreaIdsKey]: '{not-json',
    [legacyChecklistStateKey]: JSON.stringify({
      checkedAreaIds: ['conduct', 'identity', 'unknown', 'conduct'],
    }),
  });
  storage.set = () => {
    throw new Error('citizenship writeback failed');
  };
  const { store } = loadCitizenshipRequirementsStoreWithStorage(storage);

  const state = store.getState();

  assert.deepEqual(state.checkedAreaIds, ['identity', 'conduct']);
  assert.equal(state.persistenceWarning?.storageId, citizenshipRequirementsStorageId);
  assert.equal(state.persistenceWarning?.key, checkedAreaIdsKey);
  assert.equal(state.persistenceWarning?.operation, 'read');
  assert.match(state.persistenceWarning?.errorMessage || '', /JSON|Unexpected|position/i);
  assert.equal(storage.getString(checkedAreaIdsKey), '{not-json');
});
