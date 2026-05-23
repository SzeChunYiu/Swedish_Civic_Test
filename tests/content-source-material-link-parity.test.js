const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const expectedUhrMaterialUrl = 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';
const expectedAuthorityBoundaryUrl =
  'https://www.uhr.se/medborgarskapsprovet/om-medborgarskapsprovet/';

function runValidationWithUhrMapPatch(patchExpression) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/content/uhr-section-map.json')) {
    return String(contents).${patchExpression};
  }
  return contents;
};
process.argv.push('--focus-source-material-link-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

function runValidationWithRoutePatch(routePath, patchExpression) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/${routePath}')) {
    return String(contents).${patchExpression};
  }
  return contents;
};
process.argv.push('--focus-source-material-link-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

test('legal source-material pages stay in parity with UHR source metadata', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-source-material-link-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const sourcesRoute = fs.readFileSync(path.join(repoRoot, 'app/sources.tsx'), 'utf8');
  const disclaimerRoute = fs.readFileSync(path.join(repoRoot, 'app/disclaimer.tsx'), 'utf8');
  const termsRoute = fs.readFileSync(path.join(repoRoot, 'app/terms.tsx'), 'utf8');
  const sourceLinks = fs.readFileSync(
    path.join(repoRoot, 'components/compliance/SourceMaterialLinks.tsx'),
    'utf8',
  );
  const legalPage = fs.readFileSync(
    path.join(repoRoot, 'components/compliance/LegalPage.tsx'),
    'utf8',
  );
  const uhrSectionMap = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'content/uhr-section-map.json'), 'utf8'),
  );

  assert.equal(summary.uhrSourceMaterialLinkParityValidated, true);
  assert.match(sourcesRoute, /<UhrEducationMaterialLink[\s\S]*href=\{UHR_EDUCATION_MATERIAL_URL\}/);
  assert.match(sourcesRoute, /<UhrAuthorityBoundaryLink[\s\S]*language=\{language\}/);
  assert.match(disclaimerRoute, /<SourceMaterialLinkList\s+language=\{language\}\s*\/>/);
  assert.match(termsRoute, /<SourceMaterialLinkList\s+language=\{language\}\s*\/>/);
  assert.match(disclaimerRoute, /Studera alltid det primära utbildningsmaterialet direkt/);
  assert.match(disclaimerRoute, /Always study the primary education material directly/);
  assert.doesNotMatch(
    disclaimerRoute,
    /UHR:s\s+egen\s+sida|UHR's\s+own\s+page|beskriver\s+också\s+källgränsen|provides\s+source-boundary\s+guidance/i,
  );
  assert.match(termsRoute, /Använd dem tillsammans med det primära utbildningsmaterialet/);
  assert.match(termsRoute, /Use them together with the primary education material/);
  assert.doesNotMatch(
    termsRoute,
    /Källorna\s+nedan\s+visar\s+vilket\s+UHR-material|The\s+sources\s+below\s+show\s+the\s+UHR\s+material|vilken\s+källgräns\s+den\s+här\s+vägledningen\s+bygger\s+på|source-boundary\s+guidance\s+this\s+notice\s+relies\s+on/i,
  );
  assert.match(sourceLinks, /Öppna UHR:s utbildningsmaterial/);
  assert.match(sourceLinks, /Open UHR education material/);
  assert.match(sourceLinks, /Öppna UHR:s sida Om medborgarskapsprovet/);
  assert.match(sourceLinks, /Open UHR About the citizenship test page/);
  assert.match(sourceLinks, /UHR: Utbildningsmaterial om det svenska samhället/);
  assert.match(sourceLinks, /UHR: Study material about Swedish society/);
  assert.match(sourceLinks, /Universitets- och högskolerådet \(UHR\)/);
  assert.match(sourceLinks, /retrievedDate: '2026-05-20'/);
  assert.match(legalPage, /target="_blank"/);
  assert.match(legalPage, /rel="noreferrer"/);
  assert.match(legalPage, /minHeight:\s*space\[6\]/);
  assert.match(sourcesRoute, /Sverige i fokus/);
  assert.match(sourcesRoute, /Utbildningsmaterialet är framtaget av UHR/);
  assert.match(sourcesRoute, /The study material is produced by UHR/);
  assert.doesNotMatch(sourcesRoute, /UHR:s\s+sida[^`'"\n]{0,120}\bsäger\b/i);
  assert.doesNotMatch(sourcesRoute, /UHR's\s+[^`'"\n]{0,120}\bpage\s+says\b/i);
  assert.doesNotMatch(sourcesRoute, /content\/uhr-section-map\.json/);
  assert.doesNotMatch(sourcesRoute, /content\/question-bank\.csv/);
  assert.ok(uhrSectionMap.source.url.includes('/medborgarskapsprovet/utbildningsmaterial/'));
  assert.ok(sourcesRoute.includes(expectedUhrMaterialUrl));
  assert.ok(sourceLinks.includes(expectedUhrMaterialUrl));
  assert.ok(sourceLinks.includes(expectedAuthorityBoundaryUrl));
});

test('sources parity rejects UHR map source URLs outside the education material path', () => {
  const result = runValidationWithUhrMapPatch(
    `replace(
      '"url": "https://www.uhr.se/globalassets/_uhr.se/medborgarskapsprovet/utbildningsmaterial/sverige-i-fokus.pdf"',
      '"url": "https://www.uhr.se/globalassets/_uhr.se/other/sverige-i-fokus.pdf"',
    )`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /UHR section map source URL must be under the UHR education material path/,
  );
});

test('sources parity rejects route education material URL drift', () => {
  const result = runValidationWithRoutePatch(
    'app/sources.tsx',
    `replace(
      "const UHR_EDUCATION_MATERIAL_URL = 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';",
      "const UHR_EDUCATION_MATERIAL_URL = 'https://www.uhr.se/medborgarskapsprovet/annat/';",
    )`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /app\/sources\.tsx UHR_EDUCATION_MATERIAL_URL must be https:\/\/www\.uhr\.se\/medborgarskapsprovet\/utbildningsmaterial\//,
  );
});

test('sources parity rejects source-authority phrasing in authority-boundary copy', () => {
  const englishResult = runValidationWithRoutePatch(
    'app/sources.tsx',
    `replace(
      'The study material is produced by UHR.',
      "UHR's About the citizenship test page says that UHR has produced the study material.",
    )`,
  );

  assert.notEqual(englishResult.status, 0);
  assert.match(
    `${englishResult.stdout}\n${englishResult.stderr}`,
    /authority-boundary copy must state facts neutrally/,
  );

  const swedishResult = runValidationWithRoutePatch(
    'app/sources.tsx',
    `replace(
      'Utbildningsmaterialet är framtaget av UHR.',
      'UHR:s sida Om medborgarskapsprovet säger att UHR har tagit fram utbildningsmaterialet.',
    )`,
  );

  assert.notEqual(swedishResult.status, 0);
  assert.match(
    `${swedishResult.stdout}\n${swedishResult.stderr}`,
    /authority-boundary copy must state facts neutrally/,
  );
});

test('source material e2e covers Sources route wrapped focus-visible links', () => {
  const e2eSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/legal-external-links.spec.ts'),
    'utf8',
  );

  assert.match(e2eSource, /type LegalSourceMaterialLinkLayoutFixture = \{[\s\S]*'\/sources'/);
  assert.match(
    e2eSource,
    /path: '\/sources'[\s\S]*sectionTitle: 'Primärt studiematerial'[\s\S]*visibleLabel: 'UHR: Utbildningsmaterial om det svenska samhället'/,
  );
  assert.match(
    e2eSource,
    /path: '\/sources'[\s\S]*sectionTitle: 'Primary study material'[\s\S]*visibleLabel: 'UHR: Study material about Swedish society'/,
  );
  assert.match(e2eSource, /for \(const viewport of legalSourceMaterialViewports\)/);
  assert.match(e2eSource, /expectLinkTextSegmentsStayInsideBox\(link, \[/);
  assert.match(e2eSource, /focusLinkWithKeyboard\(page, link, fixture\.actionLabel\)/);
  assert.match(e2eSource, /expectKeyboardFocusVisible\(link, fixture\.actionLabel\)/);
  assert.match(e2eSource, /expectNoHorizontalOverflow\(page\)/);
});

test('source material e2e covers Sources authority-boundary wrapped focus-visible links', () => {
  const e2eSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/legal-external-links.spec.ts'),
    'utf8',
  );

  assert.match(
    e2eSource,
    /type SourcesAuthorityBoundaryFixture = \{[\s\S]*publisherLabel: string;[\s\S]*retrievedLabel: string;[\s\S]*urlLabel: string;/,
  );
  assert.match(
    e2eSource,
    /for \(const viewport of legalSourceMaterialViewports\)[\s\S]*sources authority-boundary link layout/,
  );
  assert.match(
    e2eSource,
    /\/sources keeps \$\{fixture\.language\} authority-boundary source link text wrapped and focus-visible/,
  );
  assert.match(
    e2eSource,
    /expectLinkTextSegmentsStayInsideBox\(authorityBoundaryLink, \[[\s\S]*fixture\.visibleLabel[\s\S]*fixture\.publisherLabel[\s\S]*SOURCE_MATERIAL_LINK_RETRIEVED_DATE[\s\S]*UHR_AUTHORITY_BOUNDARY_URL/,
  );
  assert.match(
    e2eSource,
    /focusLinkWithKeyboard\(page, authorityBoundaryLink, fixture\.actionLabel\)/,
  );
  assert.match(
    e2eSource,
    /expectKeyboardFocusVisible\(authorityBoundaryLink, fixture\.actionLabel\)/,
  );
  assert.match(
    e2eSource,
    /expect\.poll\(\(\) => popup\.url\(\)\)\.toBe\(UHR_AUTHORITY_BOUNDARY_URL\)/,
  );
});

test('source material parity rejects Disclaimer body source-authority phrasing', () => {
  const englishResult = runValidationWithRoutePatch(
    'app/disclaimer.tsx',
    `replace(
      'Use the source links below to see which study material the app is based on and how practice tests from other actors should be kept separate from it.',
      "UHR's own page about the test also provides source-boundary guidance for UHR material and practice tests from other actors.",
    )`,
  );

  assert.notEqual(englishResult.status, 0);
  assert.match(
    `${englishResult.stdout}\n${englishResult.stderr}`,
    /app\/disclaimer\.tsx source-material body must state study advice neutrally/,
  );

  const swedishResult = runValidationWithRoutePatch(
    'app/disclaimer.tsx',
    `replace(
      'Använd källorna nedan för att se vilket studiematerial appen utgår från och hur övningsprov från andra aktörer ska skiljas från det.',
      'UHR:s egen sida om provet beskriver också källgränsen mellan UHR:s material och övningsprov från andra aktörer.',
    )`,
  );

  assert.notEqual(swedishResult.status, 0);
  assert.match(
    `${swedishResult.stdout}\n${swedishResult.stderr}`,
    /app\/disclaimer\.tsx source-material body must state study advice neutrally/,
  );
});

test('source material parity rejects Terms body source-authority phrasing', () => {
  const englishResult = runValidationWithRoutePatch(
    'app/terms.tsx',
    `replace(
      'Use the source links below to check the study material and the boundary with independent practice tests.',
      'The sources below show the UHR material and source-boundary guidance this notice relies on.',
    )`,
  );

  assert.notEqual(englishResult.status, 0);
  assert.match(
    `${englishResult.stdout}\n${englishResult.stderr}`,
    /app\/terms\.tsx source-material body must state study advice neutrally/,
  );

  const swedishResult = runValidationWithRoutePatch(
    'app/terms.tsx',
    `replace(
      'Se källänkarna nedan när du vill kontrollera studiematerialet och gränsen mot fristående övningsprov.',
      'Källorna nedan visar vilket UHR-material och vilken källgräns den här vägledningen bygger på.',
    )`,
  );

  assert.notEqual(swedishResult.status, 0);
  assert.match(
    `${swedishResult.stdout}\n${swedishResult.stderr}`,
    /app\/terms\.tsx source-material body must state study advice neutrally/,
  );
});

test('source material parity rejects legal pages without shared provenance links', () => {
  const result = runValidationWithRoutePatch(
    'app/terms.tsx',
    `replace('<SourceMaterialLinkList language={language} />', '')`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /app\/terms\.tsx source-material section must render shared UHR source links/,
  );
});
