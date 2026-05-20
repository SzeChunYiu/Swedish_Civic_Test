const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const provenanceSurfaces = [
  'app/(tabs)/practice.tsx',
  'lib/content/provenance.ts',
  'site/practice.js',
  'scripts/validate-content.js',
  'tests/e2e/practice-header-controls.spec.ts',
];

const positiveUhrAuthorityPatterns = [
  /Directly\s+from\s+UHR/i,
  new RegExp(['Questions traced', 'directly to UHR'].join('[\\s\\S]*'), 'i'),
  /Direkt\s+från\s+UHR/i,
  new RegExp(['Frågor som kommer', 'direkt från UHR'].join('[\\s\\S]*'), 'i'),
  new RegExp(['Variant generated', 'from a UHR question'].join('[\\s\\S]*'), 'i'),
  new RegExp(['genererats', 'från en UHR-fråga'].join('[\\s\\S]*'), 'i'),
  new RegExp(['genererats', 'utifrån en UHR-fråga'].join('[\\s\\S]*'), 'i'),
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('provenance copy avoids positive official-UHR authority wording', () => {
  for (const relativePath of provenanceSurfaces) {
    const source = read(relativePath);
    positiveUhrAuthorityPatterns.forEach((pattern) => {
      assert.doesNotMatch(source, pattern, `${relativePath} should avoid ${pattern}`);
    });
  }
});

test('provenance copy keeps neutral UHR source transparency', () => {
  const practiceRoute = read('app/(tabs)/practice.tsx');
  const sharedProvenance = read('lib/content/provenance.ts');
  const staticPractice = read('site/practice.js');

  assert.match(practiceRoute, /Questions written from UHR's study material Sverige i fokus/);
  assert.match(practiceRoute, /Frågor skrivna utifrån UHR:s studiematerial Sverige i fokus/);
  assert.match(practiceRoute, /UHR-referenced practice question/);
  assert.match(practiceRoute, /UHR-hänvisad övningsfråga/);
  assert.match(sharedProvenance, /Based on UHR's study material Sverige i fokus/);
  assert.match(sharedProvenance, /Baserad på UHR:s studiematerial Sverige i fokus/);
  assert.match(staticPractice, /Based on UHR's study material Sverige i fokus/);
  assert.match(staticPractice, /Baserad på UHR:s studiematerial Sverige i fokus/);
});
