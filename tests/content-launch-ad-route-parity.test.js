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
  '/chapter',
  '/citizenship-requirements',
  '/disclaimer',
  '/onboarding',
  '/privacy',
  '/search',
  '/settings',
  '/sources',
  '/support',
  '/terms',
];
const expectedEligibleRoutes = ['/', '/home', '/learn', '/mistakes', '/profile'];

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

function launchEligibleRoutes(source = read('lib/monetization/ads.ts')) {
  const routeBlock = source.match(
    /export const LAUNCH_POPUP_AD_ELIGIBLE_ROUTES = \[([\s\S]*?)\] as const;/,
  )?.[1];
  assert.ok(routeBlock, 'launch popup eligible-route allowlist should be parseable');
  return [...routeBlock.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

test('launch popup ad route allowlist stays aligned with safe study breakpoints', () => {
  const adsSource = read('lib/monetization/ads.ts');
  const rootLayout = read('app/_layout.tsx');

  assert.deepEqual(launchEligibleRoutes(adsSource), expectedEligibleRoutes);
  assert.deepEqual(launchSuppressedRoutes(adsSource), expectedSuppressedRoutes);
  assert.match(adsSource, /isLaunchPopupAdEligibleForPath/);
  assert.match(adsSource, /return !isLaunchPopupAdEligibleForPath\(pathname\)/);
  for (const route of expectedSuppressedRoutes) {
    assert.ok(adsSource.includes(`'${route}'`), `${route} should be in the suppression list`);
  }

  assert.match(rootLayout, /usePathname\(\)/);
  assert.match(rootLayout, /shouldSuppressLaunchPopupAdForPath\(pathname\)/);
  assert.match(rootLayout, /!suppressLaunchPopupAd && entitlementsReady/);
});

test('launch popup browser route matrix covers eligible Home and suppressed utility routes', () => {
  const launchModalSpec = read('tests/e2e/launch-modal-accessibility.spec.ts');

  assert.match(launchModalSpec, /const launchSuppressedRouteCases = \[/);
  assert.match(launchModalSpec, /'\/about-the-test'/);
  assert.match(launchModalSpec, /'\/settings'/);
  assert.match(launchModalSpec, /'\/search\?q=riksdag'/);
  assert.match(launchModalSpec, /'\/chapter\/ch01'/);
  assert.match(launchModalSpec, /launch sponsor route allowlist shows Home once/);
  assert.match(launchModalSpec, /page\.goto\('\/home', \{ waitUntil: 'networkidle' \}\)/);
  assert.match(launchModalSpec, /seedFreshSettingsLanguageAndAboutSeen\(page, 'sv'\)/);
  assert.match(launchModalSpec, /blockingModalOverlayLocator/);
  assert.match(launchModalSpec, /aria-label', 'Startannons'/);
  assert.match(launchModalSpec, /launch sponsor route allowlist suppresses \$\{routePath\}/);
  assert.match(launchModalSpec, /Testannons för appstart visas en gång per appstart/);
});

test('launch popup ad route suppression rejects missing explicit blocked routes', () => {
  const mutated = read('lib/monetization/ads.ts').replace("'/settings',", "'/settings-disabled',");

  assert.notDeepEqual(launchSuppressedRoutes(mutated), expectedSuppressedRoutes);
});

test('launch popup ad route allowlist rejects added interruptive routes', () => {
  const mutated = read('lib/monetization/ads.ts').replace(
    "'/profile',",
    "'/profile',\n  '/search',",
  );

  assert.notDeepEqual(launchEligibleRoutes(mutated), expectedEligibleRoutes);
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

test('web launch popup close control keeps keyboard button semantics', () => {
  const webSource = read('components/monetization/LaunchPopupAd.tsx');
  const launchModalSpec = read('tests/e2e/launch-modal-accessibility.spec.ts');

  assert.match(webSource, /Platform\.OS !== 'web'/);
  assert.match(webSource, /document\.addEventListener\('keydown', handleKeyDown\)/);
  assert.match(webSource, /event\.key !== 'Escape'/);
  assert.match(webSource, /event\.preventDefault\(\)/);
  assert.match(webSource, /accessibilityRole="button"/);
  assert.match(webSource, /accessibilityLabel=\{copy\.closeAccessibilityLabel\}/);
  assert.match(webSource, /onPress=\{\(\) => setVisible\(false\)\}/);
  assert.match(launchModalSpec, /launchCloseKeyboardCases/);
  assert.match(launchModalSpec, /launchEscapeCloseCases/);
  assert.match(launchModalSpec, /activationKey: 'Enter'/);
  assert.match(launchModalSpec, /activationKey: 'Space'/);
  assert.match(launchModalSpec, /page\.keyboard\.press\('Escape'\)/);
  assert.match(launchModalSpec, /page\.keyboard\.press\('Tab'\)/);
  assert.match(launchModalSpec, /page\.keyboard\.press\(activationKey\)/);
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
