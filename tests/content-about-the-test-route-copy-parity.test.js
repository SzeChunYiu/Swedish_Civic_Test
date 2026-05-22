const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const officialSourceUrls = [
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/',
  'https://www.uhr.se/medborgarskapsprovet/fragor-och-svar/',
  'https://www.uhr.se/medborgarskapsprovet/anmalan/',
  'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/',
  'https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html',
];
const officialSourceRetrievedDate = '2026-05-21';

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-about-the-test-route-copy'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('about-the-test route uses cautious current official-detail copy', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/about-the-test.tsx'), 'utf8');
  const legalPageSource = fs.readFileSync(
    path.join(repoRoot, 'components/compliance/LegalPage.tsx'),
    'utf8',
  );

  assert.equal(summary.aboutTheTestRouteCopyLabelsValidated, 42);
  assert.equal(summary.aboutTheTestRouteCopyParityValidated, true);
  assert.equal(summary.aboutTheTestSourceAuthorityCopyPatternsValidated, 6);
  assert.equal(summary.aboutTheTestSourceAuthorityCopyParityValidated, true);
  assert.equal(summary.aboutTheTestOfficialSourceUrlsValidated, officialSourceUrls.length);
  assert.equal(
    summary.aboutTheTestOfficialSourceRetrievedDateValidated,
    officialSourceRetrievedDate,
  );
  assert.match(source, /const officialTestSourceNotes = \[/);
  assert.match(source, /const aboutTheTestCopy: Record<AppLanguage, AboutTheTestCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = aboutTheTestCopy\[language\];/);
  assert.match(source, /15 augusti 2026 i Stockholm/);
  assert.match(source, /15 August 2026 in Stockholm/);
  assert.match(source, /registrationSummaryTitle: 'Anmälan i korthet'/);
  assert.match(source, /registrationSummaryTitle: 'Registration at a glance'/);
  assert.match(source, /Första provtillfället är den 15 augusti 2026 i Stockholm/);
  assert.match(source, /The first sitting is on 15 August 2026 in Stockholm/);
  assert.doesNotMatch(source, /UHR har bekräftat|UHR has confirmed|UHR skriver|UHR says/);
  assert.doesNotMatch(source, /UHR beskriver|UHR describes|described by UHR/);
  assert.match(source, /Anmälan öppnar i början av juni 2026/);
  assert.match(source, /Registration opens in early June 2026/);
  assert.match(source, /Du kan bara anmäla dig efter ett brev från Migrationsverket/);
  assert.match(source, /You can only sign up after receiving a letter from Migrationsverket/);
  assert.match(source, /brev från Migrationsverket/);
  assert.match(source, /letter from Migrationsverket/);
  assert.match(source, /Antalet platser är begränsat/);
  assert.match(source, /när platserna är fyllda stänger anmälan/);
  assert.match(source, /när platserna är fyllda går det inte längre att anmäla sig/);
  assert.match(source, /Seats are limited/);
  assert.match(source, /when the seats are filled, registration closes/);
  assert.match(source, /Du kan uppfylla kunskapskravet på andra sätt än genom provet/);
  assert.match(source, /You may meet the knowledge requirement in ways other than the test/);
  assert.match(source, /kostnadsfritt och ges som ett utprövningsprov med generös tid/);
  assert.match(source, /free of charge and is a trial sitting with generous time/);
  assert.match(
    source,
    /Lägesbilden är kontrollerad \$\{officialTestSourceNotes\[0\]\.retrievedDate\}/,
  );
  assert.match(source, /sectionOfficialSourcesTitle: 'Officiella källor'/);
  assert.match(source, /sectionOfficialSourcesTitle: 'Official sources'/);
  assert.match(source, /officialSourceOpenPrefix: 'Öppna officiell källa'/);
  assert.match(source, /officialSourceOpenPrefix: 'Open official source'/);
  assert.match(source, /Universitets- och högskolerådet \(UHR\)/);
  assert.match(source, /publisher: 'Migrationsverket'/);
  assert.match(source, /<LegalExternalLink/);
  assert.match(legalPageSource, /target="_blank"/);
  assert.match(legalPageSource, /rel="noreferrer"/);

  for (const url of officialSourceUrls) {
    assert.match(source, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(source, /Ett kort\s+prov|short\s+test/i);
  assert.doesNotMatch(source, /digitalt\s+prov|digital\s+exam/i);
  assert.doesNotMatch(source, /Flervalsfr[aå]gor|Multiple-choice\s+questions/i);
  assert.doesNotMatch(source, /dator i en\s+provlokal|computer at a\s+test centre/i);
});

test('about-the-test official source e2e covers wrapped focus-visible links', () => {
  const e2eSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/legal-external-links.spec.ts'),
    'utf8',
  );

  assert.match(e2eSource, /about-the-test official source layout/);
  assert.match(e2eSource, /ABOUT_THE_TEST_OFFICIAL_SOURCE_URLS/);
  assert.match(
    e2eSource,
    /https:\/\/www\.migrationsverket\.se\/nyheter\/nyhetsarkiv\/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026\.html/,
  );
  assert.match(
    e2eSource,
    /expectLinkTextSegmentsStayInsideBox\(link, \[[\s\S]*`\$\{fixture\.urlLabel\}: \$\{url\}`/,
  );
  assert.match(
    e2eSource,
    /focusLinkWithKeyboard\(page, link, `\$\{fixture\.openPrefix\}: \$\{sourceTitle\}`\)/,
  );
  assert.match(
    e2eSource,
    /expectKeyboardFocusVisible\(link, `\$\{fixture\.openPrefix\}: \$\{sourceTitle\}`\)/,
  );
  assert.match(e2eSource, /await expect\(link\)\.toHaveAttribute\('target', '_blank'\)/);
  assert.match(e2eSource, /await expect\(link\)\.toHaveAttribute\('rel', 'noreferrer'\)/);
  assert.match(e2eSource, /expectNoHorizontalOverflow\(page\)/);
});

test('about-the-test route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = aboutTheTestCopy[language];', 'const copy = aboutTheTestCopy.en;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-about-the-test-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route must select copy from settings language/,
  );
});

test('about-the-test route copy parity rejects unsupported old logistics claims', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'Det första provet gäller grundläggande kunskaper om det svenska samhället och är planerat till den 15 augusti 2026 i Stockholm.',
        'Ett kort' +
          ' prov med flervals' +
          'frågor på svenska. Du svarar på en dator i en ' +
          'provlokal.',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-about-the-test-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route must not make unsupported logistics claim/,
  );
});

test('about-the-test route copy parity rejects source-authority prose', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'The first civic-knowledge test sitting is on 15 August 2026 in Stockholm.',
        'UHR has confirmed 15 August 2026 and Stockholm for the first sitting.',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-about-the-test-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route copy must state current facts neutrally/,
  );
});

test('about-the-test route copy parity rejects missing official source metadata', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('https://www.uhr.se/medborgarskapsprovet/anmalan/', 'https://example.invalid/anmalan/')
      .replaceAll("retrievedDate: '${officialSourceRetrievedDate}'", "retrievedDate: '2026-05-01'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-about-the-test-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route official source metadata missing https:\/\/www\.uhr\.se\/medborgarskapsprovet\/anmalan\//,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    new RegExp(
      `about-the-test route official source metadata must use retrievedDate ${officialSourceRetrievedDate} for every source`,
    ),
  );
});
