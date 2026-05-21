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
