const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const expectedSuppressedRoutes = [
  '/exam',
  '/practice',
  '/quiz',
  '/disclaimer',
  '/about-the-test',
  '/onboarding',
  '/privacy',
  '/sources',
  '/support',
  '/terms',
];

test('launch popup ad route suppression stays aligned with release-safe routes', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
  const rootLayout = fs.readFileSync(path.join(repoRoot, 'app/_layout.tsx'), 'utf8');
  const webLaunchPopupAd = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/LaunchPopupAd.tsx'),
    'utf8',
  );
  const nativeLaunchPopupAd = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/LaunchPopupAd.native.tsx'),
    'utf8',
  );

  assert.equal(summary.launchAdSuppressedRoutesValidated, expectedSuppressedRoutes.length);
  assert.equal(summary.launchAdRouteSuppressionParityValidated, true);

  for (const route of expectedSuppressedRoutes) {
    assert.ok(adsSource.includes(`'${route}'`), `${route} should be in the suppression list`);
  }

  assert.match(rootLayout, /usePathname\(\)/);
  assert.match(rootLayout, /shouldSuppressLaunchPopupAdForPath\(pathname\)/);
  assert.match(rootLayout, /!suppressLaunchPopupAd && entitlementsReady/);
  assert.ok(
    rootLayout.indexOf('<LaunchPopupAd entitlements={monetizationEntitlements} />') <
      rootLayout.indexOf('<FirstRunAboutTheTestModal />'),
    'root layout should render LaunchPopupAd before the first-run modal',
  );
  assert.match(webLaunchPopupAd, /deferFirstRunAboutModalForLaunchSession\(\);/);
  assert.match(nativeLaunchPopupAd, /deferFirstRunAboutModalForLaunchSession\(\);/);
  assert.match(nativeLaunchPopupAd, /if \(nativeLaunchPopupMayShow\) \{/);
});

test('launch popup ad route suppression rejects missing compliance routes', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/ads.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'\/privacy',", "'\/privacy-disabled',");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /launch popup suppressed routes/);
});

test('launch popup ad route suppression rejects root-layout bypass drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/_layout.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('shouldSuppressLaunchPopupAdForPath(pathname)', 'false');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /root layout must derive launch ad suppression from current pathname/,
  );
});

test('launch popup ad route suppression rejects native first-run deferral drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/LaunchPopupAd.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('deferFirstRunAboutModalForLaunchSession();', 'undefined;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /native launch ad must defer the first-run About modal when eligible/,
  );
});
