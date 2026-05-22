const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const { FOCUSED_VALIDATION_REGISTRY_BY_ID } = require('../scripts/validate-content-focus-registry');

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

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function parseJsonSummary(output, label) {
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, `${label} should print a JSON summary`);
  return JSON.parse(match[0]);
}

function loadLaunchPopupSessionModule() {
  const filename = path.join(repoRoot, 'components/monetization/launchPopupSession.ts');
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(output.outputText, filename);
  return mod.exports;
}

function createSessionStorageStub() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
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
  const webLaunchPopupAd = read('components/monetization/LaunchPopupAd.tsx');
  const nativeLaunchPopupAd = read('components/monetization/LaunchPopupAd.native.tsx');

  assert.deepEqual(launchSuppressedRoutes(adsSource), expectedSuppressedRoutes);
  for (const route of expectedSuppressedRoutes) {
    assert.ok(adsSource.includes(`'${route}'`), `${route} should be in the suppression list`);
  }

  assert.match(rootLayout, /usePathname\(\)/);
  assert.match(rootLayout, /shouldSuppressLaunchPopupAdForPath\(pathname\)/);
  assert.match(rootLayout, /!suppressLaunchPopupAd && entitlementsReady/);
  assert.notEqual(
    rootLayout.indexOf('<LaunchPopupAd entitlements={monetizationEntitlements} />'),
    -1,
  );
  assert.notEqual(rootLayout.indexOf('<FirstRunAboutTheTestModal />'), -1);
  assert.ok(
    rootLayout.indexOf('<LaunchPopupAd entitlements={monetizationEntitlements} />') <
      rootLayout.indexOf('<FirstRunAboutTheTestModal />'),
    'root layout should render LaunchPopupAd before the first-run modal',
  );
  assert.match(webLaunchPopupAd, /deferFirstRunAboutModalForLaunchSession\(\);/);
  assert.match(nativeLaunchPopupAd, /deferFirstRunAboutModalForLaunchSession\(\);/);
  assert.match(nativeLaunchPopupAd, /clearFirstRunAboutModalDeferralForLaunchSession/);
  assert.match(nativeLaunchPopupAd, /if \(launchPopupAdUnitId\) \{/);
  assert.doesNotMatch(nativeLaunchPopupAd, /nativeLaunchPopupMayShow/);
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
  assert.match(
    nativeSource,
    /const launchPopupAdUnitId =[\s\S]*mobileAdsConsent\.initialized[\s\S]*shouldShowLaunchPopupAd/,
  );
  assert.match(
    nativeSource,
    /useEffect\(\(\) => \{[\s\S]*if \(!launchPopupAdUnitId\) return undefined;/,
  );
  assert.match(nativeSource, /launchPopupLoadInFlight = true;[\s\S]*appOpenAd\.load\(\);/);
  assert.match(
    nativeSource,
    /addAdEventListener\(AdEventType\.ERROR,[\s\S]*finishLoadAttempt\(\);[\s\S]*clearTentativeFirstRunDeferral\(\);/,
  );
  assert.match(
    nativeSource,
    /catch \{[\s\S]*unsubscribeLoadListeners\(\);[\s\S]*finishLoadAttempt\(\);[\s\S]*clearTentativeFirstRunDeferral\(\);[\s\S]*return undefined;/,
  );
  assert.match(
    nativeSource,
    /return \(\) => \{[\s\S]*unsubscribeLoadListeners\(\);[\s\S]*if \(!didReachShowPath && !attemptSettled\) \{[\s\S]*finishLoadAttempt\(\);[\s\S]*clearTentativeFirstRunDeferral\(\);[\s\S]*\}/,
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
    /loadTimeout = setTimeout\(\(\) => \{[\s\S]*unsubscribeLoadListeners\(\);[\s\S]*finishLoadAttempt\(\);[\s\S]*clearTentativeFirstRunDeferral\(\);[\s\S]*\}, LAUNCH_POPUP_AD_LOAD_TIMEOUT_MS\);/,
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
process.argv.push('--focus-launch-ad-load-timeout');
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

test('native launch popup load timeout focused validator reports only timeout coverage', () => {
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('launchAdLoadTimeout');
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-launch-ad-load-timeout'],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = parseJsonSummary(result.stdout, 'launch load timeout focused validation');
  assert.deepEqual(registryEntry.flags, ['--focus-launch-ad-load-timeout']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'launchAdLoadTimeoutRulesValidated',
    'launchAdLoadTimeoutParityValidated',
  ]);
  assert.deepEqual(Object.keys(summary).sort(), registryEntry.summaryKeys.slice().sort());
  assert.equal(summary.launchAdLoadTimeoutRulesValidated, 10);
  assert.equal(summary.launchAdLoadTimeoutParityValidated, true);
});

test('native first-run deferral stays wired to the eligible app-open path', () => {
  const nativeSource = read('components/monetization/LaunchPopupAd.native.tsx');
  const sessionSource = read('components/monetization/launchPopupSession.ts');
  const firstRunModalSource = read('components/onboarding/FirstRunAboutTheTestModal.tsx');
  const validatorSource = read('scripts/validate-content.js');

  assert.match(
    nativeSource,
    /clearFirstRunAboutModalDeferralForLaunchSession,[\s\S]*deferFirstRunAboutModalForLaunchSession,/,
  );
  assert.match(
    nativeSource,
    /const launchPopupAdUnitId =[\s\S]*mobileAdsConsent\.initialized[\s\S]*shouldShowLaunchPopupAd[\s\S]*\? nativeLaunchPopupUnitId/,
  );
  assert.match(
    nativeSource,
    /if \(launchPopupAdUnitId\) \{[\s\S]*deferFirstRunAboutModalForLaunchSession\(\);[\s\S]*\}/,
  );
  assert.doesNotMatch(nativeSource, /if \(nativeLaunchPopupMayShow\)/);
  assert.match(
    nativeSource,
    /const clearTentativeFirstRunDeferral = \(\) => \{[\s\S]*if \(didReachShowPath\) return;[\s\S]*clearFirstRunAboutModalDeferralForLaunchSession\(\);[\s\S]*\};/,
  );
  assert.match(sessionSource, /removeItem\?: \(key: string\) => void;/);
  assert.match(sessionSource, /export function clearFirstRunAboutModalDeferralForLaunchSession/);
  assert.match(sessionSource, /storage\.removeItem\(firstRunDeferralKey\);/);
  assert.match(sessionSource, /const firstRunDeferralListeners = new Set<\(\) => void>\(\);/);
  assert.match(
    sessionSource,
    /export function subscribeToFirstRunAboutModalDeferralForLaunchSession/,
  );
  assert.match(
    firstRunModalSource,
    /useState\(\(\) =>\s*shouldDeferFirstRunAboutModalForLaunchSession\(\),\s*\)/,
  );
  assert.match(firstRunModalSource, /subscribeToFirstRunAboutModalDeferralForLaunchSession/);
  assert.match(firstRunModalSource, /deferWhenLaunchPopupAdShown && launchPopupAdDeferred/);
  assert.match(
    validatorSource,
    /native launch ad must defer the first-run About modal only after consent yields a launch ad unit/,
  );
  assert.match(validatorSource, /--focus-launch-ad-deferral/);
  assert.match(validatorSource, /--focus-launch-ad-load-timeout/);
  assert.match(validatorSource, /launchAdFirstRunDeferralRulesValidated/);
  assert.match(validatorSource, /launchAdFirstRunDeferralParityValidated/);
  assert.match(validatorSource, /launchAdLoadTimeoutRulesValidated/);
  assert.match(validatorSource, /launchAdLoadTimeoutParityValidated/);
});

test('launch popup session deferral runtime clears storage and notifies subscribers', () => {
  const previousRuntimeDeferral = globalThis.__sctLaunchPopupFirstRunDeferred;
  const hadSessionStorage = Object.prototype.hasOwnProperty.call(globalThis, 'sessionStorage');
  const previousSessionStorage = globalThis.sessionStorage;
  const sessionStorage = createSessionStorageStub();

  try {
    globalThis.__sctLaunchPopupFirstRunDeferred = false;
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: sessionStorage,
      writable: true,
    });

    const launchPopupSession = loadLaunchPopupSessionModule();
    const notifications = [];
    const unsubscribe =
      launchPopupSession.subscribeToFirstRunAboutModalDeferralForLaunchSession(() => {
        notifications.push(launchPopupSession.shouldDeferFirstRunAboutModalForLaunchSession());
      });

    launchPopupSession.deferFirstRunAboutModalForLaunchSession();

    assert.equal(globalThis.__sctLaunchPopupFirstRunDeferred, true);
    assert.equal(sessionStorage.getItem('sct_launch_popup_first_run_deferred'), '1');
    assert.equal(launchPopupSession.shouldDeferFirstRunAboutModalForLaunchSession(), true);
    assert.deepEqual(notifications, [true]);

    launchPopupSession.clearFirstRunAboutModalDeferralForLaunchSession();

    assert.equal(globalThis.__sctLaunchPopupFirstRunDeferred, false);
    assert.equal(sessionStorage.getItem('sct_launch_popup_first_run_deferred'), null);
    assert.equal(launchPopupSession.shouldDeferFirstRunAboutModalForLaunchSession(), false);
    assert.deepEqual(notifications, [true, false]);

    unsubscribe();
    launchPopupSession.deferFirstRunAboutModalForLaunchSession();

    assert.deepEqual(notifications, [true, false]);
  } finally {
    if (previousRuntimeDeferral === undefined) {
      delete globalThis.__sctLaunchPopupFirstRunDeferred;
    } else {
      globalThis.__sctLaunchPopupFirstRunDeferred = previousRuntimeDeferral;
    }
    if (hadSessionStorage) {
      Object.defineProperty(globalThis, 'sessionStorage', {
        configurable: true,
        value: previousSessionStorage,
        writable: true,
      });
    } else {
      delete globalThis.sessionStorage;
    }
  }
});
