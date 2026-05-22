const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  UNSUPPORTED_STATIC_HEAD_TITLE_PATTERNS,
  UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS,
  assertNoUnsupportedStaticTeamCredentialClaims,
  assertNoUnsupportedStaticOutcomeSlogans,
  assertStaticHeadMetadataDescriptionSource,
  assertStaticHeadMetadataTitleSource,
  findUnsupportedStaticTeamCredentialClaimsInSource,
} = require('./static-outcome-copy-guard');
const { assertNoUnsupportedStaticReleaseCopy } = require('./static-site-release-copy-guard');
const { assertStaticV11ReadinessCopySource } = require('./static-v11-readiness-copy-guard');

const repoRoot = path.resolve(__dirname, '..');
const expectedStaticHeadMetadataOutcomePatterns =
  UNSUPPORTED_STATIC_HEAD_TITLE_PATTERNS.length + UNSUPPORTED_STATIC_OUTCOME_SLOGAN_PATTERNS.length;

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function parseValidationSummary(output) {
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function readAppName() {
  return JSON.parse(read('app.json')).expo.name;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function homepageSlogan(locale, key) {
  return JSON.parse(read('data/homepage_slogans_v6.json')).exactReplacementKeys[locale][key];
}

function unsupportedStaticMockClaimPatterns() {
  return [
    new RegExp(['real', 'timing'].join('\\s+'), 'i'),
    new RegExp(['real', 'format'].join('\\s+'), 'i'),
    new RegExp(['look', 'and', 'feel', 'like', 'the', 'real', 'thing'].join('\\s+'), 'i'),
    new RegExp(['ready', 'for', 'the', 'real', 'thing'].join('\\s+'), 'i'),
    new RegExp(['känns', 'som', 'det', 'riktiga'].join('\\s+'), 'i'),
    new RegExp(['Kör', 'riktigt', 'format'].join('\\s+'), 'i'),
    new RegExp(['riktig', 'tid'].join('\\s+'), 'i'),
    new RegExp(['Nästan', 'redo', 'för', 'det', 'riktiga'].join('\\s+'), 'i'),
  ];
}

test('static mock exam copy avoids unsupported official pass-line claims', () => {
  const practiceSource = read('site/practice.js');
  const forbiddenFragments = [
    '75' + '%',
    ['passing', 'line'].join(' '),
    'godk' + 'änt-gräns',
    '75' + '% next time',
  ];

  for (const fragment of forbiddenFragments) {
    assert.doesNotMatch(practiceSource, new RegExp(fragment.replace(/\s+/g, '\\s+'), 'i'));
  }

  assert.doesNotMatch(practiceSource, /\bpct\s*>=\s*75\b/);
  assert.doesNotMatch(practiceSource, /\bm\.pct\s*>=\s*75\b/);
  assert.doesNotMatch(practiceSource, new RegExp(['you', 'passed'].join('\\s+'), 'i'));
  assert.doesNotMatch(practiceSource, new RegExp('underk' + '[aä]nt', 'i'));
  assert.doesNotMatch(practiceSource, new RegExp('godk' + '[aä]nt', 'i'));
});

test('sources route cites the current UHR authority-boundary page', () => {
  const sourcesRoute = read('app/sources.tsx');

  assert.match(sourcesRoute, /const UHR_AUTHORITY_BOUNDARY_SOURCE = \{/);
  assert.match(sourcesRoute, /retrievedDate:\s*'2026-05-20'/);
  assert.match(
    sourcesRoute,
    /url:\s*'https:\/\/www\.uhr\.se\/medborgarskapsprovet\/om-medborgarskapsprovet\/'/,
  );
  assert.match(sourcesRoute, /UHR inte står bakom dessa/);
  assert.match(sourcesRoute, /quality is not controlled by UHR or any other authority/);
  assert.match(sourcesRoute, /Källa hämtad \$\{UHR_AUTHORITY_BOUNDARY_SOURCE\.retrievedDate\}/);
  assert.match(sourcesRoute, /Source accessed \$\{UHR_AUTHORITY_BOUNDARY_SOURCE\.retrievedDate\}/);
  assert.match(
    sourcesRoute,
    /<LegalExternalLink[\s\S]*href=\{UHR_AUTHORITY_BOUNDARY_SOURCE\.url\}/,
  );
  assert.doesNotMatch(sourcesRoute, /UHR\s+varnar|UHR\s+warns/i);
  assert.doesNotMatch(
    sourcesRoute,
    /kvalitets(?:granskad|granskade|kontrollerad|kontrollerade)\s+av\s+UHR|quality-(?:controlled|checked|reviewed)\s+by\s+UHR/i,
  );
});

test('sources route back affordance returns to Home instead of Profile', () => {
  const sourcesRoute = read('app/sources.tsx');

  assert.match(sourcesRoute, /backAccessibilityLabel: 'Tillbaka till startsidan'/);
  assert.match(sourcesRoute, /backLabel: '← Tillbaka till startsidan'/);
  assert.match(sourcesRoute, /backAccessibilityLabel: 'Back to Home'/);
  assert.match(sourcesRoute, /backLabel: '← Back to Home'/);
  assert.match(sourcesRoute, /backHref="\/home"/);
  assert.match(sourcesRoute, /backLabel=\{copy\.backLabel\}/);
  assert.match(sourcesRoute, /backAccessibilityLabel=\{copy\.backAccessibilityLabel\}/);
  assert.doesNotMatch(sourcesRoute, /backHref="\/\(tabs\)\/profile"/);
});

test('compliance pages and source links are present', () => {
  const expectedFiles = [
    'app/disclaimer.tsx',
    'app/privacy.tsx',
    'app/terms.tsx',
    'app/sources.tsx',
    'app/support.tsx',
  ];
  for (const file of expectedFiles) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `${file} should exist`);
  }

  assert.match(read('app/disclaimer.tsx'), /not official/i);
  assert.match(read('app/disclaimer.tsx'), /not real exam questions/i);
  assert.match(read('app/privacy.tsx'), /no account/i);
  assert.match(read('app/privacy.tsx'), /local/i);
  assert.match(read('app/privacy.tsx'), /studiesviter/);
  assert.doesNotMatch(
    read('app/privacy.tsx').match(/sv:\s*\{[\s\S]*?title:\s*'Integritetspolicy'/)?.[0] ?? '',
    /\bstreaks\b/i,
  );
  assert.match(read('app/privacy.tsx'), /ad-supported/i);
  assert.match(read('app/privacy.tsx'), /Remove Ads/i);
  assert.match(read('app/privacy.tsx'), /29 SEK/i);
  assert.match(read('app/privacy.tsx'), /App Tracking Transparency/i);
  assert.match(read('app/privacy.tsx'), /Google UMP consent/i);
  assert.match(read('app/privacy.tsx'), /XP, studiesviter och ljudinställningar/);
  assert.match(read('app/privacy.tsx'), /Google UMP-samtyckesformuläret/);
  assert.doesNotMatch(read('app/privacy.tsx'), /XP, streaks och ljudinställningar/);
  assert.doesNotMatch(read('app/privacy.tsx'), /Google UMP consent-formuläret/);
  assert.match(read('app/terms.tsx'), /study/i);
  assert.match(read('app/terms.tsx'), /no guarantee/i);
  assert.match(read('app/terms.tsx'), /Användarvillkor/);
  assert.match(read('app/terms.tsx'), /Studieändamål/);
  const legalPage = read('components/compliance/LegalPage.tsx');
  assert.match(legalPage, /← Tillbaka till profil/);
  assert.match(legalPage, /Tillbaka till profil/);
  assert.match(legalPage, /← Back to Profile/);
  assert.match(legalPage, /Back to profile/);
  const sourcesRoute = read('app/sources.tsx');
  assert.match(sourcesRoute, /backAccessibilityLabel: 'Tillbaka till startsidan'/);
  assert.match(sourcesRoute, /backLabel: '← Tillbaka till startsidan'/);
  assert.match(sourcesRoute, /backAccessibilityLabel: 'Back to Home'/);
  assert.match(sourcesRoute, /backLabel: '← Back to Home'/);
  assert.match(sourcesRoute, /backHref="\/home"/);
  assert.match(sourcesRoute, /backLabel=\{copy\.backLabel\}/);
  assert.match(sourcesRoute, /backAccessibilityLabel=\{copy\.backAccessibilityLabel\}/);
  assert.doesNotMatch(sourcesRoute, /backHref="\/\(tabs\)\/profile"/);
  assert.match(sourcesRoute, /uhr\.se\/medborgarskapsprovet\/utbildningsmaterial/i);
  assert.match(sourcesRoute, /Sverige i fokus/i);
  assert.match(sourcesRoute, /Källor/);
  assert.match(sourcesRoute, /Primärt studiematerial/);
  assert.match(sourcesRoute, /Varje övningsfråga visar en källrad med UHR:s kapitel/);
  assert.match(sourcesRoute, /const UHR_AUTHORITY_BOUNDARY_SOURCE = \{/);
  assert.match(sourcesRoute, /retrievedDate:\s*'2026-05-20'/);
  assert.match(sourcesRoute, /title:\s*'UHR: Om medborgarskapsprovet'/);
  assert.match(
    sourcesRoute,
    /url:\s*'https:\/\/www\.uhr\.se\/medborgarskapsprovet\/om-medborgarskapsprovet\/'/,
  );
  assert.match(sourcesRoute, /UHR inte står bakom dessa/);
  assert.match(sourcesRoute, /Källa hämtad \$\{UHR_AUTHORITY_BOUNDARY_SOURCE\.retrievedDate\}/);
  assert.match(sourcesRoute, /Sources/);
  assert.match(sourcesRoute, /Primary study material/);
  assert.match(sourcesRoute, /Every practice question shows a source line with the UHR chapter/);
  assert.match(sourcesRoute, /quality is not controlled by UHR or any other authority/);
  assert.match(sourcesRoute, /Source accessed \$\{UHR_AUTHORITY_BOUNDARY_SOURCE\.retrievedDate\}/);
  assert.match(sourcesRoute, /uhr\.se\/medborgarskapsprovet\/om-medborgarskapsprovet/i);
  assert.match(sourcesRoute, /<LegalExternalLink[\s\S]*href=\{UHR_EDUCATION_MATERIAL_URL\}/);
  assert.match(
    sourcesRoute,
    /<LegalExternalLink[\s\S]*href=\{UHR_AUTHORITY_BOUNDARY_SOURCE\.url\}/,
  );
  assert.match(
    sourcesRoute,
    /accessibilityLabel=\{copy\.openEducationMaterialAccessibilityLabel\}/,
  );
  assert.match(
    sourcesRoute,
    /accessibilityLabel=\{copy\.openAuthorityBoundarySourceAccessibilityLabel\}/,
  );
  assert.match(sourcesRoute, /Öppna UHR:s utbildningsmaterial/);
  assert.match(sourcesRoute, /Open UHR education material/);
  assert.match(sourcesRoute, /Öppna UHR:s sida Om medborgarskapsprovet/);
  assert.match(sourcesRoute, /Open UHR About the citizenship test page/);
  assert.doesNotMatch(sourcesRoute, /UHR\s+varnar|UHR\s+warns/i);
  assert.doesNotMatch(
    sourcesRoute,
    /kvalitets(?:granskad|granskade|kontrollerad|kontrollerade)\s+av\s+UHR|quality-(?:controlled|checked|reviewed)\s+by\s+UHR/i,
  );
  assert.doesNotMatch(sourcesRoute, /content\/uhr-section-map\.json/);
  assert.doesNotMatch(sourcesRoute, /content\/question-bank\.csv/);
  assert.doesNotMatch(sourcesRoute, /spreadsheet-friendly|kalkylbladsvänliga/);
  const supportRoute = read('app/support.tsx');
  assert.match(supportRoute, /const supportCopy: Record<AppLanguage, SupportRouteCopy>/);
  assert.match(supportRoute, /const copy = supportCopy\[language\]/);
  assert.match(supportRoute, /<LegalPage title=\{copy\.title\}>/);
  assert.match(supportRoute, /support/i);
  assert.match(supportRoute, /Support och återkoppling/);
  assert.match(supportRoute, /Vad du kan rapportera/);
  assert.match(supportRoute, /Öppna den offentliga supportsidan/);
  assert.match(supportRoute, /content issue/i);
  assert.match(supportRoute, /no personal data/i);
  assert.match(supportRoute, /from '\.\.\/lib\/scaffold\/publicUrls'/);
  assert.match(supportRoute, /<LegalExternalLink[\s\S]*href=\{publicUrls\.support\}/);
  assert.doesNotMatch(supportRoute, /Swedish_Civic_Test-public-site/);
  assert.match(supportRoute, /accessibilityLabel=\{copy\.openSupportPageAccessibilityLabel\}/);
  assert.doesNotMatch(supportRoute, /release checklist items/i);
  const complianceLinks = read('components/compliance/ComplianceLinks.tsx');
  assert.match(complianceLinks, /Juridik och källor/);
  assert.match(complianceLinks, /Legal and sources/);
  assert.match(complianceLinks, /Support/);
});

test('static site brand copy matches app identity', () => {
  const appName = readAppName();
  const staleBrand = /Sveriges Medborgartest|Sweden Citizenship Test Prep/;
  const staticFiles = fs
    .readdirSync(path.join(repoRoot, 'site'))
    .filter((fileName) => /\.(?:html|js|jsx|css)$/.test(fileName));

  for (const fileName of staticFiles) {
    const body = read(path.join('site', fileName));
    assert.doesNotMatch(body, staleBrand, `site/${fileName} should not use the old brand`);
  }

  for (const filePath of [
    'site/index.html',
    'site/app.js',
    'site/ebook.js',
    'site/practice.js',
    'site/settings.js',
    'site/questions.js',
    'scripts/export-site-question-bank.js',
  ]) {
    assert.match(read(filePath), new RegExp(appName), `${filePath} should use ${appName}`);
  }

  assert.match(
    read('site/questions.js'),
    new RegExp(`^/\\* ${appName} - generated static question bank\\.`),
  );
});

test('static site release copy avoids MVP and beta labels', () => {
  assert.equal(assertNoUnsupportedStaticReleaseCopy(repoRoot), 3);
  assert.match(read('site/app.js'), /['"]privacy\.meta2\.v['"]:\s*['"]1\.0['"]/);
  assert.match(read('site/index.html'), /data-i18n="privacy\.meta2\.v">1\.0</);
  assert.match(read('site/app.js'), /No\. You do not need to register\./);
  assert.match(read('site/app.js'), /Nej\. Du behöver inte registrera dig\./);
});

test('static learner-facing slogans avoid pass and passport outcome promises', () => {
  assertNoUnsupportedStaticOutcomeSlogans(repoRoot);
  assert.equal(assertStaticHeadMetadataTitleSource(read('site/index.html')), 1);
  assert.match(read('site/index.html'), /<title>Almost Swedish — Study and practice\.<\/title>/);
  const siteAppSource = read('site/app.js');
  for (const [locale, keys] of Object.entries({
    en: ['hero.h1a', 'hero.h1b', 'hero.h1c', 'footer.t1', 'footer.t2'],
    sv: ['hero.h1a', 'hero.h1b', 'hero.h1c', 'footer.t1', 'footer.t2'],
  })) {
    for (const key of keys) {
      assert.match(siteAppSource, new RegExp(escapeRegExp(homepageSlogan(locale, key))));
    }
  }
});

test('static buddy tips avoid unsupported answer-pattern shortcuts', () => {
  const buddiesSource = read('site/buddies.js');
  const forbiddenBuddyTipPatterns = [
    /shorter\s+one\s+usually/i,
    /shorter\s+answer/i,
    /longer\s+answer/i,
    /short\s+option/i,
    /det\s+kortare\s+(?:är|ar)\s+oftast/i,
    /l[aä]ngre\s+svar/i,
    /kort(?:a|are)\s+alternativ/i,
  ];

  forbiddenBuddyTipPatterns.forEach((pattern) => {
    assert.doesNotMatch(buddiesSource, pattern);
  });
});

test('static footer copy avoids unsupported team credential claims', () => {
  assertNoUnsupportedStaticTeamCredentialClaims(repoRoot);
  assert.deepEqual(
    findUnsupportedStaticTeamCredentialClaimsInSource(
      "An app built by people who've taken the test themselves.",
      'fixture.js',
    ).map((issue) => issue.label),
    ['English team test-taker claim'],
  );
  assert.deepEqual(
    findUnsupportedStaticTeamCredentialClaimsInSource(
      'Ett verktyg från personer som själva har gjort provet.',
      'fixture.js',
    ).map((issue) => issue.label),
    ['Swedish self-completed test claim'],
  );
});

test('static head metadata description is neutral and non-empty', () => {
  const indexHtml = read('site/index.html');

  assert.equal(assertStaticHeadMetadataTitleSource(indexHtml), 1);
  assert.throws(
    () => assertStaticHeadMetadataTitleSource(indexHtml.replace(/<title>[\s\S]*?<\/title>/, '')),
    /missing static title/,
  );
  assert.throws(
    () =>
      assertStaticHeadMetadataTitleSource(
        indexHtml.replace(/(<title>)[\s\S]*?(<\/title>)/, '$1$2'),
      ),
    /blank static title/,
  );
  assert.throws(
    () =>
      assertStaticHeadMetadataTitleSource(
        indexHtml.replace(
          /(<title>)[\s\S]*?(<\/title>)/,
          '$1Almost Swedish — Study, fika, pass.$2',
        ),
      ),
    /Study,\s*fika,\s*pass/,
  );
  assert.equal(assertStaticHeadMetadataDescriptionSource(indexHtml), 1);
  assert.throws(
    () =>
      assertStaticHeadMetadataDescriptionSource(
        indexHtml.replace(/<meta\s+name="description"[\s\S]*?\/>\n/, ''),
      ),
    /missing static meta description/,
  );
  assert.throws(
    () =>
      assertStaticHeadMetadataDescriptionSource(
        indexHtml.replace(/(<meta\s+name="description"[\s\S]*?content=")[^"]*(")/, '$1$2'),
      ),
    /blank static meta description/,
  );
  assert.throws(
    () =>
      assertStaticHeadMetadataDescriptionSource(
        indexHtml.replace(
          /(<meta\s+name="description"[\s\S]*?content=")[^"]*(")/,
          '$1Pass the test.$2',
        ),
      ),
    /static meta description English pass-the-test slogan/,
  );
});

test('validate-content reports static head metadata summary fields', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-static-head-metadata'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const summary = parseValidationSummary(output);

  assert.equal(summary.staticHeadMetadataTitleValidated, 1);
  assert.equal(summary.staticHeadMetadataDescriptionValidated, 1);
  assert.equal(
    summary.staticHeadMetadataOutcomeClaimPatternsValidated,
    expectedStaticHeadMetadataOutcomePatterns,
  );
  assert.equal(summary.staticHeadMetadataParityValidated, true);
  assert.equal(summary.staticValidationSyntaxGateValidated, true);
});

test('validate-content rejects static head metadata pass outcome mutations', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const path = require('node:path');
const repoRoot = process.cwd();
const originalReadFileSync = fs.readFileSync;

fs.readFileSync = function patchedReadFileSync(filePath, ...rest) {
  if (
    typeof filePath === 'string' &&
    path.resolve(filePath) === path.join(repoRoot, 'site/index.html')
  ) {
    return originalReadFileSync
      .call(this, filePath, ...rest)
      .replace(/(<title>)[\\s\\S]*?(<\\/title>)/, '$1Almost Swedish — Study, fika, pass.$2');
  }

  return originalReadFileSync.call(this, filePath, ...rest);
};

process.argv.push('--focus-static-head-metadata');
require('./scripts/validate-content.js');
`,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Study,\s*fika,\s*pass/);
});

test('static Swedish mock exam copy stays clearly unofficial practice wording', () => {
  const practice = read('site/practice.js');

  assert.match(practice, /['"]Övningsprov['"]/);
  assert.match(practice, /['"]Bygg ditt övningsprov\.['"]/);
  assert.match(practice, /['"]Starta övningsprov['"]/);
  assert.doesNotMatch(practice, /Skarp tentamen|Bygg din tentamen|Starta tentamen|\btentamen\b/i);
  assert.match(practice, /['"]Mock exam['"]/);
});

test('static Swedish legal and study copy keeps adult grammar and tone', () => {
  const staticApp = read('site/app.js');
  const staleFragments = [
    ['ingen', 'juridiska'].join(' '),
    ['fika', 'stor'].join('-'),
    ['fika', 'skador'].join('-'),
  ];

  staleFragments.forEach((fragment) => {
    assert.doesNotMatch(staticApp, new RegExp(fragment, 'i'));
  });

  assert.match(staticApp, /inget juridiskt kr[aå]ngel/);
  assert.match(staticApp, /en kort studievana/);
  assert.match(
    staticApp,
    /inte ansvariga f[oö]r missade deadlines, avslagna ans[oö]kningar eller beslut/,
  );
});

test('static mock-exam marketing avoids unsourced format and readiness claims', () => {
  const staticApp = read('site/app.js');

  unsupportedStaticMockClaimPatterns().forEach((pattern) => {
    assert.doesNotMatch(staticApp, pattern);
  });

  assert.match(staticApp, /timed practice flow/);
  assert.match(staticApp, /without claiming to mirror the official test/);
  assert.match(staticApp, /official format can still change/);
  assert.match(staticApp, /Keep reviewing the source material before the official test/);
  assert.match(staticApp, /tidsatt övning/);
  assert.match(staticApp, /Det officiella upplägget kan ändras/);
  assert.match(staticApp, /Fortsätt repetera källmaterialet/);
});

test('static v1.1 dashboard copy stays scoped to local practice data', () => {
  const staticV11 = read('site/v11.js');

  assert.deepEqual(assertStaticV11ReadinessCopySource(staticV11), {
    requiredCopyValidated: 12,
    unsupportedPatternsValidated: 4,
  });
  assert.throws(
    () =>
      assertStaticV11ReadinessCopySource(staticV11.replace('Lokal övningssignal', 'Din beredskap')),
    /unsupported readiness\/pass-prediction copy/,
  );
});
