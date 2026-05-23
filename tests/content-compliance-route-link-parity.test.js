const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('compliance route CTAs use shared legal link components', () => {
  const supportSource = read('app/support.tsx');
  const aboutSource = read('app/about-the-test.tsx');
  const requirementsSource = read('app/citizenship-requirements.tsx');
  const legalPageSource = read('components/compliance/LegalPage.tsx');

  assert.match(supportSource, /<LegalExternalLink[\s\S]*href=\{publicUrls\.support\}/);
  assert.doesNotMatch(supportSource, /import \{ Link \} from 'expo-router'/);
  assert.doesNotMatch(supportSource, /<Link\b/);

  assert.match(aboutSource, /<LegalExternalLink[\s\S]*href=\{source\.url\}/);
  assert.match(aboutSource, /<ComplianceActionLink[\s\S]*href="\/citizenship-requirements"/);
  assert.match(aboutSource, /<ComplianceActionLink[\s\S]*href="\/practice"/);
  assert.match(aboutSource, /<ComplianceActionLink[\s\S]*href="\/home"/);
  assert.doesNotMatch(aboutSource, /<Link\b/);

  assert.match(requirementsSource, /import \{ ComplianceActionLink \}/);
  assert.match(requirementsSource, /<RouteLink[\s\S]*href=\{source\.url\}/);
  assert.match(requirementsSource, /<ComplianceActionLink[\s\S]*href="\/practice"/);
  assert.match(requirementsSource, /<ComplianceActionLink[\s\S]*href="\/about-the-test"/);
  assert.doesNotMatch(requirementsSource, /import \{ Link \} from 'expo-router'/);
  assert.doesNotMatch(requirementsSource, /<Link\b/);

  assert.match(legalPageSource, /<ComplianceActionLink[\s\S]*href=\{backHref\}/);
  assert.match(legalPageSource, /export function LegalExternalLink/);
});
