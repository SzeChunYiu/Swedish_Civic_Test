const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const expectedUhrMaterialUrl = 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';

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
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

function runValidationWithSourcesRoutePatch(patchExpression) {
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
  if (normalizedPath.endsWith('/app/sources.tsx')) {
    return String(contents).${patchExpression};
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

test('sources route stays in parity with UHR source material metadata', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const sourcesRoute = fs.readFileSync(path.join(repoRoot, 'app/sources.tsx'), 'utf8');
  const uhrSectionMap = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'content/uhr-section-map.json'), 'utf8'),
  );

  assert.equal(summary.uhrSourceMaterialLinkParityValidated, true);
  assert.match(sourcesRoute, /<Link[\s\S]*href=\{UHR_EDUCATION_MATERIAL_URL\}/);
  assert.match(
    sourcesRoute,
    /accessibilityLabel=\{copy\.openEducationMaterialAccessibilityLabel\}/,
  );
  assert.match(sourcesRoute, /Öppna UHR:s utbildningsmaterial/);
  assert.match(sourcesRoute, /Open UHR education material/);
  assert.match(sourcesRoute, /Sverige i fokus/);
  assert.match(sourcesRoute, /Varje övningsfråga visar en källrad med UHR:s kapitel/);
  assert.match(sourcesRoute, /Every practice question shows a source line with the UHR chapter/);
  assert.doesNotMatch(sourcesRoute, /content\/uhr-section-map\.json/);
  assert.doesNotMatch(sourcesRoute, /content\/question-bank\.csv/);
  assert.doesNotMatch(sourcesRoute, /spreadsheet-friendly|kalkylbladsvänliga/);
  assert.ok(uhrSectionMap.source.url.includes('/medborgarskapsprovet/utbildningsmaterial/'));
  assert.ok(sourcesRoute.includes(expectedUhrMaterialUrl));
});

test('sources parity rejects learner-facing internal implementation paths', () => {
  const result = runValidationWithSourcesRoutePatch(
    `replace(
      'Varje övningsfråga visar en källrad med UHR:s kapitel, avsnitt och ungefärliga sida.',
      'Avsnittskartan finns i content/uhr-section-map.json och den kalkylbladsvänliga innehållsdatabasen exporteras till content/question-bank.csv.',
    )`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /app\/sources\.tsx learner-facing copy must not mention content\/uhr-section-map\.json/,
  );
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
  const result = runValidationWithSourcesRoutePatch(
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
