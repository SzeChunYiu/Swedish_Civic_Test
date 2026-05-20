const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('store screenshot manifest covers required listing surfaces', () => {
  const manifest = readJson('publishing/screenshot-manifest.json');
  assert.equal(manifest.appName, 'Almost Swedish');
  assert.equal(manifest.status, 'web-draft-only');
  assert.match(manifest.finalDeviceRequirement, /real devices/i);
  assert.ok(manifest.shots.length >= 8);

  const routes = new Set(manifest.shots.map((shot) => shot.route));
  for (const route of ['/home', '/learn', '/practice', '/exam', '/profile', '/sources']) {
    assert.ok(routes.has(route), `${route} should have a planned screenshot`);
  }

  const exam = manifest.shots.find((shot) => shot.route === '/exam');
  assert.match(exam.message, /no ads/i);

  const support = manifest.shots.find((shot) => shot.route === '/support');
  assert.match(support.message, /support/i);
  assert.match(support.message, /no personal data/i);
});

test('visual smoke screenshots default to ignored Playwright artifacts', () => {
  const source = readText('tests/e2e/visual-smoke.spec.ts');

  assert.match(source, /VISUAL_SMOKE_UPDATE_BASELINE/);
  assert.match(source, /testInfo\.outputPath\('visual-smoke-screenshots'\)/);
  assert.match(source, /committedScreenshotDir/);
  assert.match(
    source,
    /Default visual-smoke screenshots are written under Playwright test-results/,
  );
  assert.doesNotMatch(
    source,
    /const\s+screenshotDir\s*=\s*path\.resolve\('reports\/2026-05-15-uiux-screenshots'\)/,
  );
});
