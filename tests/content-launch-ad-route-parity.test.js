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

  assert.equal(summary.launchAdSuppressedRoutesValidated, expectedSuppressedRoutes.length);
  assert.equal(summary.launchAdRouteSuppressionParityValidated, true);

  for (const route of expectedSuppressedRoutes) {
    assert.ok(adsSource.includes(`'${route}'`), `${route} should be in the suppression list`);
  }

  assert.match(rootLayout, /usePathname\(\)/);
  assert.match(rootLayout, /shouldSuppressLaunchPopupAdForPath\(pathname\)/);
  assert.match(rootLayout, /!suppressLaunchPopupAd && entitlementsReady/);
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

test('native launch popup consumes the runtime cap only after load reaches the show path', () => {
  const nativeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/LaunchPopupAd.native.tsx'),
    'utf8',
  );

  const loadedListenerIndex = nativeSource.indexOf('AdEventType.LOADED');
  const capIndex = nativeSource.indexOf('launchPopupShownThisRuntime = true;', loadedListenerIndex);
  const showIndex = nativeSource.indexOf('appOpenAd.show()', capIndex);
  const loadIndex = nativeSource.indexOf('appOpenAd.load();');

  assert.notEqual(loadedListenerIndex, -1, 'native app-open ad should listen for load success');
  assert.ok(capIndex > loadedListenerIndex, 'runtime cap should be set inside the loaded handler');
  assert.ok(showIndex > capIndex, 'runtime cap should be set immediately before show is attempted');
  assert.ok(loadIndex > showIndex, 'load should be requested after event handlers are registered');
  assert.doesNotMatch(
    nativeSource,
    /appOpenAd\.load\(\);\s*launchPopupShownThisRuntime = true;/,
    'requesting a load must not consume the one-per-runtime shown cap',
  );
});

test('native launch popup load failures clear only the in-flight attempt', () => {
  const nativeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/LaunchPopupAd.native.tsx'),
    'utf8',
  );

  assert.match(nativeSource, /let launchPopupLoadInFlight = false;/);
  assert.match(nativeSource, /launchPopupLoadInFlight \|\|[\s\S]*!mobileAdsConsent\.initialized/);
  assert.match(nativeSource, /launchPopupLoadInFlight = true;[\s\S]*appOpenAd\.load\(\);/);
  assert.match(
    nativeSource,
    /addAdEventListener\(AdEventType\.ERROR,[\s\S]*launchPopupLoadInFlight = false;/,
  );
  assert.match(
    nativeSource,
    /catch \{[\s\S]*unsubscribe\?\.\(\);[\s\S]*unsubscribeError\?\.\(\);[\s\S]*launchPopupLoadInFlight = false;[\s\S]*return undefined;/,
  );
  assert.match(
    nativeSource,
    /return \(\) => \{[\s\S]*if \(!didReachShowPath\) \{[\s\S]*launchPopupLoadInFlight = false;[\s\S]*\}/,
  );
});
