const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const expectedSuppressedRoutes = [
  '/exam',
  '/practice',
  '/quiz',
  '/about-the-test',
  '/citizenship-requirements',
  '/disclaimer',
  '/onboarding',
  '/privacy',
  '/sources',
  '/support',
  '/terms',
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function launchSuppressedRoutes(source = read('lib/monetization/ads.ts')) {
  const routeBlock = source.match(
    /export const LAUNCH_POPUP_AD_SUPPRESSED_ROUTES = \[([\s\S]*?)\] as const;/,
  )?.[1];
  assert.ok(routeBlock, 'launch popup suppression list should be parseable');
  return [...routeBlock.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

test('launch popup ad route suppression stays aligned with release-safe routes', () => {
  const adsSource = read('lib/monetization/ads.ts');
  const rootLayout = read('app/_layout.tsx');

  assert.deepEqual(launchSuppressedRoutes(adsSource), expectedSuppressedRoutes);
  for (const route of expectedSuppressedRoutes) {
    assert.ok(adsSource.includes(`'${route}'`), `${route} should be in the suppression list`);
  }

  assert.match(rootLayout, /usePathname\(\)/);
  assert.match(rootLayout, /shouldSuppressLaunchPopupAdForPath\(pathname\)/);
  assert.match(rootLayout, /!suppressLaunchPopupAd && entitlementsReady/);
});

test('launch popup ad route suppression rejects missing compliance routes', () => {
  const mutated = read('lib/monetization/ads.ts').replace("'/privacy',", "'/privacy-disabled',");

  assert.notDeepEqual(launchSuppressedRoutes(mutated), expectedSuppressedRoutes);
});

test('launch popup ad route suppression rejects root-layout bypass drift', () => {
  const mutated = read('app/_layout.tsx').replace(
    'shouldSuppressLaunchPopupAdForPath(pathname)',
    'false',
  );

  assert.doesNotMatch(mutated, /shouldSuppressLaunchPopupAdForPath\(pathname\)/);
});

test('visual smoke report shares the launch popup suppression policy', () => {
  const reportSource = read('scripts/visual-smoke-report.test.js');
  const localRouteIncludesCall = ['includes', '(route.route)'].join('');

  assert.match(reportSource, /loadTs\('lib\/monetization\/ads\.ts'\)/);
  assert.match(reportSource, /loadLaunchAdSuppressionPolicy/);
  assert.match(reportSource, /shouldSuppressLaunchPopupAdForPath\(route\.route\)/);
  assert.equal(
    reportSource.includes(localRouteIncludesCall),
    false,
    'visual smoke report should not duplicate launch suppression routes',
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
    /addAdEventListener\(AdEventType\.ERROR,[\s\S]*finishLoadAttempt\(\);/,
  );
  assert.match(
    nativeSource,
    /catch \{[\s\S]*unsubscribeLoadListeners\(\);[\s\S]*finishLoadAttempt\(\);[\s\S]*return undefined;/,
  );
  assert.match(
    nativeSource,
    /return \(\) => \{[\s\S]*unsubscribeLoadListeners\(\);[\s\S]*if \(!didReachShowPath && !attemptSettled\) \{[\s\S]*finishLoadAttempt\(\);[\s\S]*\}/,
  );
});

test('native launch popup load timeout clears in-flight without consuming runtime cap', () => {
  const nativeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/LaunchPopupAd.native.tsx'),
    'utf8',
  );

  const timeoutIndex = nativeSource.indexOf('loadTimeout = setTimeout(() => {');
  const loadIndex = nativeSource.indexOf('appOpenAd.load();');
  const loadedListenerIndex = nativeSource.indexOf('AdEventType.LOADED');
  const capIndex = nativeSource.indexOf('launchPopupShownThisRuntime = true;', loadedListenerIndex);

  assert.match(nativeSource, /const LAUNCH_POPUP_AD_LOAD_TIMEOUT_MS = 15_000;/);
  assert.match(nativeSource, /clearTimeout\(loadTimeout\);/);
  assert.match(
    nativeSource,
    /loadTimeout = setTimeout\(\(\) => \{[\s\S]*unsubscribeLoadListeners\(\);[\s\S]*finishLoadAttempt\(\);[\s\S]*\}, LAUNCH_POPUP_AD_LOAD_TIMEOUT_MS\);/,
  );
  assert.ok(timeoutIndex > loadedListenerIndex, 'timeout should be armed after listeners register');
  assert.ok(loadIndex > timeoutIndex, 'timeout should be armed before requesting the load');
  assert.ok(capIndex > loadedListenerIndex, 'runtime cap should remain in the loaded handler');
  assert.doesNotMatch(
    nativeSource.slice(timeoutIndex, loadIndex),
    /launchPopupShownThisRuntime = true;/,
    'timeout must not consume the one-per-runtime shown cap',
  );
});

test('launch popup parity rejects missing native load timeout cleanup', () => {
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
      .replace('loadTimeout = setTimeout(() => {', 'loadTimeout = undefined; (() => {');
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
    /native LaunchPopupAd must clear the in-flight flag when load callbacks stall/,
  );
});
