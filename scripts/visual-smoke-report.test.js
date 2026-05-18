const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const screenshotDir = path.join(repoRoot, 'reports/2026-05-15-uiux-screenshots');
const manifestPath = path.join(screenshotDir, 'manifest.json');
const expectedRoutes = [
  '/',
  '/onboarding',
  '/home',
  '/learn',
  '/practice',
  '/exam',
  '/mistakes',
  '/profile',
  '/settings',
  '/chapter/ch01',
  '/disclaimer',
  '/privacy',
  '/terms',
  '/sources',
  '/support',
];
const explainedDuplicateScreenshotGroups = new Set(['home,index']);

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

test('visual smoke report records route-specific screenshots without launch overlays', () => {
  const manifest = readManifest();
  assert.match(manifest.viewport, /iPhone 12/);
  assert.match(manifest.launchOverlayPolicy, /dismisses the launch sponsor overlay/i);
  assert.match(manifest.duplicatePolicy, /duplicate screenshot hashes fail/i);

  const routes = manifest.routes || [];
  assert.deepEqual(
    routes.map((route) => route.route),
    expectedRoutes,
  );

  const namesByHash = new Map();
  for (const route of routes) {
    assert.equal(typeof route.name, 'string');
    assert.equal(typeof route.file, 'string');
    assert.equal(route.launchOverlayVisibleAfterDismissal, false);
    assert.ok(
      route.launchOverlayDismissed ||
        [
          '/practice',
          '/exam',
          '/disclaimer',
          '/privacy',
          '/terms',
          '/sources',
          '/support',
        ].includes(route.route),
      `${route.name} should either dismiss or suppress the launch overlay`,
    );

    const screenshotPath = path.join(screenshotDir, route.file);
    assert.ok(fs.existsSync(screenshotPath), `${route.file} should exist`);
    assert.ok(fs.statSync(screenshotPath).size > 10_000, `${route.file} should not be empty`);
    assert.equal(route.sha256, sha256File(screenshotPath), `${route.file} hash should match`);

    const names = namesByHash.get(route.sha256) || [];
    names.push(route.name);
    namesByHash.set(route.sha256, names);
  }

  const unexplainedDuplicates = [...namesByHash.values()]
    .filter((names) => names.length > 1)
    .map((names) => names.sort().join(','))
    .filter((names) => !explainedDuplicateScreenshotGroups.has(names));

  assert.deepEqual(unexplainedDuplicates, []);
});
