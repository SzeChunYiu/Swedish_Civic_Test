const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const expectedUhrMaterialUrl = 'https://www.uhr.se/medborgarskapsprovet/utbildningsmaterial/';

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
  assert.match(sourcesRoute, /content\/uhr-section-map\.json/);
  assert.match(sourcesRoute, /content\/question-bank\.csv/);
  assert.ok(uhrSectionMap.source.url.includes('/medborgarskapsprovet/utbildningsmaterial/'));
  assert.ok(sourcesRoute.includes(expectedUhrMaterialUrl));
});
