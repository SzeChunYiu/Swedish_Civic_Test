const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName, moduleCache = new Map()) {
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(specifier) {
    if (specifier.startsWith('.')) {
      const resolvedPath = path.resolve(path.dirname(filePath), specifier);
      const tsPath = fs.existsSync(`${resolvedPath}.ts`) ? `${resolvedPath}.ts` : undefined;
      const tsxPath = fs.existsSync(`${resolvedPath}.tsx`) ? `${resolvedPath}.tsx` : undefined;
      const indexTsPath = fs.existsSync(path.join(resolvedPath, 'index.ts'))
        ? path.join(resolvedPath, 'index.ts')
        : undefined;
      const resolvedTsPath = tsPath ?? tsxPath ?? indexTsPath;

      if (resolvedTsPath?.startsWith(repoRoot)) {
        return loadTs(path.relative(repoRoot, resolvedTsPath), undefined, moduleCache);
      }
    }

    return require(specifier);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function withEnv(overrides, fn) {
  const previous = new Map();

  for (const key of Object.keys(overrides)) {
    previous.set(key, process.env[key]);
    const value = overrides[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test('Remove Ads entitlement blocks every web ad stub placement', () => {
  withEnv(
    {
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: undefined,
    },
    () => {
      const { adsConfig, shouldShowAd, shouldShowLaunchPopupAd } =
        loadTs('lib/monetization/ads.ts');
      const freeEntitlements = { adsDisabled: false };
      const removeAdsEntitlements = { adsDisabled: true };

      for (const placement of adsConfig.safePlacements) {
        assert.equal(
          shouldShowAd(placement, freeEntitlements),
          true,
          `${placement} should show with default test units before Remove Ads`,
        );
        assert.equal(
          shouldShowAd(placement, removeAdsEntitlements),
          false,
          `${placement} must hide after Remove Ads`,
        );
      }

      assert.equal(shouldShowAd('exam_screen', freeEntitlements), false);
      assert.equal(
        shouldShowLaunchPopupAd({
          alreadyShownThisLaunch: false,
          entitlements: removeAdsEntitlements,
        }),
        false,
      );
    },
  );
});

test('real ad serving still requires consent after entitlement gating passes', () => {
  withEnv(
    {
      EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN_LAUNCH_UNIT_ID: 'ca-app-pub-1234567890123456/1111111111',
      EXPO_PUBLIC_ADMOB_ANDROID_CHAPTER_LIST_BANNER_UNIT_ID:
        'ca-app-pub-1234567890123456/2222222222',
      EXPO_PUBLIC_ADMOB_ANDROID_HOME_BANNER_UNIT_ID: 'ca-app-pub-1234567890123456/3333333333',
      EXPO_PUBLIC_ADMOB_ANDROID_QUIZ_COMPLETED_INTERSTITIAL_UNIT_ID:
        'ca-app-pub-1234567890123456/4444444444',
      EXPO_PUBLIC_ADMOB_ANDROID_RESULTS_NATIVE_UNIT_ID: 'ca-app-pub-1234567890123456/5555555555',
      EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_EXTRA_EXAM_UNIT_ID:
        'ca-app-pub-1234567890123456/6666666666',
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: 'true',
    },
    () => {
      const { adsConfig, shouldShowAd } = loadTs('lib/monetization/ads.ts');
      const freeEntitlements = { adsDisabled: false };
      const removeAdsEntitlements = { adsDisabled: true };

      assert.equal(adsConfig.realAdsEnabled, true);
      assert.equal(adsConfig.realAdsRequireConsentDecision, true);
      assert.equal(shouldShowAd('home_banner', freeEntitlements), false);
      assert.equal(
        shouldShowAd('home_banner', freeEntitlements, { adServingAllowed: false }),
        false,
      );
      assert.equal(shouldShowAd('home_banner', freeEntitlements, { adServingAllowed: true }), true);
      assert.equal(
        shouldShowAd('home_banner', removeAdsEntitlements, { adServingAllowed: true }),
        false,
      );
    },
  );
});
