const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath, exportName) {
  const filePath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
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

test('ad rendering is enabled by default with test units and env-driven real switch', () => {
  withEnv(
    {
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: undefined,
    },
    () => {
      const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
      const { TEST_AD_UNITS, adsConfig, getPlatformAdUnitId, shouldShowAd } =
        loadTs('lib/monetization/ads.ts');

      assert.match(adsSource, /REAL_ADS_ENABLED/);
      assert.doesNotMatch(adsSource, /REAL_ADS_ENABLED_FOR_V1\s*=\s*false/);
      assert.ok(TEST_AD_UNITS.length >= 4);
      assert.ok(
        fs
          .readFileSync(path.join(repoRoot, 'components/monetization/NativeAdCard.tsx'), 'utf8')
          .includes('results_native'),
      );
      assert.equal(adsConfig.realAdsEnabled, false);
      assert.equal(adsConfig.googleMobileAdsEnabled, true);
      assert.ok(TEST_AD_UNITS.every((unit) => unit.testOnly));
      assert.ok(adsConfig.units.every((unit) => unit.testOnly));
      assert.equal(shouldShowAd('home_banner', { adsDisabled: false }), true);
      assert.equal(shouldShowAd('home_banner', { adsDisabled: true }), false);
      assert.equal(shouldShowAd('exam_screen', { adsDisabled: false }), false);
      assert.match(getPlatformAdUnitId('home_banner', 'android'), /^ca-app-pub-/);
      assert.match(getPlatformAdUnitId('home_banner', 'ios'), /^ca-app-pub-/);
      assert.match(getPlatformAdUnitId('app_open_launch', 'android'), /9257395921$/);
      assert.match(getPlatformAdUnitId('app_open_launch', 'ios'), /5575463023$/);
    },
  );
});

test('real ad units are selected from env when the real ads flag is enabled', () => {
  withEnv(
    {
      EXPO_PUBLIC_ADMOB_ANDROID_HOME_BANNER_UNIT_ID: 'ca-app-pub-1234567890123456/1111111111',
      EXPO_PUBLIC_ADMOB_IOS_HOME_BANNER_UNIT_ID: 'ca-app-pub-1234567890123456/2222222222',
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: 'true',
    },
    () => {
      const { adsConfig, getAdUnit, getPlatformAdUnitId, shouldShowAd } =
        loadTs('lib/monetization/ads.ts');
      const homeBanner = getAdUnit('home_banner');

      assert.equal(adsConfig.realAdsEnabled, true);
      assert.equal(homeBanner.testOnly, false);
      assert.equal(homeBanner.enabled, true);
      assert.equal(
        getPlatformAdUnitId('home_banner', 'android'),
        'ca-app-pub-1234567890123456/1111111111',
      );
      assert.equal(
        getPlatformAdUnitId('home_banner', 'ios'),
        'ca-app-pub-1234567890123456/2222222222',
      );
      assert.equal(shouldShowAd('home_banner', { adsDisabled: false }), false);
      assert.equal(
        shouldShowAd('home_banner', { adsDisabled: false }, { adServingAllowed: false }),
        false,
      );
      assert.equal(
        shouldShowAd('home_banner', { adsDisabled: false }, { adServingAllowed: true }),
        true,
      );
      assert.equal(shouldShowAd('results_native', { adsDisabled: false }), false);
    },
  );
});

test('ad rendering flag disables all placements even for free users', () => {
  withEnv(
    {
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: 'false',
      EXPO_PUBLIC_REAL_ADS_ENABLED: undefined,
    },
    () => {
      const { adsConfig, shouldShowAd, shouldShowLaunchPopupAd } =
        loadTs('lib/monetization/ads.ts');

      assert.equal(adsConfig.googleMobileAdsEnabled, false);
      assert.equal(shouldShowAd('home_banner', { adsDisabled: false }), false);
      assert.equal(shouldShowAd('results_native', { adsDisabled: false }), false);
      assert.equal(
        shouldShowLaunchPopupAd({
          alreadyShownThisLaunch: false,
          entitlements: { adsDisabled: false },
        }),
        false,
      );
    },
  );
});

test('app config registers the Google Mobile Ads Expo plugin with test app ids', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8'));
  const plugin = appJson.expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === 'react-native-google-mobile-ads',
  );

  assert.ok(plugin, 'react-native-google-mobile-ads plugin should be configured');
  assert.match(plugin[1].androidAppId, /^ca-app-pub-/);
  assert.match(plugin[1].iosAppId, /^ca-app-pub-/);
  assert.equal(plugin[1].delayAppMeasurementInit, true);
  assert.ok(appJson.expo.plugins.includes('expo-secure-store'));
  assert.ok(appJson.expo.plugins.includes('react-native-iap'));
});

test('launch popup ad respects launch cap and adsDisabled entitlement', () => {
  withEnv(
    {
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: undefined,
    },
    () => {
      const { shouldShowLaunchPopupAd } = loadTs('lib/monetization/ads.ts');

      assert.equal(
        shouldShowLaunchPopupAd({
          alreadyShownThisLaunch: false,
          entitlements: { adsDisabled: false },
        }),
        true,
      );
      assert.equal(
        shouldShowLaunchPopupAd({
          alreadyShownThisLaunch: true,
          entitlements: { adsDisabled: false },
        }),
        false,
      );
      assert.equal(
        shouldShowLaunchPopupAd({
          alreadyShownThisLaunch: false,
          entitlements: { adsDisabled: true },
        }),
        false,
      );
    },
  );
});

test('remove-ads entitlement is decoupled from premium feature bundle', () => {
  const { REMOVE_ADS_ENTITLEMENTS, hasAdsDisabled, isPremiumUser } = loadTs(
    'lib/monetization/premium.ts',
  );

  assert.equal(hasAdsDisabled(REMOVE_ADS_ENTITLEMENTS), true);
  assert.equal(isPremiumUser(REMOVE_ADS_ENTITLEMENTS), false);
  assert.equal(
    isPremiumUser({
      adsDisabled: false,
      fullMistakeReview: true,
      unlimitedMockExams: true,
    }),
    true,
  );
});

test('remove-ads IAP wrapper buys, restores, and persists adsDisabled', async () => {
  const purchaseExports = loadTs('lib/monetization/purchases.ts');
  const {
    REMOVE_ADS_PRICE_LABEL,
    REMOVE_ADS_PRODUCT_ID,
    buyRemoveAds,
    createMemoryPurchaseStorage,
    createMockPurchaseProvider,
    getPurchaseEntitlements,
    restoreRemoveAdsPurchase,
  } = purchaseExports;
  const purchasesSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/purchases.ts'),
    'utf8',
  );
  const removedVerifierExportName = ['REMOVE_ADS', 'VERIFIER', 'TOKEN'].join('_');

  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.equal(packageJson.dependencies['expo-secure-store'], '~15.0.8');
  assert.equal(packageJson.dependencies['react-native-iap'], '^15.3.0');
  assert.match(REMOVE_ADS_PRODUCT_ID, /removeads$/);
  assert.equal(REMOVE_ADS_PRICE_LABEL, '29 SEK');
  assert.equal(Object.hasOwn(purchaseExports, removedVerifierExportName), false);
  assert.doesNotMatch(purchasesSource, new RegExp(['remove', '\\.\\?', 'ads'].join(''), 'i'));

  const storage = createMemoryPurchaseStorage();
  assert.deepEqual(await getPurchaseEntitlements({ storage }), {
    adsDisabled: false,
    fullMistakeReview: false,
    unlimitedMockExams: false,
  });

  const purchaseResult = await buyRemoveAds({
    provider: createMockPurchaseProvider(),
    storage,
  });

  assert.equal(purchaseResult.status, 'purchased');
  assert.equal(purchaseResult.productId, REMOVE_ADS_PRODUCT_ID);
  assert.equal(purchaseResult.entitlements.adsDisabled, true);
  assert.equal(purchaseResult.entitlements.fullMistakeReview, false);
  assert.equal(purchaseResult.entitlements.unlimitedMockExams, false);
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, true);

  const restoredStorage = createMemoryPurchaseStorage();
  const restoreResult = await restoreRemoveAdsPurchase({
    provider: createMockPurchaseProvider({ owned: true }),
    storage: restoredStorage,
  });

  assert.equal(restoreResult.status, 'restored');
  assert.equal(restoreResult.entitlements.adsDisabled, true);
  assert.equal((await getPurchaseEntitlements({ storage: restoredStorage })).adsDisabled, true);

  const missingRestore = await restoreRemoveAdsPurchase({
    provider: createMockPurchaseProvider(),
    storage: createMemoryPurchaseStorage(),
  });
  assert.equal(missingRestore.status, 'not_found');
  assert.equal(missingRestore.entitlements.adsDisabled, false);
});

test('pending remove-ads purchase does not grant adsDisabled until store confirmation', async () => {
  const { buyRemoveAds, createMemoryPurchaseStorage, createMockPurchaseProvider } = loadTs(
    'lib/monetization/purchases.ts',
  );

  const result = await buyRemoveAds({
    provider: createMockPurchaseProvider({ pendingPurchase: true }),
    storage: createMemoryPurchaseStorage(),
  });

  assert.equal(result.status, 'pending');
  assert.equal(result.entitlements.adsDisabled, false);
});

test('remove-ads paywall is surfaced near an ad placement and wired to purchase helpers', () => {
  const paywallSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PremiumBanner.tsx'),
    'utf8',
  );
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');

  assert.match(paywallSource, /REMOVE_ADS_PRICE_LABEL/);
  assert.match(paywallSource, /buyRemoveAds/);
  assert.match(paywallSource, /restoreRemoveAdsPurchase/);
  assert.match(paywallSource, /setCurrentEntitlements/);
  assert.match(paywallSource, /onEntitlementsChange/);
  assert.match(paywallSource, /adsDisabled/);
  assert.match(paywallSource, /Buy Remove Ads for 29 SEK/);
  assert.match(paywallSource, /Restore Remove Ads purchase/);
  assert.doesNotMatch(paywallSource, /ads are deferred|RevenueCat can be added/i);
  assert.match(homeSource, /import \{ PremiumBanner \}/);
  assert.match(
    homeSource,
    /<PremiumBanner[\s\S]*entitlements=\{monetizationEntitlements\}[\s\S]*onEntitlementsChange=\{setMonetizationEntitlements\}[\s\S]*\/>\s*<AdBanner entitlements=\{monetizationEntitlements\} placement="home_banner" \/>/,
  );
});

test('release monetization policy requires ad-supported free tier and Remove Ads IAP', () => {
  const { REMOVE_ADS_PRICE_LABEL, REMOVE_ADS_PRODUCT_ID } = loadTs('lib/monetization/purchases.ts');
  const { isReleaseMonetizationPolicyReady, releaseMonetizationPolicy } = loadTs(
    'lib/monetization/releasePolicy.ts',
  );

  assert.equal(isReleaseMonetizationPolicyReady(), true);
  assert.equal(releaseMonetizationPolicy.adSupportedByDefault, true);
  assert.equal(releaseMonetizationPolicy.adMobAppRecordRequired, true);
  assert.equal(releaseMonetizationPolicy.appAdsTxtReviewRequired, true);
  assert.equal(releaseMonetizationPolicy.privacyReviewRequiresBinary, true);
  assert.equal(releaseMonetizationPolicy.realAdsEnvFlag, 'EXPO_PUBLIC_REAL_ADS_ENABLED');
  assert.equal(releaseMonetizationPolicy.removeAdsProductId, REMOVE_ADS_PRODUCT_ID);
  assert.equal(releaseMonetizationPolicy.removeAdsPriceLabel, REMOVE_ADS_PRICE_LABEL);
  assert.ok(releaseMonetizationPolicy.noAdPlacements.includes('exam_screen'));
  assert.deepEqual(releaseMonetizationPolicy.consentPromptsRequired, [
    'app_tracking_transparency',
    'ump_consent_form',
  ]);
  assert.match(releaseMonetizationPolicy.storeDisclosureTopics.join('\n'), /Google Mobile Ads/);
  assert.match(releaseMonetizationPolicy.storeDisclosureTopics.join('\n'), /Remove Ads/);
});

test('ad consent decision covers ATT and UMP prompts before real ad serving', () => {
  const consentSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/consent.ts'), 'utf8');
  const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
  const { consentConfig, getAdConsentDecision, getAdSdkInitializationDecision } = loadTs(
    'lib/monetization/consent.ts',
  );

  assert.match(consentSource, /App Tracking Transparency/);
  assert.match(consentSource, /UMP consent/);
  assert.match(consentSource, /canInitializeGoogleMobileAds/);
  assert.match(adsSource, /realAdsRequireConsentDecision/);
  assert.match(adsSource, /consentDecision\?\.adServingAllowed/);
  assert.deepEqual(consentConfig.prompts, ['app_tracking_transparency', 'ump_consent_form']);
  assert.equal(consentConfig.sdkInitRequiresConsentDecision, true);

  const pendingIosState = {
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    platform: 'ios',
    realAdsEnabled: true,
    region: 'eea',
    trackingTransparencyStatus: 'not_determined',
    umpConsentStatus: 'required',
  };
  const pendingIosDecision = getAdConsentDecision(pendingIosState);
  const pendingIosInit = getAdSdkInitializationDecision(pendingIosState);

  assert.equal(pendingIosDecision.adServingAllowed, false);
  assert.deepEqual(pendingIosDecision.pendingPrompts, [
    'app_tracking_transparency',
    'ump_consent_form',
  ]);
  assert.equal(pendingIosInit.canInitializeGoogleMobileAds, false);
  assert.equal(pendingIosInit.blockReason, 'pending_consent_prompts');

  const nonPersonalizedState = {
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    platform: 'ios',
    realAdsEnabled: true,
    region: 'eea',
    trackingTransparencyStatus: 'denied',
    umpConsentStatus: 'obtained',
  };
  const nonPersonalizedDecision = getAdConsentDecision(nonPersonalizedState);
  const nonPersonalizedInit = getAdSdkInitializationDecision(nonPersonalizedState);

  assert.equal(nonPersonalizedDecision.adServingAllowed, true);
  assert.equal(nonPersonalizedDecision.canRequestNonPersonalizedAds, true);
  assert.equal(nonPersonalizedDecision.canRequestPersonalizedAds, false);
  assert.deepEqual(nonPersonalizedDecision.pendingPrompts, []);
  assert.equal(nonPersonalizedInit.canInitializeGoogleMobileAds, true);
  assert.equal(nonPersonalizedInit.requestNonPersonalizedAdsOnly, true);
  assert.equal(nonPersonalizedInit.blockReason, undefined);

  const notRequiredState = {
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    platform: 'android',
    realAdsEnabled: true,
    region: 'us',
    trackingTransparencyStatus: 'unavailable',
    umpConsentStatus: 'not_required',
  };
  const notRequiredDecision = getAdConsentDecision(notRequiredState);

  assert.equal(notRequiredDecision.adServingAllowed, true);
  assert.deepEqual(notRequiredDecision.pendingPrompts, []);
  assert.equal(getAdSdkInitializationDecision(notRequiredState).canInitializeGoogleMobileAds, true);

  const disabledState = {
    entitlements: { adsDisabled: true },
    googleMobileAdsEnabled: true,
    platform: 'android',
    realAdsEnabled: true,
    region: 'eea',
    trackingTransparencyStatus: 'unavailable',
    umpConsentStatus: 'required',
  };
  const disabledDecision = getAdConsentDecision(disabledState);
  const disabledInit = getAdSdkInitializationDecision(disabledState);

  assert.equal(disabledDecision.adServingAllowed, false);
  assert.deepEqual(disabledDecision.pendingPrompts, []);
  assert.equal(disabledInit.canInitializeGoogleMobileAds, false);
  assert.equal(disabledInit.blockReason, 'remove_ads_entitlement');

  const disabledByConfigInit = getAdSdkInitializationDecision({
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: false,
    platform: 'android',
    realAdsEnabled: true,
    region: 'us',
    trackingTransparencyStatus: 'unavailable',
    umpConsentStatus: 'not_required',
  });
  assert.equal(disabledByConfigInit.canInitializeGoogleMobileAds, false);
  assert.equal(disabledByConfigInit.blockReason, 'google_ads_disabled');

  const testUnitInit = getAdSdkInitializationDecision({
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    platform: 'web',
    realAdsEnabled: false,
    region: 'unknown',
    trackingTransparencyStatus: 'unavailable',
    umpConsentStatus: 'unknown',
  });
  assert.equal(testUnitInit.canInitializeGoogleMobileAds, true);
  assert.equal(testUnitInit.blockReason, undefined);
});

test('exam screen does not import ad components', () => {
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  assert.doesNotMatch(examSource, /AdBanner|NativeAd|Interstitial/i);
});

test('global launch popup ad is suppressed on exam routes', () => {
  const layoutSource = fs.readFileSync(path.join(repoRoot, 'app/_layout.tsx'), 'utf8');

  assert.match(layoutSource, /usePathname/);
  assert.match(layoutSource, /pathname\s*===\s*['"]\/exam['"]/);
  assert.match(layoutSource, /pathname\.startsWith\(['"]\/exam\/['"]\)/);
  assert.match(layoutSource, /!\s*isExamRoute\s*\?\s*<LaunchPopupAd\s*\/>\s*:\s*null/);
});
