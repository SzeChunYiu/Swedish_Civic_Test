const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

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
  assert.match(read('app/privacy.tsx'), /ad-supported/i);
  assert.match(read('app/privacy.tsx'), /Remove Ads/i);
  assert.match(read('app/privacy.tsx'), /29 SEK/i);
  assert.match(read('app/privacy.tsx'), /App Tracking Transparency/i);
  assert.match(read('app/privacy.tsx'), /Google UMP consent/i);
  assert.match(read('app/terms.tsx'), /study/i);
  assert.match(read('app/terms.tsx'), /no guarantee/i);
  const sourcesRoute = read('app/sources.tsx');
  assert.match(sourcesRoute, /uhr\.se\/medborgarskapsprovet\/utbildningsmaterial/i);
  assert.match(sourcesRoute, /Sverige i fokus/i);
  assert.match(sourcesRoute, /<Link[\s\S]*href=\{UHR_EDUCATION_MATERIAL_URL\}/);
  assert.match(sourcesRoute, /accessibilityLabel="Open UHR education material"/);
  const supportRoute = read('app/support.tsx');
  assert.match(supportRoute, /support/i);
  assert.match(supportRoute, /content issue/i);
  assert.match(supportRoute, /no personal data/i);
  assert.match(supportRoute, /szechunyiu\.github\.io\/Swedish_Civic_Test-public-site\/support/i);
  assert.match(supportRoute, /<Link[\s\S]*href=\{PUBLIC_SUPPORT_URL\}/);
  assert.match(supportRoute, /accessibilityLabel="Open public support page"/);
  assert.doesNotMatch(supportRoute, /release checklist items/i);
  const complianceLinks = read('components/compliance/ComplianceLinks.tsx');
  assert.match(complianceLinks, /Juridik och källor/);
  assert.match(complianceLinks, /Legal and sources/);
  assert.match(complianceLinks, /Support/);
});
