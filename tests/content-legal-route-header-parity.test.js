const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const expectedLegalRoutes = [
  {
    file: 'app/disclaimer.tsx',
    requiredSnippets: [
      'const disclaimerCopy: Record<AppLanguage, DisclaimerRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = disclaimerCopy[language];',
      'Ansvarsfriskrivning',
      'Oberoende studieverktyg',
      'Disclaimer',
      'Independent study tool',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.independentStudyTool\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.practiceContent\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.sourceMaterial\.title\}>/,
    ],
    title: 'Disclaimer',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Independent study tool', 'Practice content', 'Use with source material'],
  },
  {
    file: 'app/privacy.tsx',
    requiredSnippets: [
      'const privacyCopy: Record<AppLanguage, PrivacyRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = privacyCopy[language];',
      'Integritetspolicy',
      'Inget konto krävs',
      'Privacy policy',
      'No account required',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.noAccountRequired\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.localProgressStorage\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.adsAndPurchases\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.adConsent\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.providerProcessing\.title\}>/,
    ],
    title: 'Privacy policy',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: [
      'No account required',
      'Local progress storage',
      'Ads and purchases',
      'Ad consent',
      'Provider processing',
    ],
  },
  {
    file: 'app/terms.tsx',
    requiredSnippets: [
      'const termsCopy: Record<AppLanguage, TermsRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = termsCopy[language];',
      'Användarvillkor',
      'Studieändamål',
      'Terms of use',
      'Study purpose',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.studyPurpose\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.noGuarantee\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.sourceMaterial\.title\}>/,
    ],
    title: 'Terms of use',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Study purpose', 'No guarantee', 'Respect source material'],
  },
  {
    file: 'app/sources.tsx',
    requiredSnippets: [
      'const sourcesCopy: Record<AppLanguage, SourcesRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = sourcesCopy[language];',
      'Källor',
      'Primärt studiematerial',
      'UHR står inte bakom dem',
      'Källa hämtad 2026-05-19',
      'Varje övningsfråga visar en källrad med UHR:s kapitel',
      'Sources',
      'Primary study material',
      'quality is not checked by UHR or any other authority',
      'Source accessed 2026-05-19',
      'Every practice question shows a source line with the UHR chapter',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.primaryStudyMaterial\.title\}[\s\S]*?action=\{/,
      /<LegalSection\s+title=\{copy\.sections\.questionReferences\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.authorityBoundaries\.title\}[\s\S]*?action=\{/,
    ],
    title: 'Sources',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Primary study material', 'Question references', 'Authority boundaries'],
  },
  {
    file: 'app/support.tsx',
    requiredSnippets: [
      'const supportCopy: Record<AppLanguage, SupportRouteCopy> = {',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = supportCopy[language];',
      'Support och återkoppling',
      'Vad du kan rapportera',
      'Support and feedback',
      'What to report',
      'Öppna den offentliga supportsidan',
      'Open public support page',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.whatToReport\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.noPersonalData\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.independentStudyTool\.title\}>/,
      /<LegalSection\s+title=\{copy\.sections\.publicSupportPage\.title\}[\s\S]*?action=\{/,
    ],
    title: 'Support and feedback',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: [
      'What to report',
      'No personal data',
      'Independent study tool',
      'Public support page',
    ],
  },
];

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('legal, source, and support routes stay on shared accessible header path', () => {
  const summary = parseValidationSummary();
  const legalPage = fs.readFileSync(
    path.join(repoRoot, 'components/compliance/LegalPage.tsx'),
    'utf8',
  );

  assert.equal(summary.legalRouteHeadersValidated, 23);
  assert.equal(summary.legalRouteHeaderParityValidated, true);
  assert.equal(summary.swedishPrivacyStreakCopyNaturalnessValidated, true);
  assert.equal(summary.legalSwedishEnglishTokenGuardValidated, 49);
  assert.equal(summary.legalSwedishEnglishTokenGuardParityValidated, true);
  assert.match(legalPage, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(legalPage, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);

  for (const expectedRoute of expectedLegalRoutes) {
    const routeSource = fs.readFileSync(path.join(repoRoot, expectedRoute.file), 'utf8');
    assert.match(routeSource, /LegalPage, LegalSection/);
    if (expectedRoute.requiredSnippets) {
      for (const snippet of expectedRoute.requiredSnippets) {
        assert.match(routeSource, new RegExp(escapeRegExp(snippet)));
      }
    }
    assert.match(
      routeSource,
      expectedRoute.titlePattern ??
        new RegExp(`<LegalPage\\s+title="${escapeRegExp(expectedRoute.title)}"`),
    );

    for (const [sectionIndex, sectionTitle] of expectedRoute.sections.entries()) {
      assert.match(
        routeSource,
        expectedRoute.sectionPatterns?.[sectionIndex] ??
          new RegExp(`<LegalSection\\s+title="${escapeRegExp(sectionTitle)}"`),
      );
    }
  }
});

test('privacy route parity rejects English streaks in Swedish legal copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/privacy.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('XP, studiesviter och ljudinställningar', 'XP, streaks och ljudinställningar');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Swedish privacy copy must use natural Swedish streak wording, not "streaks"/,
  );
});

test('legal route header parity rejects shared legal section header drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/compliance/LegalPage.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.sectionTitle}>',
        '<Text style={styles.sectionTitle}>',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /legal route shared heading components must expose accessibilityRole="header"/,
  );
});

test('legal Swedish copy guard rejects non-allowlisted English learner tokens', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/privacy.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'XP, studiesviter och ljudinställningar',
        'XP, streaks, settings och ljudinställningar',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /Swedish legal copy contains English token "streaks"/);
  assert.match(output, /Swedish legal copy contains English token "settings"/);
});
