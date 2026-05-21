const assert = require('node:assert/strict');
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

test('web launch popup close control keeps a mobile-safe touch target', () => {
  const webSource = read('components/monetization/LaunchPopupAd.tsx');
  const closeButtonBlock = webSource.match(/closeButton: \{([\s\S]*?)\n  \},/)?.[1];

  assert.ok(closeButtonBlock, 'web launch popup closeButton style should be parseable');
  assert.match(closeButtonBlock, /minHeight: space\[6\]/);
  assert.match(closeButtonBlock, /justifyContent: 'center'/);
  assert.match(closeButtonBlock, /borderRadius: radius\.button/);
  assert.match(webSource, /hitSlop=\{space\[1\]\}/);
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
