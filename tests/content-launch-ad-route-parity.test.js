const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

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

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadAdsRuntime(source = readRepoFile('lib/monetization/ads.ts')) {
  const module = { exports: {} };
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  vm.runInNewContext(
    transpiled,
    {
      module,
      exports: module.exports,
      process: { env: {} },
    },
    { filename: 'lib/monetization/ads.ts' },
  );

  return module.exports;
}

function assertLaunchPopupSuppressionContract({
  adsSource,
  rootLayout,
  runtime,
  validationSource,
}) {
  const { adsConfig, shouldSuppressLaunchPopupAdForPath } = runtime;

  assert.deepEqual(
    Array.from(adsConfig.suppressedLaunchPopupRoutes),
    expectedSuppressedRoutes,
    'launch popup suppressed routes should match release-safe route allowlist',
  );

  for (const route of expectedSuppressedRoutes) {
    assert.ok(adsSource.includes(`'${route}'`), `${route} should be in the suppression list`);
    assert.equal(
      shouldSuppressLaunchPopupAdForPath(route),
      true,
      `${route} should suppress launch popup ads`,
    );
    assert.equal(
      shouldSuppressLaunchPopupAdForPath(`${route}/nested`),
      true,
      `${route}/nested should suppress launch popup ads`,
    );
    assert.ok(
      validationSource.includes(`'${route}': 'app/`) ||
        validationSource.includes(`'${route}': "app/`),
      `${route} should have a validate-content route-file guard`,
    );
  }

  for (const route of ['/', '/home', '/learn', '/mistakes', '/profile']) {
    assert.equal(shouldSuppressLaunchPopupAdForPath(route), false);
  }

  assert.match(rootLayout, /usePathname\(\)/, 'root layout must read the current pathname');
  assert.match(
    rootLayout,
    /shouldSuppressLaunchPopupAdForPath\(pathname\)/,
    'root layout must derive launch ad suppression from current pathname',
  );
  assert.match(
    rootLayout,
    /!suppressLaunchPopupAd && entitlementsReady/,
    'root layout must gate launch popup ads behind route suppression',
  );
}

test('launch popup ad route suppression stays aligned with release-safe routes', () => {
  assertLaunchPopupSuppressionContract({
    adsSource: readRepoFile('lib/monetization/ads.ts'),
    rootLayout: readRepoFile('app/_layout.tsx'),
    runtime: loadAdsRuntime(),
    validationSource: readRepoFile('scripts/validate-content.js'),
  });
});

test('launch popup ad route suppression rejects missing compliance routes', () => {
  const adsSource = readRepoFile('lib/monetization/ads.ts').replace(
    "'/privacy',",
    "'/privacy-disabled',",
  );

  assert.throws(
    () =>
      assertLaunchPopupSuppressionContract({
        adsSource,
        rootLayout: readRepoFile('app/_layout.tsx'),
        runtime: loadAdsRuntime(adsSource),
        validationSource: readRepoFile('scripts/validate-content.js'),
      }),
    /launch popup suppressed routes should match release-safe route allowlist/,
  );
});

test('launch popup ad route suppression rejects root-layout bypass drift', () => {
  const rootLayout = readRepoFile('app/_layout.tsx').replace(
    'shouldSuppressLaunchPopupAdForPath(pathname)',
    'false',
  );

  assert.throws(
    () =>
      assertLaunchPopupSuppressionContract({
        adsSource: readRepoFile('lib/monetization/ads.ts'),
        rootLayout,
        runtime: loadAdsRuntime(),
        validationSource: readRepoFile('scripts/validate-content.js'),
      }),
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
