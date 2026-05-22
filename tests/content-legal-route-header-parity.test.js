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
      /<LegalSection\s+title=\{copy\.sections\.independentStudyTool\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.practiceContent\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.sourceMaterial\.title\}[\s\S]*?>/,
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
      'Konto är valfritt',
      'köpet gör att annonser inte visas på den här enheten',
      'Privacy policy',
      'Account optional',
      'Supabase and Google sign-in',
      'turns off ads on this device',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.noAccountRequired\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.localProgressStorage\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.adsAndPurchases\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.adConsent\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.providerProcessing\.title\}[\s\S]*?>/,
    ],
    title: 'Privacy policy',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: [
      'Account optional',
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
      /<LegalSection\s+title=\{copy\.sections\.studyPurpose\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.noGuarantee\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.sourceMaterial\.title\}[\s\S]*?>/,
    ],
    title: 'Terms of use',
    titlePattern: /<LegalPage\s+title=\{copy\.title\}>/,
    sections: ['Study purpose', 'No guarantee', 'Respect source material'],
  },
  {
    file: 'app/sources.tsx',
    requiredSnippets: [
      'const sourcesCopy: Record<AppLanguage, SourcesRouteCopy> = {',
      'UHR_AUTHORITY_BOUNDARY_SOURCE',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = sourcesCopy[language];',
      'Källor',
      'Primärt studiematerial',
      'UHR står inte bakom dessa',
      'Källa hämtad ${UHR_AUTHORITY_BOUNDARY_SOURCE.retrievedDate}',
      'Varje övningsfråga visar en källrad med UHR:s kapitel',
      'Sources',
      'Primary study material',
      'quality is not controlled by UHR or any other authority',
      'Source accessed ${UHR_AUTHORITY_BOUNDARY_SOURCE.retrievedDate}',
      'Every practice question shows a source line with the UHR chapter',
    ],
    sectionPatterns: [
      /<LegalSection\s+title=\{copy\.sections\.primaryStudyMaterial\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.questionReferences\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.authorityBoundaries\.title\}[\s\S]*?>/,
    ],
    title: 'Sources',
    titlePattern: /<LegalPage[\s\S]*title=\{copy\.title\}[\s\S]*>/,
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
      /<LegalSection\s+title=\{copy\.sections\.whatToReport\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.noPersonalData\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.independentStudyTool\.title\}[\s\S]*?>/,
      /<LegalSection\s+title=\{copy\.sections\.publicSupportPage\.title\}[\s\S]*?>/,
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
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-legal-route-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('sources route authority boundary cites the current UHR page', () => {
  const routeSource = fs.readFileSync(path.join(repoRoot, 'app/sources.tsx'), 'utf8');
  const linksSource = fs.readFileSync(
    path.join(repoRoot, 'components/compliance/SourceMaterialLinks.tsx'),
    'utf8',
  );

  assert.match(routeSource, /UHR_AUTHORITY_BOUNDARY_SOURCE/);
  assert.match(routeSource, /<UhrAuthorityBoundaryLink language=\{language\}/);

  for (const snippet of [
    'const UHR_AUTHORITY_BOUNDARY_SOURCE = {',
    "retrievedDate: '2026-05-20'",
    "titleSv: 'UHR: Om medborgarskapsprovet'",
    "titleEn: 'UHR: About the citizenship test'",
    "url: 'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/'",
  ]) {
    assert.match(linksSource, new RegExp(escapeRegExp(snippet)));
  }

  for (const snippet of [
    'UHR står inte bakom dessa',
    'Källa hämtad ${UHR_AUTHORITY_BOUNDARY_SOURCE.retrievedDate}',
    'quality is not controlled by UHR or any other authority',
    'Source accessed ${UHR_AUTHORITY_BOUNDARY_SOURCE.retrievedDate}',
  ]) {
    assert.match(routeSource, new RegExp(escapeRegExp(snippet)));
  }

  assert.match(linksSource, /source=\{UHR_AUTHORITY_BOUNDARY_SOURCE\}/);
  assert.match(linksSource, /href=\{href \?\? source\.url\}/);
  assert.doesNotMatch(routeSource, /UHR\s+varnar|UHR\s+warns/i);
  assert.doesNotMatch(
    routeSource,
    /kvalitets(?:granskad|granskade|kontrollerad|kontrollerade)\s+av\s+UHR|quality-(?:controlled|checked|reviewed)\s+by\s+UHR/i,
  );
});

test('legal, source, and support routes stay on shared accessible header path', () => {
  const summary = parseValidationSummary();
  const legalPage = fs.readFileSync(
    path.join(repoRoot, 'components/compliance/LegalPage.tsx'),
    'utf8',
  );

  assert.equal(summary.legalRouteHeadersValidated, 23);
  assert.equal(summary.legalRouteHeaderParityValidated, true);
  assert.equal(summary.legalSectionRenderingTestsRoutedValidated, true);
  assert.equal(summary.legalSectionRenderingCasesValidated, 3);
  assert.equal(summary.legalSectionWhitespaceTextValidated, true);
  assert.equal(summary.legalSectionFragmentChildrenValidated, true);
  assert.equal(summary.legalSectionRawTextUnderViewValidated, true);
  assert.equal(summary.legalSectionRenderingParityValidated, true);
  assert.equal(summary.swedishPrivacyStreakCopyNaturalnessValidated, true);
  assert.ok(summary.legalSwedishEnglishTokenGuardValidated >= 5);
  assert.equal(summary.legalSwedishEnglishTokenGuardParityValidated, true);
  assert.match(legalPage, /function flattenSectionChildren\(children: ReactNode\)/);
  assert.match(legalPage, /isFragmentChild\(child\)/);
  assert.match(legalPage, /flushParagraph\(renderedChildren, paragraphChildren, index\);/);
  assert.match(legalPage, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(legalPage, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);

  for (const expectedRoute of expectedLegalRoutes) {
    const routeSource = fs.readFileSync(path.join(repoRoot, expectedRoute.file), 'utf8');
    assert.match(routeSource, /LegalPage[\s\S]*LegalSection|LegalSection[\s\S]*LegalPage/);
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

    if (expectedRoute.file === 'app/support.tsx') {
      assert.match(
        routeSource,
        /<LegalSection\s+title=\{copy\.sections\.publicSupportPage\.title\}[\s\S]*body=\{copy\.sections\.publicSupportPage\.body\}[\s\S]*<LegalExternalLink/,
      );
    }

    if (expectedRoute.file === 'app/privacy.tsx') {
      [
        /No account (?:is )?required/i,
        /without sign-in, email address, phone number, or profile registration/i,
        /registered profile details/i,
        /Inget konto krävs/i,
        /kräver inget konto/i,
        /profilregistrering/i,
      ].forEach((pattern) => assert.doesNotMatch(routeSource, pattern));
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
process.argv.push('--focus-legal-route-parity');
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

test('privacy route parity rejects internal Remove Ads entitlement flag copy', () => {
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
        'köpet gör att annonser inte visas på den här enheten',
        'köpet sätter adsDisabled=true på den här enheten',
      )
      .replace(
        'turns off ads on this device',
        'sets adsDisabled=true on this device',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-legal-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /app\/privacy\.tsx learner-facing privacy copy must not expose adsDisabled/,
  );
});

test('privacy Remove Ads rendered copy e2e covers both languages', () => {
  const specSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/privacy-remove-ads-copy.spec.ts'),
    'utf8',
  );

  for (const snippet of [
    '/privacy',
    'Ta bort annonser är ett engångsköp för 29 SEK som inte förbrukas',
    'köpet gör att annonser inte visas på den här enheten',
    'kan återställas via appbutiken',
    'Remove Ads is a one-time, non-consumable purchase for 29 SEK',
    'turns off ads on this device',
    'can be restored through the app store',
    'Google Mobile Ads',
    'Timed mock exam screens stay ad-free',
    'Tidsatta provskärmar är annonsfria',
    '/privacy refreshes Remove Ads legal copy after language selection changes',
    'Set study language to English support',
  ]) {
    assert.match(specSource, new RegExp(escapeRegExp(snippet)));
  }

  assert.match(specSource, /language:\s*'sv'/);
  assert.match(specSource, /language:\s*'en'/);
  assert.match(specSource, /not\.toContainText\(scenario\.forbiddenVisibleCopy\)/);
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
process.argv.push('--focus-legal-route-parity');
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

test('legal route header parity rejects unflattened LegalSection fragment drift', () => {
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
      .replace('if (isFragmentChild(child)) {', 'if (false && isFragmentChild(child)) {');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-legal-section-rendering');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /LegalSection rendering parity: fragment-wrapped mixed children/,
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
process.argv.push('--focus-legal-route-parity');
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
