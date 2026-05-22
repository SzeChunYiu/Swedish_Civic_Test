const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  createMemoryLocalStorage,
  createReactHookStub,
  createReactNativeWebStub,
  createTsLoader,
  withGlobalProperties,
} = require('../tests/helpers/monetizationRuntimeHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const loadTs = createTsLoader(repoRoot);

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

function makeNativeIapProductFixture({ availablePurchases = [] } = {}) {
  const state = {
    requestedProductIds: [],
    restored: false,
  };

  const iap = {
    async initConnection() {},
    async endConnection() {},
    async finishTransaction() {},
    async getAvailablePurchases() {
      return availablePurchases;
    },
    purchaseErrorListener() {
      return { remove() {} };
    },
    purchaseUpdatedListener() {
      return { remove() {} };
    },
    async requestPurchase({ request }) {
      const productId = request.apple.sku;
      state.requestedProductIds.push(productId);
      return {
        ids: [productId],
        productId,
        purchaseToken: `tok-${productId}`,
        transactionId: `tx-${productId}`,
      };
    },
    async restorePurchases() {
      state.restored = true;
    },
  };

  return { iap, state };
}

const REAL_AD_UNIT_ENV_KEYS = {
  app_open_launch: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN_LAUNCH_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_APP_OPEN_LAUNCH_UNIT_ID',
  },
  chapter_list_banner: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_CHAPTER_LIST_BANNER_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_CHAPTER_LIST_BANNER_UNIT_ID',
  },
  home_banner: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_HOME_BANNER_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_HOME_BANNER_UNIT_ID',
  },
  quiz_completed_interstitial: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_QUIZ_COMPLETED_INTERSTITIAL_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_QUIZ_COMPLETED_INTERSTITIAL_UNIT_ID',
  },
  results_native: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_RESULTS_NATIVE_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_RESULTS_NATIVE_UNIT_ID',
  },
  rewarded_extra_exam: {
    android: 'EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_EXTRA_EXAM_UNIT_ID',
    ios: 'EXPO_PUBLIC_ADMOB_IOS_REWARDED_EXTRA_EXAM_UNIT_ID',
  },
};
const MONETIZATION_THEME_SURFACE_CONTRACTS = {
  'components/monetization/AdBanner.tsx': [
    'color: themeColors.badgeBlueText',
    'color: themeColors.text',
    'color: themeColors.textMuted',
  ],
  'components/monetization/AdBanner.native.tsx': [
    'backgroundColor: themeColors.surfaceWarm',
    'borderColor: themeColors.border',
  ],
  'components/monetization/LaunchPopupAd.tsx': [
    'backgroundColor: themeColors.surfaceMuted',
    'backgroundColor: themeColors.surface',
    'backgroundColor: themeColors.accent',
  ],
  'components/monetization/NativeAdCard.tsx': [
    'color: themeColors.badgeBlueText',
    'color: themeColors.text',
    'color: themeColors.textMuted',
  ],
  'components/monetization/NativeAdCard.native.tsx': [
    'backgroundColor: themeColors.surfaceWarm',
    'backgroundColor: themeColors.accent',
    'color: themeColors.surface',
  ],
  'components/monetization/PracticeInterstitialAd.tsx': [
    'color: themeColors.badgeBlueText',
    'color: themeColors.text',
    'color: themeColors.textMuted',
  ],
  'components/monetization/PremiumBanner.tsx': [
    'color: themeColors.badgeBlueText',
    'color: themeColors.text',
    'color: themeColors.textMuted',
  ],
  'components/monetization/PricingWedge.tsx': [
    'backgroundColor: themeColors.successSoft',
    'borderColor: themeColors.success',
    'color: themeColors.text',
  ],
  'components/monetization/ProPaywall.tsx': [
    'borderColor: themeColors.border',
    'backgroundColor: themeColors.surfaceMuted',
    'color: themeColors.textPlaceholder',
  ],
  'components/monetization/RemoveAdsPlacementCta.tsx': [
    'color: themeColors.badgeBlueText',
    'color: themeColors.text',
    'color: themeColors.textMuted',
  ],
};

function clearRealAdUnitEnv() {
  return Object.values(REAL_AD_UNIT_ENV_KEYS).reduce((overrides, envKeys) => {
    overrides[envKeys.android] = undefined;
    overrides[envKeys.ios] = undefined;
    return overrides;
  }, {});
}

test('ad rendering is enabled by default with test units and env-driven real switch', () => {
  withEnv(
    {
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: undefined,
    },
    () => {
      const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
      const {
        TEST_AD_UNITS,
        adsConfig,
        getPlatformAdUnitId,
        isAdPlacementAvailableOnPlatform,
        shouldShowAd,
      } = loadTs('lib/monetization/ads.ts');

      assert.match(adsSource, /REAL_ADS_ENABLED/);
      assert.match(adsSource, /export type AdRuntimePlatform = 'ios' \| 'android';/);
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
      assert.equal(isAdPlacementAvailableOnPlatform('home_banner', 'android'), true);
      assert.equal(isAdPlacementAvailableOnPlatform('home_banner', 'ios'), true);
      assert.match(getPlatformAdUnitId('home_banner', 'android'), /^ca-app-pub-/);
      assert.match(getPlatformAdUnitId('home_banner', 'ios'), /^ca-app-pub-/);
      assert.match(getPlatformAdUnitId('app_open_launch', 'android'), /9257395921$/);
      assert.match(getPlatformAdUnitId('app_open_launch', 'ios'), /5575463023$/);
      assert.match(getPlatformAdUnitId('rewarded_extra_exam', 'android'), /5224354917$/);
      assert.match(getPlatformAdUnitId('rewarded_extra_exam', 'ios'), /1712485313$/);
    },
  );
});

test('monetization ad and paywall surfaces use active theme colors', () => {
  for (const [componentPath, requiredSnippets] of Object.entries(
    MONETIZATION_THEME_SURFACE_CONTRACTS,
  )) {
    const source = fs.readFileSync(path.join(repoRoot, componentPath), 'utf8');

    assert.match(
      source,
      /useThemeColors\(\)/,
      `${componentPath} should subscribe to the active theme`,
    );
    assert.match(
      source,
      /function createStyles\(themeColors: ThemeColors\)/,
      `${componentPath} should create styles from ThemeColors`,
    );
    assert.doesNotMatch(
      source,
      /import \{[^}]*\bcolors\b[^}]*\} from ['"]\.\.\/\.\.\/lib\/theme['"]/,
      `${componentPath} should not import the static light colors singleton`,
    );
    assert.doesNotMatch(
      source,
      /\bcolors\./,
      `${componentPath} should not read colors.* when rendered in dark mode`,
    );

    for (const snippet of requiredSnippets) {
      assert.ok(source.includes(snippet), `${componentPath} should include ${snippet}`);
    }
  }
});

test('real ad availability is platform-specific for every placement', () => {
  const freeEntitlements = { adsDisabled: false };
  const consentDecision = { adServingAllowed: true };

  for (const [placement, envKeys] of Object.entries(REAL_AD_UNIT_ENV_KEYS)) {
    for (const activePlatform of ['android', 'ios']) {
      const inactivePlatform = activePlatform === 'android' ? 'ios' : 'android';
      const activeUnitId = `ca-app-pub-1234567890123456/${activePlatform === 'android' ? '1' : '2'}${placement.length
        .toString()
        .padStart(9, '0')}`;

      withEnv(
        {
          ...clearRealAdUnitEnv(),
          [envKeys[activePlatform]]: activeUnitId,
          EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
          EXPO_PUBLIC_REAL_ADS_ENABLED: 'true',
        },
        () => {
          const { getPlatformAdUnitId, isAdPlacementAvailableOnPlatform, shouldShowAd } = loadTs(
            'lib/monetization/ads.ts',
            undefined,
            new Map(),
          );

          assert.equal(getPlatformAdUnitId(placement, activePlatform), activeUnitId);
          assert.equal(getPlatformAdUnitId(placement, inactivePlatform), undefined);
          assert.equal(isAdPlacementAvailableOnPlatform(placement, activePlatform), true);
          assert.equal(isAdPlacementAvailableOnPlatform(placement, inactivePlatform), false);
          assert.equal(
            shouldShowAd(placement, freeEntitlements, consentDecision, activePlatform),
            true,
          );
          assert.equal(
            shouldShowAd(placement, freeEntitlements, consentDecision, inactivePlatform),
            false,
          );
          assert.equal(shouldShowAd(placement, freeEntitlements, consentDecision), true);
        },
      );
    }
  }
});

test('every ad placement has a configured unit and real-unit env slot', () => {
  const { TEST_AD_UNITS, adsConfig, getAdUnit } = loadTs('lib/monetization/ads.ts');
  const expectedPlacements = [
    'home_banner',
    'chapter_list_banner',
    'quiz_completed_interstitial',
    'results_native',
    'rewarded_extra_exam',
    'app_open_launch',
  ];

  assert.deepEqual(
    TEST_AD_UNITS.map((unit) => unit.placement).sort(),
    [...expectedPlacements].sort(),
  );
  assert.deepEqual([...adsConfig.safePlacements].sort(), [...expectedPlacements].sort());

  for (const placement of expectedPlacements) {
    assert.ok(getAdUnit(placement), `${placement} should resolve a configured unit`);
    assert.match(adsConfig.realUnitEnvKeys[placement].android, /^EXPO_PUBLIC_ADMOB_ANDROID_/);
    assert.match(adsConfig.realUnitEnvKeys[placement].ios, /^EXPO_PUBLIC_ADMOB_IOS_/);
  }
});

test('real ad units are selected from env when the real ads flag is enabled', () => {
  withEnv(
    {
      EXPO_PUBLIC_ADMOB_ANDROID_HOME_BANNER_UNIT_ID: 'ca-app-pub-1234567890123456/1111111111',
      EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_EXTRA_EXAM_UNIT_ID:
        'ca-app-pub-1234567890123456/3333333333',
      EXPO_PUBLIC_ADMOB_IOS_HOME_BANNER_UNIT_ID: 'ca-app-pub-1234567890123456/2222222222',
      EXPO_PUBLIC_ADMOB_IOS_REWARDED_EXTRA_EXAM_UNIT_ID: 'ca-app-pub-1234567890123456/4444444444',
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
      assert.equal(
        getPlatformAdUnitId('rewarded_extra_exam', 'android'),
        'ca-app-pub-1234567890123456/3333333333',
      );
      assert.equal(
        getPlatformAdUnitId('rewarded_extra_exam', 'ios'),
        'ca-app-pub-1234567890123456/4444444444',
      );
      assert.equal(
        shouldShowAd('rewarded_extra_exam', { adsDisabled: false }, { adServingAllowed: true }),
        true,
      );
      assert.equal(shouldShowAd('results_native', { adsDisabled: false }), false);
    },
  );
});

test('results native placement uses the native Google Mobile Ads surface on native builds', () => {
  const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
  const adCopySource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/adCopy.ts'), 'utf8');
  const adBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.tsx'),
    'utf8',
  );
  const nativeAdCardSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/NativeAdCard.native.tsx'),
    'utf8',
  );
  const webAdCardSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/NativeAdCard.tsx'),
    'utf8',
  );
  const mistakesSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');

  assert.match(mistakesSource, /<NativeAdCard \/>/);
  assert.match(adsSource, /export const WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.match(adBannerSource, /WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.doesNotMatch(adBannerSource, /WEB_FALLBACK_CONSENT_DECISION/);
  assert.match(nativeAdCardSource, /NativeAd\.createForAdRequest/);
  assert.match(nativeAdCardSource, /NativeAdView/);
  assert.match(nativeAdCardSource, /NativeAssetType\.HEADLINE/);
  assert.match(nativeAdCardSource, /NativeAssetType\.BODY/);
  assert.match(nativeAdCardSource, /NativeAssetType\.CALL_TO_ACTION/);
  assert.match(nativeAdCardSource, /NativeMediaView/);
  assert.match(nativeAdCardSource, /getNativeAdCardCopy/);
  assert.match(nativeAdCardSource, /getNativeAdSummaryAccessibilityLabel/);
  assert.match(
    nativeAdCardSource,
    /const summaryAccessibilityLabel = getNativeAdSummaryAccessibilityLabel\(copy, \{\s*advertiser: nativeAd\.advertiser,\s*body: nativeAd\.body,\s*headline: nativeAd\.headline,\s*\}\);/,
  );
  assert.match(nativeAdCardSource, /const resultsNativeUnit = getAdUnit\('results_native'\);/);
  assert.match(
    nativeAdCardSource,
    /const copy = getNativeAdCardCopy\(language, \{ testOnly: resultsNativeUnit\?\.testOnly \}\);/,
  );
  assert.match(nativeAdCardSource, /getPlatformAdUnitId\('results_native', Platform\.OS\)/);
  assert.match(nativeAdCardSource, /requestNonPersonalizedAdsOnly/);
  assert.match(nativeAdCardSource, /\.destroy\(\)/);
  assert.match(
    nativeAdCardSource,
    /shouldShowAd\(\s*'results_native'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );
  assert.doesNotMatch(nativeAdCardSource, /createPlaceholderNativeAd|Sponsored study placement/);

  assert.match(webAdCardSource, /WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.match(webAdCardSource, /getNativeAdCardCopy/);
  assert.match(webAdCardSource, /const resultsNativeUnit = getAdUnit\('results_native'\);/);
  assert.match(
    webAdCardSource,
    /const copy = getNativeAdCardCopy\(language, \{ testOnly: resultsNativeUnit\?\.testOnly \}\);/,
  );
  assert.match(
    webAdCardSource,
    /shouldShowAd\('results_native', resolvedEntitlements, WEB_AD_FALLBACK_CONSENT_DECISION\)/,
  );
  assert.match(
    webAdCardSource,
    /<Card accessibilityHint=\{copy\.hint\} accessibilityLabel=\{copy\.accessibilityLabel\}>/,
  );
  assert.doesNotMatch(webAdCardSource, /react-native-google-mobile-ads|NativeAdView/);
  assert.match(adCopySource, /getNativeAdCardCopy/);
  assert.match(adCopySource, /getNativeAdSummaryAccessibilityLabel/);
  assert.match(adCopySource, /live:\s*\{[\s\S]*?accessibilityLabel:\s*'Ad:/);
  assert.match(adCopySource, /live:\s*\{[\s\S]*?accessibilityLabel:\s*'Annons:/);
  assert.match(adCopySource, /test:\s*\{[\s\S]*?accessibilityLabel:\s*'Test native ad:/);
  const liveCopyBlocks = Array.from(
    adCopySource.matchAll(/live:\s*\{([\s\S]*?)\n    \},\n    test:/g),
    (match) => match[1],
  );
  assert.equal(liveCopyBlocks.length, 2);
  for (const liveCopyBlock of liveCopyBlocks) {
    assert.doesNotMatch(
      liveCopyBlock,
      /Test native ad|Inbyggd testannons|AdMob test placement preview|AdMob-testplacering/,
    );
  }
});

test('native ad card copy switches between live attribution and test disclosure', () => {
  const { getNativeAdCardCopy, getNativeAdSummaryAccessibilityLabel } = loadTs(
    'lib/monetization/adCopy.ts',
  );

  const englishLiveCopy = JSON.stringify(getNativeAdCardCopy('en', { testOnly: false }));
  const swedishLiveCopy = JSON.stringify(getNativeAdCardCopy('sv', { testOnly: false }));
  const englishTestCopy = JSON.stringify(getNativeAdCardCopy('en', { testOnly: true }));
  const swedishTestCopy = JSON.stringify(getNativeAdCardCopy('sv', { testOnly: true }));

  assert.match(englishLiveCopy, /Ad:/);
  assert.match(swedishLiveCopy, /Annons:/);
  assert.match(englishTestCopy, /Test native ad|AdMob test placement preview/);
  assert.match(swedishTestCopy, /Inbyggd testannons|AdMob-testplacering/);
  assert.doesNotMatch(
    englishLiveCopy,
    /Test native ad|AdMob test placement preview|Sponsored study placement/,
  );
  assert.doesNotMatch(swedishLiveCopy, /Inbyggd testannons|AdMob-testplacering/);

  assert.equal(
    getNativeAdSummaryAccessibilityLabel(getNativeAdCardCopy('en'), {
      advertiser: 'Civic Prep AB',
      body: 'Short offer body',
      headline: 'Practice smarter today',
    }),
    'Ad: Results ad. Sponsored placement. Keep out of timed exams. Hidden after Remove Ads is active. Practice smarter today Civic Prep AB Short offer body',
  );
  assert.equal(
    getNativeAdSummaryAccessibilityLabel(getNativeAdCardCopy('sv', { testOnly: true }), {
      advertiser: '',
      body: '  Samma text  ',
      headline: 'Samma text',
    }),
    'Inbyggd testannons: Annons i resultatvyn. Förhandsvisning av AdMob-testplacering. Visas inte i tidsatta prov. Döljs när Ta bort annonser är aktivt. Samma text',
  );
});

test('native practice interstitial uses consent-aware ad gate and platform unit lookup', () => {
  const practiceInterstitialSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PracticeInterstitialAd.native.tsx'),
    'utf8',
  );

  assert.match(practiceInterstitialSource, /InterstitialAd\.createForAdRequest/);
  assert.match(practiceInterstitialSource, /createPracticeInterstitialAttemptState/);
  assert.match(practiceInterstitialSource, /reducePracticeInterstitialAttemptState/);
  assert.match(practiceInterstitialSource, /PRACTICE_INTERSTITIAL_LOAD_TIMEOUT_MS/);
  assert.match(practiceInterstitialSource, /PRACTICE_INTERSTITIAL_SHOW_TIMEOUT_MS/);
  assert.match(practiceInterstitialSource, /requestNonPersonalizedAdsOnly/);
  assert.match(practiceInterstitialSource, /AdEventType\.OPENED/);
  assert.match(practiceInterstitialSource, /AdEventType\.CLOSED/);
  assert.match(practiceInterstitialSource, /Promise\.resolve\(interstitialAd\.show\(\)\)/);
  assert.match(practiceInterstitialSource, /\.then\(\(\) => \{[\s\S]*show_resolved/);
  assert.match(practiceInterstitialSource, /dispatchAttemptEvent\('show_timeout'\)/);
  assert.match(practiceInterstitialSource, /dispatchAttemptEvent\('load_timeout'\)/);
  assert.doesNotMatch(
    practiceInterstitialSource,
    /AdEventType\.LOADED[\s\S]{0,260}lastInterstitialShowKey\s*=/,
  );
  assert.doesNotMatch(practiceInterstitialSource, /let attemptSettled|let showStarted/);
  assert.match(
    practiceInterstitialSource,
    /getPlatformAdUnitId\('quiz_completed_interstitial', Platform\.OS\)/,
  );
  assert.match(
    practiceInterstitialSource,
    /shouldShowAd\(\s*'quiz_completed_interstitial'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );
  assert.doesNotMatch(
    practiceInterstitialSource,
    /shouldShowAd\(\s*'quiz_completed_interstitial'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,?\s*\)/,
  );
});

test('PracticeInterstitial attempt state settles timeout, cleanup, success, and late callbacks', () => {
  const {
    PRACTICE_INTERSTITIAL_LOAD_TIMEOUT_MS,
    PRACTICE_INTERSTITIAL_SHOW_TIMEOUT_MS,
    createPracticeInterstitialAttemptState,
    reducePracticeInterstitialAttemptState,
  } = loadTs('lib/monetization/practiceInterstitialAttempt.ts');

  function reduceEvents(events) {
    return events.reduce(
      (state, event) => reducePracticeInterstitialAttemptState(state, event),
      createPracticeInterstitialAttemptState(),
    );
  }

  assert.equal(PRACTICE_INTERSTITIAL_LOAD_TIMEOUT_MS, 10_000);
  assert.equal(PRACTICE_INTERSTITIAL_SHOW_TIMEOUT_MS, 8_000);

  assert.deepEqual(reduceEvents(['load_timeout']), {
    inFlight: false,
    outcome: 'load_timeout',
    phase: 'settled',
    settled: true,
    showKeyConsumed: false,
  });
  assert.deepEqual(reduceEvents(['error']), {
    inFlight: false,
    outcome: 'error',
    phase: 'settled',
    settled: true,
    showKeyConsumed: false,
  });
  assert.deepEqual(reduceEvents(['cleanup']), {
    inFlight: false,
    outcome: 'cleanup',
    phase: 'settled',
    settled: true,
    showKeyConsumed: false,
  });

  const loadedState = reduceEvents(['loaded']);
  assert.deepEqual(loadedState, {
    inFlight: true,
    phase: 'showing',
    settled: false,
    showKeyConsumed: false,
  });

  const stalledShowState = reduceEvents(['loaded', 'show_timeout']);
  assert.deepEqual(stalledShowState, {
    inFlight: false,
    outcome: 'show_timeout',
    phase: 'settled',
    settled: true,
    showKeyConsumed: false,
  });
  assert.strictEqual(
    reducePracticeInterstitialAttemptState(stalledShowState, 'opened'),
    stalledShowState,
  );

  for (const event of ['opened', 'closed', 'show_resolved']) {
    assert.deepEqual(reduceEvents(['loaded', event]), {
      inFlight: false,
      outcome: event,
      phase: 'settled',
      settled: true,
      showKeyConsumed: true,
    });
  }

  assert.deepEqual(reduceEvents(['loaded', 'show_rejected']), {
    inFlight: false,
    outcome: 'show_rejected',
    phase: 'settled',
    settled: true,
    showKeyConsumed: false,
  });
});

test('native AdBanner uses platform-aware unit lookup and shouldShowAd gate', () => {
  const nativeBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.native.tsx'),
    'utf8',
  );
  const webBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.tsx'),
    'utf8',
  );

  assert.match(nativeBannerSource, /getPlatformAdUnitId\(placement, Platform\.OS\)/);
  assert.match(
    nativeBannerSource,
    /shouldShowAd\(\s*placement\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );
  assert.match(
    nativeBannerSource,
    /requestOptions=\{\{\s*requestNonPersonalizedAdsOnly:\s*mobileAdsConsent\.decision\.requestNonPersonalizedAdsOnly,\s*\}\}/,
  );
  assert.match(nativeBannerSource, /size=\{BannerAdSize\.ANCHORED_ADAPTIVE_BANNER\}/);
  assert.doesNotMatch(
    nativeBannerSource,
    /shouldShowAd\(\s*placement\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,?\s*\)/,
  );
  assert.match(webBannerSource, /WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.match(
    webBannerSource,
    /shouldShowAd\(\s*placement\s*,\s*resolvedEntitlements\s*,\s*WEB_AD_FALLBACK_CONSENT_DECISION\s*,?\s*\)/,
  );
  assert.doesNotMatch(webBannerSource, /react-native-google-mobile-ads/);
});

test('rewarded extra exam access uses free limits before offering ads', () => {
  withEnv(
    {
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: undefined,
    },
    () => {
      const {
        REWARDED_EXTRA_EXAM_PLACEMENT,
        consumeRewardedExtraExamCredit,
        getMockExamAccessDecision,
        getMockExamAccessReadFailedDecision,
        grantRewardedExtraExamCredit,
      } = loadTs('lib/monetization/rewardedExam.ts');
      const { shouldShowAd } = loadTs('lib/monetization/ads.ts');
      const freeEntitlements = { adsDisabled: false, unlimitedMockExams: false };

      assert.equal(REWARDED_EXTRA_EXAM_PLACEMENT, 'rewarded_extra_exam');
      assert.equal(shouldShowAd('exam_screen', { adsDisabled: false }), false);
      assert.equal(
        shouldShowAd('home_banner', { adsDisabled: 'false' }, { adServingAllowed: true }, 'web'),
        true,
      );
      assert.equal(
        shouldShowAd('home_banner', { adsDisabled: 1 }, { adServingAllowed: true }, 'web'),
        true,
      );
      assert.equal(
        shouldShowAd('home_banner', { adsDisabled: true }, { adServingAllowed: true }, 'web'),
        false,
      );

      assert.deepEqual(
        getMockExamAccessDecision({
          completedMockExamsToday: 0,
          entitlements: freeEntitlements,
          freeMockExamLimit: 1,
        }),
        {
          canOfferRewardedAd: false,
          canStartExam: true,
          freeExamsRemaining: 1,
          placement: 'rewarded_extra_exam',
          reason: 'free_exam_available',
          rewardedExtraExamCredits: 0,
        },
      );

      assert.deepEqual(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          entitlements: freeEntitlements,
          freeMockExamLimit: 1,
        }),
        {
          canOfferRewardedAd: true,
          canStartExam: false,
          freeExamsRemaining: 0,
          placement: 'rewarded_extra_exam',
          reason: 'rewarded_ad_available',
          rewardedExtraExamCredits: 0,
        },
      );

      const grantedCredit = grantRewardedExtraExamCredit(0);
      assert.equal(grantedCredit, 1);
      assert.equal(consumeRewardedExtraExamCredit(grantedCredit), 0);
      assert.equal(consumeRewardedExtraExamCredit(0), 0);

      assert.deepEqual(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          entitlements: { adsDisabled: false, unlimitedMockExams: 'yes' },
          freeMockExamLimit: 1,
        }),
        {
          canOfferRewardedAd: true,
          canStartExam: false,
          freeExamsRemaining: 0,
          placement: 'rewarded_extra_exam',
          reason: 'rewarded_ad_available',
          rewardedExtraExamCredits: 0,
        },
      );
      assert.equal(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          entitlements: { adsDisabled: false, unlimitedMockExams: 1 },
          freeMockExamLimit: 1,
        }).reason,
        'rewarded_ad_available',
      );
      assert.equal(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          entitlements: { adsDisabled: 'yes', unlimitedMockExams: false },
          freeMockExamLimit: 1,
        }).reason,
        'rewarded_ad_available',
      );

      assert.deepEqual(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          entitlements: freeEntitlements,
          freeMockExamLimit: 1,
          rewardedExtraExamCredits: grantedCredit,
        }),
        {
          canOfferRewardedAd: false,
          canStartExam: true,
          freeExamsRemaining: 0,
          placement: 'rewarded_extra_exam',
          reason: 'rewarded_exam_credit',
          rewardedExtraExamCredits: 1,
        },
      );

      assert.equal(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          entitlements: { adsDisabled: true, unlimitedMockExams: false },
          freeMockExamLimit: 1,
        }).reason,
        'remove_ads_active',
      );
      assert.equal(
        getMockExamAccessDecision({
          completedMockExamsToday: 9,
          entitlements: { adsDisabled: true, unlimitedMockExams: true },
          freeMockExamLimit: 1,
        }).reason,
        'premium_unlimited_mock_exams',
      );
      assert.deepEqual(getMockExamAccessReadFailedDecision(), {
        canOfferRewardedAd: false,
        canStartExam: false,
        freeExamsRemaining: 0,
        placement: 'rewarded_extra_exam',
        reason: 'access_read_failed',
        rewardedExtraExamCredits: 0,
      });
    },
  );
});

test('mock exam access read failures fail closed until retry succeeds', () => {
  const accessHookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useMockExamAccess.ts'),
    'utf8',
  );
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.match(accessHookSource, /const \[accessReadFailed, setAccessReadFailed\]/);
  assert.match(accessHookSource, /getMockExamAccessReadFailedDecision\(\)/);
  assert.match(
    accessHookSource,
    /accessReadFailed && !isStrictEntitlementFlag\(entitlements\.unlimitedMockExams\)/,
  );
  assert.match(accessHookSource, /setAccessReadFailed\(true\);\s*setAccessReady\(true\);/);
  assert.match(accessHookSource, /setAccessReadFailed\(false\);\s*setAccessReady\(true\);/);
  assert.doesNotMatch(
    accessHookSource,
    /catch\(\(\) => \{\s*if \(isMounted\) setAccessReady\(true\);/,
  );
  assert.match(examSource, /access_read_failed/);
  assert.match(examSource, /retryAccess/);
  assert.match(examSource, /await refreshAccess\(\);/);
});

test('rewarded extra exam access honors real-ad consent readiness', () => {
  withEnv(
    {
      EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_EXTRA_EXAM_UNIT_ID: undefined,
      EXPO_PUBLIC_ADMOB_IOS_REWARDED_EXTRA_EXAM_UNIT_ID: undefined,
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: 'true',
    },
    () => {
      const { getMockExamAccessDecision } = loadTs(
        'lib/monetization/rewardedExam.ts',
        undefined,
        new Map(),
      );

      assert.equal(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          entitlements: { adsDisabled: false, unlimitedMockExams: false },
          freeMockExamLimit: 1,
        }).reason,
        'ads_unavailable',
      );
    },
  );

  withEnv(
    {
      EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_EXTRA_EXAM_UNIT_ID:
        'ca-app-pub-1234567890123456/3333333333',
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: 'true',
    },
    () => {
      const { getMockExamAccessDecision } = loadTs('lib/monetization/rewardedExam.ts');
      const freeEntitlements = { adsDisabled: false, unlimitedMockExams: false };

      assert.equal(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          entitlements: freeEntitlements,
          freeMockExamLimit: 1,
          platform: 'android',
        }).reason,
        'consent_required',
      );
      assert.equal(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          consentDecision: { adServingAllowed: true },
          entitlements: freeEntitlements,
          freeMockExamLimit: 1,
          platform: 'ios',
        }).reason,
        'ads_unavailable',
      );

      assert.deepEqual(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          consentDecision: { adServingAllowed: true },
          entitlements: freeEntitlements,
          freeMockExamLimit: 1,
          platform: 'android',
        }),
        {
          canOfferRewardedAd: true,
          canStartExam: false,
          freeExamsRemaining: 0,
          placement: 'rewarded_extra_exam',
          reason: 'rewarded_ad_available',
          rewardedExtraExamCredits: 0,
        },
      );
    },
  );
});

test('mock exam access persistence stores daily completions and rewarded credits', async () => {
  const rewardedExamSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/rewardedExam.ts'),
    'utf8',
  );
  const {
    FREE_MOCK_EXAM_DAILY_LIMIT,
    MOCK_EXAM_ACCESS_STORAGE_KEY,
    clearStoredMockExamAccess,
    consumeStoredRewardedExtraExamCredit,
    createMemoryMockExamAccessStorage,
    createSecureStoreMockExamAccessStorage,
    createWebMockExamAccessStorage,
    getMockExamAccessDateKey,
    getStoredMockExamAccess,
    grantStoredRewardedExtraExamCredit,
    recordStoredMockExamCompletion,
  } = loadTs('lib/monetization/rewardedExam.ts');
  const storage = createMemoryMockExamAccessStorage();

  assert.match(rewardedExamSource, /import \{ getLocalDateKey \} from '\.\.\/learning\/streaks';/);
  assert.doesNotMatch(rewardedExamSource, /function formatLocalDateKey/);
  assert.equal(FREE_MOCK_EXAM_DAILY_LIMIT, 1);
  assert.equal(MOCK_EXAM_ACCESS_STORAGE_KEY, 'monetization.mockExamAccess.v1');
  assert.equal(getMockExamAccessDateKey(new Date(2026, 4, 17, 0, 30)), '2026-05-17');
  assert.equal(getMockExamAccessDateKey('2026-05-17'), '2026-05-17');
  assert.equal(getMockExamAccessDateKey('2026-05-17T09:30:00.000Z'), '2026-05-17');

  const fallbackDateKey = getMockExamAccessDateKey();
  assert.equal(getMockExamAccessDateKey('2026-02-30'), fallbackDateKey);
  assert.equal(getMockExamAccessDateKey('2026-02-30T09:30:00.000Z'), fallbackDateKey);
  assert.equal(getMockExamAccessDateKey('2026-05-17garbage'), fallbackDateKey);
  assert.equal(getMockExamAccessDateKey('x2026-05-17'), fallbackDateKey);

  assert.deepEqual(await getStoredMockExamAccess({ date: '2026-05-17T09:30:00.000Z', storage }), {
    completedMockExamsByDate: {},
    completedMockExamSessionIdsByDate: {},
    completedMockExamsToday: 0,
    dateKey: '2026-05-17',
    rewardedExtraExamCredits: 0,
  });

  const firstCompletion = await recordStoredMockExamCompletion({
    date: '2026-05-17T10:00:00.000Z',
    sessionId: 'mock-exam-session-a',
    storage,
  });
  const duplicateCompletion = await recordStoredMockExamCompletion({
    date: '2026-05-17T10:05:00.000Z',
    sessionId: 'mock-exam-session-a',
    storage,
  });
  const todaySnapshot = await recordStoredMockExamCompletion({
    date: '2026-05-17T11:00:00.000Z',
    sessionId: 'mock-exam-session-b',
    storage,
  });

  assert.equal(firstCompletion.completedMockExamsToday, 1);
  assert.equal(duplicateCompletion.completedMockExamsToday, 1);
  assert.deepEqual(duplicateCompletion.completedMockExamsByDate, { '2026-05-17': 1 });
  assert.equal(todaySnapshot.completedMockExamsToday, 2);
  assert.equal(todaySnapshot.completedMockExamsByDate['2026-05-17'], 2);
  assert.deepEqual(todaySnapshot.completedMockExamSessionIdsByDate['2026-05-17'], [
    'mock-exam-session-a',
    'mock-exam-session-b',
  ]);

  const rolloverStorage = createMemoryMockExamAccessStorage();
  const rolloverSnapshot = await recordStoredMockExamCompletion({
    date: '2026-02-30',
    sessionId: 'rollover-session',
    storage: rolloverStorage,
  });

  assert.equal(rolloverSnapshot.dateKey, fallbackDateKey);
  assert.equal(rolloverSnapshot.completedMockExamsByDate['2026-02-30'], undefined);
  assert.equal(rolloverSnapshot.completedMockExamsByDate[fallbackDateKey], 1);
  assert.deepEqual(rolloverSnapshot.completedMockExamSessionIdsByDate[fallbackDateKey], [
    'rollover-session',
  ]);

  const tomorrowSnapshot = await getStoredMockExamAccess({
    date: '2026-05-18T08:00:00.000Z',
    storage,
  });

  assert.equal(tomorrowSnapshot.completedMockExamsToday, 0);
  assert.equal(tomorrowSnapshot.completedMockExamsByDate['2026-05-17'], 2);
  assert.deepEqual(tomorrowSnapshot.completedMockExamSessionIdsByDate['2026-05-17'], [
    'mock-exam-session-a',
    'mock-exam-session-b',
  ]);

  assert.equal(
    (
      await grantStoredRewardedExtraExamCredit({
        date: '2026-05-17T12:00:00.000Z',
        storage,
      })
    ).rewardedExtraExamCredits,
    1,
  );
  assert.equal(
    (
      await consumeStoredRewardedExtraExamCredit({
        date: '2026-05-17T12:05:00.000Z',
        storage,
      })
    ).rewardedExtraExamCredits,
    0,
  );
  assert.equal(
    (
      await consumeStoredRewardedExtraExamCredit({
        date: '2026-05-17T12:10:00.000Z',
        storage,
      })
    ).rewardedExtraExamCredits,
    0,
  );

  const seededStorage = createMemoryMockExamAccessStorage({
    completedMockExamsByDate: {
      '2026-05-17': 2.8,
      '2026-05-17garbage': 7,
      '2026-02-30': 8,
      'x2026-05-17': 9,
      ' 2026-05-17': 10,
      invalid: 9,
    },
    completedMockExamSessionIdsByDate: {
      '2026-05-17': [' mock-exam-session-c ', 'mock-exam-session-c', 'mock-exam-session-d'],
      '2026-05-17garbage': ['mock-exam-session-suffix'],
      '2026-02-30': ['mock-exam-session-rollover'],
      'x2026-05-17': ['mock-exam-session-prefix'],
      ' 2026-05-17': ['mock-exam-session-space'],
      invalid: ['mock-exam-session-z'],
    },
    rewardedExtraExamCredits: 1.9,
  });
  const seededSnapshot = await getStoredMockExamAccess({
    date: '2026-05-17T09:00:00.000Z',
    storage: seededStorage,
  });

  assert.deepEqual(seededSnapshot.completedMockExamsByDate, { '2026-05-17': 2 });
  assert.deepEqual(seededSnapshot.completedMockExamSessionIdsByDate, {
    '2026-05-17': ['mock-exam-session-c', 'mock-exam-session-d'],
  });
  assert.equal(seededSnapshot.rewardedExtraExamCredits, 1);

  const rawPersistedStorage = createMemoryMockExamAccessStorage();
  await rawPersistedStorage.setItemAsync(
    MOCK_EXAM_ACCESS_STORAGE_KEY,
    JSON.stringify({
      completedMockExamsByDate: {
        '2026-05-17': 1.2,
        '2026-05-17extra': 6,
        '2026-05-17T00:00:00.000Z': 7,
        '2026-02-30': 8,
      },
      completedMockExamSessionIdsByDate: {
        '2026-05-17': ['mock-exam-session-e', 'mock-exam-session-f'],
        '2026-05-17extra': ['mock-exam-session-suffix'],
        '2026-05-17T00:00:00.000Z': ['mock-exam-session-timestamp'],
        '2026-02-30': ['mock-exam-session-rollover'],
      },
      rewardedExtraExamCredits: 2.4,
    }),
  );
  const rawPersistedSnapshot = await getStoredMockExamAccess({
    date: '2026-05-17T09:00:00.000Z',
    storage: rawPersistedStorage,
  });

  assert.equal(rawPersistedSnapshot.completedMockExamsToday, 2);
  assert.deepEqual(rawPersistedSnapshot.completedMockExamsByDate, { '2026-05-17': 2 });
  assert.deepEqual(rawPersistedSnapshot.completedMockExamSessionIdsByDate, {
    '2026-05-17': ['mock-exam-session-e', 'mock-exam-session-f'],
  });
  assert.equal(rawPersistedSnapshot.rewardedExtraExamCredits, 2);

  const legacyCountOnlyStorage = createMemoryMockExamAccessStorage({
    completedMockExamsByDate: {
      '2026-05-19': 3,
    },
    rewardedExtraExamCredits: 0,
  });
  const legacyCountOnlySnapshot = await getStoredMockExamAccess({
    date: '2026-05-19T09:00:00.000Z',
    storage: legacyCountOnlyStorage,
  });

  assert.equal(legacyCountOnlySnapshot.completedMockExamsToday, 3);
  assert.deepEqual(legacyCountOnlySnapshot.completedMockExamSessionIdsByDate, {});
  await assert.rejects(
    () =>
      recordStoredMockExamCompletion({
        date: '2026-05-19T10:00:00.000Z',
        sessionId: ' ',
        storage: legacyCountOnlyStorage,
      }),
    /valid sessionId/,
  );

  assert.equal(typeof createSecureStoreMockExamAccessStorage().getItemAsync, 'function');

  await withGlobalProperties({ localStorage: createMemoryLocalStorage() }, async () => {
    const webStorage = createWebMockExamAccessStorage();

    await recordStoredMockExamCompletion({
      date: '2026-05-18T09:00:00.000Z',
      sessionId: 'web-session-1',
      storage: webStorage,
    });

    const webStorageAfterReload = createWebMockExamAccessStorage();

    assert.equal(
      (
        await getStoredMockExamAccess({
          date: '2026-05-18T10:00:00.000Z',
          storage: webStorageAfterReload,
        })
      ).completedMockExamsToday,
      1,
    );
  });

  assert.deepEqual(
    await clearStoredMockExamAccess({
      date: '2026-05-17T09:00:00.000Z',
      storage: seededStorage,
    }),
    {
      completedMockExamsByDate: {},
      completedMockExamSessionIdsByDate: {},
      completedMockExamsToday: 0,
      dateKey: '2026-05-17',
      rewardedExtraExamCredits: 0,
    },
  );
});

test('rewarded extra exam credit is granted only after an earned ad reward', async () => {
  const { showRewardedExtraExamAd } = loadTs('lib/monetization/rewardedAd.ts');
  const { showRewardedExtraExamAd: showUnavailableRewardedExtraExamAd } = withEnv(
    {
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: 'false',
      EXPO_PUBLIC_REAL_ADS_ENABLED: undefined,
    },
    () => loadTs('lib/monetization/rewardedAd.ts', undefined, new Map()),
  );
  const { showRewardedExtraExamAd: showRealWebRewardedExtraExamAd } = withEnv(
    {
      EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_EXTRA_EXAM_UNIT_ID:
        'ca-app-pub-3940256099942544/5224354917',
      EXPO_PUBLIC_ADMOB_IOS_REWARDED_EXTRA_EXAM_UNIT_ID: undefined,
      EXPO_PUBLIC_GOOGLE_ADS_ENABLED: undefined,
      EXPO_PUBLIC_REAL_ADS_ENABLED: 'true',
    },
    () => loadTs('lib/monetization/rewardedAd.ts', undefined, new Map()),
  );
  const defaultResult = await showRewardedExtraExamAd();
  const removeAdsResult = await showRewardedExtraExamAd({
    entitlements: { adsDisabled: true },
  });
  const disabledAdsResult = await showUnavailableRewardedExtraExamAd({
    entitlements: { adsDisabled: false },
  });
  const nativeRewardedAdSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/rewardedAd.native.ts'),
    'utf8',
  );
  const webRewardedAdSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/rewardedAd.ts'),
    'utf8',
  );
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  const confirmedResult = await showRewardedExtraExamAd({
    confirmReward: () => true,
  });
  const realWebConfirmedResult = await showRealWebRewardedExtraExamAd({
    confirmReward: () => true,
  });
  const realWebBlockedResult = await showRealWebRewardedExtraExamAd({
    confirmReward: () => true,
    webConsentDecision: { adServingAllowed: false },
  });

  assert.deepEqual(defaultResult, { status: 'closed_without_reward' });
  assert.equal(confirmedResult.status, 'earned_reward');
  assert.equal(realWebConfirmedResult.status, 'earned_reward');
  assert.deepEqual(realWebBlockedResult, { status: 'unavailable' });
  assert.deepEqual(removeAdsResult, { status: 'unavailable' });
  assert.deepEqual(disabledAdsResult, { status: 'unavailable' });
  assert.match(webRewardedAdSource, /WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.match(webRewardedAdSource, /webConsentDecision = WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.match(
    webRewardedAdSource,
    /shouldShowAd\(REWARDED_EXTRA_EXAM_PLACEMENT, entitlements, webConsentDecision, 'web'\)/,
  );
  assert.match(
    webRewardedAdSource,
    /rewardConfirmed = \(await confirmReward\?\.\(\)\) === true;[\s\S]*if \(!rewardConfirmed\) \{[\s\S]*return \{ status: 'closed_without_reward' \};/,
  );
  assert.match(nativeRewardedAdSource, /initializeGoogleMobileAdsAfterConsent/);
  assert.match(nativeRewardedAdSource, /createNativeMobileAdsConsentRuntime\(Platform\.OS\)/);
  assert.match(
    nativeRewardedAdSource,
    /const unitId = getPlatformAdUnitId\(REWARDED_EXTRA_EXAM_PLACEMENT, Platform\.OS\);[\s\S]*if \(!unitId\) return \{ status: 'unavailable' \};[\s\S]*try \{[\s\S]*initializeGoogleMobileAdsAfterConsent/,
  );
  assert.match(
    nativeRewardedAdSource,
    /initializeGoogleMobileAdsAfterConsent[\s\S]*\} catch \{[\s\S]*return \{ status: 'unavailable' \};[\s\S]*\}[\s\S]*if \(!consentInitialization\.initialized\) return \{ status: 'unavailable' \};/,
  );
  assert.match(nativeRewardedAdSource, /RewardedAd\.createForAdRequest/);
  assert.match(nativeRewardedAdSource, /RewardedAdEventType\.LOADED/);
  assert.match(nativeRewardedAdSource, /RewardedAdEventType\.EARNED_REWARD/);
  assert.match(nativeRewardedAdSource, /AdEventType\.CLOSED/);
  assert.match(nativeRewardedAdSource, /status: 'closed_without_reward'/);
  assert.match(nativeRewardedAdSource, /status: 'earned_reward'/);
  assert.match(
    nativeRewardedAdSource,
    /try \{[\s\S]*RewardedAd\.createForAdRequest[\s\S]*rewardedAd\.load\(\);[\s\S]*\} catch \{[\s\S]*status: hasShown \? 'show_failed' : 'failed_to_load'/,
  );
  assert.doesNotMatch(examSource, /showRewardedExtraExamAd|RewardedAd|rewardPreview/);
  assert.doesNotMatch(examSource, /WEB_AD_FALLBACK_CONSENT_DECISION|grantRewardedExamCredit/);
  assert.doesNotMatch(examSource, /Unlock extra exam|Lås upp extra prov/);
  assert.match(examSource, /Start unlocked mock exam/);
  assert.match(examSource, /Starta upplåst övningsprov/);
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
  const { REMOVE_ADS_ENTITLEMENTS, hasAdsDisabled, hasProEntitlement, isPremiumUser } = loadTs(
    'lib/monetization/premium.ts',
  );

  assert.equal(hasAdsDisabled(REMOVE_ADS_ENTITLEMENTS), true);
  assert.equal(hasAdsDisabled({ adsDisabled: 'yes' }), false);
  assert.equal(hasAdsDisabled({ adsDisabled: 1 }), false);
  assert.equal(isPremiumUser(REMOVE_ADS_ENTITLEMENTS), false);
  assert.equal(
    isPremiumUser({
      adsDisabled: false,
      fullMistakeReview: true,
      unlimitedMockExams: true,
    }),
    true,
  );
  assert.equal(
    isPremiumUser({
      adsDisabled: false,
      fullMistakeReview: 1,
      unlimitedMockExams: true,
    }),
    false,
  );
  assert.equal(
    hasProEntitlement({
      adsDisabled: false,
      confidenceSlider: false,
      customStudyPlan: false,
      fullMistakeReview: true,
      multiColorHighlights: false,
      nativeLangExplanations: false,
      notesExport: false,
      predictedPassProbability: false,
      spacedRepetition: true,
      unlimitedMockExams: 'yes',
    }),
    false,
  );
});

test('effective entitlement resolver normalizes malformed entitlement flags to strict booleans', () => {
  const { unionEntitlements } = loadTs('lib/monetization/premium.ts');
  const { resolveEffectiveEntitlement } = loadTs('lib/monetization/effectiveEntitlements.ts');
  const freeEntitlements = {
    adsDisabled: false,
    unlimitedMockExams: false,
    fullMistakeReview: false,
    spacedRepetition: false,
    nativeLangExplanations: false,
    customStudyPlan: false,
    notesExport: false,
    predictedPassProbability: false,
    confidenceSlider: false,
    multiColorHighlights: false,
  };
  const now = new Date('2026-05-19T12:00:00.000Z');

  assert.deepEqual(
    unionEntitlements(freeEntitlements, {
      adsDisabled: 1,
      unlimitedMockExams: 'yes',
      fullMistakeReview: {},
      spacedRepetition: 'true',
      nativeLangExplanations: [],
      customStudyPlan: null,
      notesExport: undefined,
      predictedPassProbability: Number.POSITIVE_INFINITY,
      confidenceSlider: 'false',
      multiColorHighlights: new Boolean(true),
    }),
    freeEntitlements,
  );

  const malformedRemoveAds = resolveEffectiveEntitlement({
    removeAds: {
      adsDisabled: 'yes',
      unlimitedMockExams: true,
      fullMistakeReview: true,
    },
    now,
  });
  assert.equal(malformedRemoveAds.primarySource, 'free');
  assert.deepEqual(malformedRemoveAds.entitlements, freeEntitlements);

  const validRemoveAdsWithMalformedExtras = resolveEffectiveEntitlement({
    removeAds: {
      adsDisabled: true,
      unlimitedMockExams: 'yes',
      fullMistakeReview: 1,
    },
    now,
  });
  assert.equal(validRemoveAdsWithMalformedExtras.primarySource, 'remove-ads');
  assert.equal(validRemoveAdsWithMalformedExtras.entitlements.adsDisabled, true);
  assert.equal(validRemoveAdsWithMalformedExtras.entitlements.unlimitedMockExams, false);
  assert.equal(validRemoveAdsWithMalformedExtras.entitlements.fullMistakeReview, false);

  const malformedProLifetime = resolveEffectiveEntitlement({
    proLifetime: {
      adsDisabled: 'yes',
      unlimitedMockExams: 'yes',
      fullMistakeReview: 1,
      spacedRepetition: true,
      nativeLangExplanations: 'yes',
      customStudyPlan: true,
      notesExport: {},
      predictedPassProbability: [],
      confidenceSlider: false,
      multiColorHighlights: Number.POSITIVE_INFINITY,
    },
    now,
  });
  assert.equal(malformedProLifetime.primarySource, 'pro-lifetime');
  assert.equal(malformedProLifetime.entitlements.adsDisabled, false);
  assert.equal(malformedProLifetime.entitlements.unlimitedMockExams, false);
  assert.equal(malformedProLifetime.entitlements.fullMistakeReview, false);
  assert.equal(malformedProLifetime.entitlements.spacedRepetition, true);
  assert.equal(malformedProLifetime.entitlements.customStudyPlan, true);
  Object.values(malformedProLifetime.entitlements).forEach((value) =>
    assert.equal(typeof value, 'boolean'),
  );
});

test('remove-ads IAP wrapper buys, restores, and persists adsDisabled', async () => {
  const purchaseExports = loadTs('lib/monetization/purchases.ts');
  const {
    REMOVE_ADS_PRICE_LABEL,
    REMOVE_ADS_ANDROID_PRODUCT_ID,
    REMOVE_ADS_IOS_PRODUCT_ID,
    REMOVE_ADS_RECORD_SCHEMA_VERSION,
    REMOVE_ADS_PRODUCT_ID,
    REMOVE_ADS_STORE_PRODUCT_IDS,
    REMOVE_ADS_STORAGE_KEY,
    buyRemoveAds,
    createMemoryPurchaseStorage,
    createMockPurchaseProvider,
    createWebPurchaseStorage,
    getPurchaseEntitlements,
    restoreRemoveAdsPurchase,
  } = purchaseExports;
  const purchasesSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/purchases.ts'),
    'utf8',
  );
  const removedVerifierExportName = ['REMOVE_ADS', 'VERIFIER', 'TOKEN'].join('_');

  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const appConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8')).expo;
  const expectedIosProductId = `${appConfig.ios.bundleIdentifier}.removeads`;
  assert.equal(packageJson.dependencies['expo-secure-store'], '~15.0.8');
  assert.equal(packageJson.dependencies['react-native-iap'], '^15.3.0');
  assert.equal(appConfig.ios.bundleIdentifier, 'com.billyyiu.almostswedish');
  assert.equal(REMOVE_ADS_PRODUCT_ID, expectedIosProductId);
  assert.equal(REMOVE_ADS_IOS_PRODUCT_ID, expectedIosProductId);
  assert.equal(REMOVE_ADS_ANDROID_PRODUCT_ID, 'removeads');
  assert.deepEqual(REMOVE_ADS_STORE_PRODUCT_IDS, {
    android: 'removeads',
    ios: expectedIosProductId,
  });
  assert.match(REMOVE_ADS_PRODUCT_ID, /removeads$/);
  assert.equal(REMOVE_ADS_PRICE_LABEL, '29 SEK');
  assert.equal(REMOVE_ADS_RECORD_SCHEMA_VERSION, 1);
  assert.equal(Object.hasOwn(purchaseExports, removedVerifierExportName), false);
  assert.doesNotMatch(purchasesSource, new RegExp(['remove', '\\.\\?', 'ads'].join(''), 'i'));
  assert.match(purchasesSource, /validateRemoveAdsReceipt/);
  assert.match(purchasesSource, /receiptValidationStatus: 'valid'/);
  assert.match(purchasesSource, /receiptValidatedAt/);

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
  const storedPurchaseRecord = JSON.parse(await storage.getItemAsync(REMOVE_ADS_STORAGE_KEY));
  assert.deepEqual(
    {
      productId: storedPurchaseRecord.productId,
      purchaseToken: storedPurchaseRecord.purchaseToken,
      receiptValidationStatus: storedPurchaseRecord.receiptValidationStatus,
      schemaVersion: storedPurchaseRecord.schemaVersion,
      source: storedPurchaseRecord.source,
      transactionId: storedPurchaseRecord.transactionId,
    },
    {
      productId: REMOVE_ADS_PRODUCT_ID,
      purchaseToken: 'mock-token-buy-remove-ads',
      receiptValidationStatus: 'valid',
      schemaVersion: REMOVE_ADS_RECORD_SCHEMA_VERSION,
      source: 'purchase',
      transactionId: 'buy-remove-ads',
    },
  );
  assert.match(storedPurchaseRecord.grantedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(storedPurchaseRecord.receiptValidatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(Object.hasOwn(storedPurchaseRecord, 'raw'), false);
  assert.equal(
    (
      await getPurchaseEntitlements({
        provider: createMockPurchaseProvider({ owned: true }),
        storage,
      })
    ).adsDisabled,
    true,
  );

  const restoredStorage = createMemoryPurchaseStorage();
  const restoreResult = await restoreRemoveAdsPurchase({
    provider: createMockPurchaseProvider({ owned: true }),
    storage: restoredStorage,
  });

  assert.equal(restoreResult.status, 'restored');
  assert.equal(restoreResult.entitlements.adsDisabled, true);
  assert.equal(
    (
      await getPurchaseEntitlements({
        provider: createMockPurchaseProvider({ owned: true }),
        storage: restoredStorage,
      })
    ).adsDisabled,
    true,
  );
  const storedRestoreRecord = JSON.parse(
    await restoredStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY),
  );
  assert.equal(storedRestoreRecord.source, 'restore');
  assert.equal(storedRestoreRecord.transactionId, 'restore-remove-ads');
  assert.equal(storedRestoreRecord.purchaseToken, 'mock-token-restore-remove-ads');
  assert.equal(storedRestoreRecord.receiptValidationStatus, 'valid');
  assert.match(storedRestoreRecord.receiptValidatedAt, /^\d{4}-\d{2}-\d{2}T/);

  const missingRestore = await restoreRemoveAdsPurchase({
    provider: createMockPurchaseProvider(),
    storage: createMemoryPurchaseStorage(),
  });
  assert.equal(missingRestore.status, 'not_found');
  assert.equal(missingRestore.entitlements.adsDisabled, false);

  const localStorage = createMemoryLocalStorage();
  await withGlobalProperties({ localStorage }, async () => {
    const webProvider = createMockPurchaseProvider();
    const webStorage = createWebPurchaseStorage();
    await buyRemoveAds({
      provider: webProvider,
      storage: webStorage,
    });

    const webStorageAfterReload = createWebPurchaseStorage();
    assert.equal(
      (await getPurchaseEntitlements({ provider: webProvider, storage: webStorageAfterReload }))
        .adsDisabled,
      true,
    );

    await purchaseExports.setRemoveAdsEntitlement(false, { storage: webStorageAfterReload });
    assert.equal(localStorage.getItem(REMOVE_ADS_STORAGE_KEY), null);
  });
});

test('remove-ads buy persists before native finish and leaves failed persistence unfinished', async () => {
  const { REMOVE_ADS_PRODUCT_ID, REMOVE_ADS_STORAGE_KEY, buyRemoveAds } = loadTs(
    'lib/monetization/purchases.ts',
  );
  const purchase = {
    productId: REMOVE_ADS_PRODUCT_ID,
    purchaseToken: 'mock-token-ordering-remove-ads',
    transactionId: 'ordering-remove-ads',
  };

  function createProvider(events) {
    return {
      async connect() {
        events.push('connect');
      },
      async disconnect() {
        events.push('disconnect');
      },
      async finishPurchase() {
        events.push('finish');
      },
      async requestRemoveAdsPurchase() {
        events.push('request');
        return purchase;
      },
      async restorePurchases() {
        return [];
      },
      async validateRemoveAdsReceipt() {
        events.push('validate');
        return {
          productId: REMOVE_ADS_PRODUCT_ID,
          purchaseToken: purchase.purchaseToken,
          status: 'valid',
          transactionId: purchase.transactionId,
          validatedAt: '2026-05-20T12:00:00.000Z',
        };
      },
    };
  }

  const successfulEvents = [];
  const successfulValues = new Map();
  const successfulResult = await buyRemoveAds({
    provider: createProvider(successfulEvents),
    storage: {
      async getItemAsync(key) {
        return successfulValues.get(key) ?? null;
      },
      async setItemAsync(key, value) {
        successfulEvents.push('persist');
        successfulValues.set(key, value);
      },
    },
  });

  assert.equal(successfulResult.status, 'purchased');
  assert.equal(successfulResult.entitlements.adsDisabled, true);
  assert.deepEqual(successfulEvents, [
    'connect',
    'request',
    'validate',
    'persist',
    'finish',
    'disconnect',
  ]);
  assert.equal(
    JSON.parse(successfulValues.get(REMOVE_ADS_STORAGE_KEY)).transactionId,
    'ordering-remove-ads',
  );

  const failingEvents = [];
  const failingResult = await buyRemoveAds({
    provider: createProvider(failingEvents),
    storage: {
      async deleteItemAsync() {
        failingEvents.push('cleanup');
      },
      async getItemAsync() {
        return null;
      },
      async setItemAsync() {
        failingEvents.push('persist-fail');
        throw new Error('storage unavailable');
      },
    },
  });

  assert.equal(failingResult.status, 'persistence_failed');
  assert.equal(failingResult.entitlements.adsDisabled, false);
  assert.deepEqual(failingEvents, [
    'connect',
    'request',
    'validate',
    'persist-fail',
    'cleanup',
    'disconnect',
  ]);
  assert.equal(failingEvents.includes('finish'), false);
});

test('native Remove Ads purchases require an injected receipt verifier', async () => {
  const {
    REMOVE_ADS_PRODUCT_ID,
    REMOVE_ADS_STORAGE_KEY,
    buyRemoveAds,
    createMemoryPurchaseStorage,
    createNativePurchaseProvider,
    restoreRemoveAdsPurchase,
  } = loadTs('lib/monetization/purchases.ts');
  const nativePurchase = {
    ids: [REMOVE_ADS_PRODUCT_ID],
    productId: REMOVE_ADS_PRODUCT_ID,
    purchaseToken: 'tok-native-remove-ads',
    transactionId: 'tx-native-remove-ads',
  };

  const unverifiedPurchaseFixture = makeNativeIapProductFixture({
    availablePurchases: [nativePurchase],
  });
  const unverifiedPurchaseStorage = createMemoryPurchaseStorage();
  const unverifiedPurchase = await buyRemoveAds({
    provider: createNativePurchaseProvider({
      loadIap: async () => unverifiedPurchaseFixture.iap,
      purchaseTimeoutMs: 10,
    }),
    storage: unverifiedPurchaseStorage,
  });

  assert.equal(unverifiedPurchase.status, 'pending');
  assert.equal(unverifiedPurchase.entitlements.adsDisabled, false);
  assert.equal(await unverifiedPurchaseStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  const unverifiedRestoreFixture = makeNativeIapProductFixture({
    availablePurchases: [nativePurchase],
  });
  const unverifiedRestoreStorage = createMemoryPurchaseStorage();
  const unverifiedRestore = await restoreRemoveAdsPurchase({
    provider: createNativePurchaseProvider({
      loadIap: async () => unverifiedRestoreFixture.iap,
      purchaseTimeoutMs: 10,
    }),
    storage: unverifiedRestoreStorage,
  });

  assert.equal(unverifiedRestore.status, 'not_found');
  assert.equal(unverifiedRestore.entitlements.adsDisabled, false);
  assert.equal(await unverifiedRestoreStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);
  assert.equal(unverifiedRestoreFixture.state.restored, true);

  const verifiedFixture = makeNativeIapProductFixture({
    availablePurchases: [nativePurchase],
  });
  const verifiedStorage = createMemoryPurchaseStorage();
  const verifiedPurchase = await buyRemoveAds({
    provider: createNativePurchaseProvider({
      loadIap: async () => verifiedFixture.iap,
      purchaseTimeoutMs: 10,
      async receiptValidator(purchase, productId) {
        return {
          productId,
          purchaseToken: purchase.purchaseToken ?? null,
          status: 'valid',
          transactionId: purchase.transactionId ?? null,
          validatedAt: '2026-05-20T12:00:00.000Z',
        };
      },
    }),
    storage: verifiedStorage,
  });

  assert.equal(verifiedPurchase.status, 'purchased');
  assert.equal(verifiedPurchase.entitlements.adsDisabled, true);
  assert.equal(
    JSON.parse(await verifiedStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY)).transactionId,
    `tx-${REMOVE_ADS_PRODUCT_ID}`,
  );
});

test('native purchase provider matches requested product ids instead of Remove Ads only', async () => {
  const { REMOVE_ADS_PRODUCT_ID, createNativePurchaseProvider } = loadTs(
    'lib/monetization/purchases.ts',
  );
  const { PRO_LIFETIME_PRODUCT_ID } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const purchasesSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/purchases.ts'),
    'utf8',
  );
  const { iap, state } = makeNativeIapProductFixture({
    availablePurchases: [
      {
        ids: [REMOVE_ADS_PRODUCT_ID],
        productId: REMOVE_ADS_PRODUCT_ID,
        purchaseToken: 'tok-remove-ads',
        transactionId: 'tx-remove-ads',
      },
      {
        ids: [PRO_LIFETIME_PRODUCT_ID],
        productId: 'store-wrapper',
        purchaseToken: 'tok-pro-lifetime',
        transactionId: 'tx-pro-lifetime',
      },
    ],
  });
  const provider = createNativePurchaseProvider({
    loadIap: async () => iap,
    purchaseTimeoutMs: 10,
  });

  const purchase = await provider.requestRemoveAdsPurchase(PRO_LIFETIME_PRODUCT_ID);
  const restored = await provider.restorePurchases([PRO_LIFETIME_PRODUCT_ID]);

  assert.equal(purchase.productId, PRO_LIFETIME_PRODUCT_ID);
  assert.equal(purchase.purchaseToken, `tok-${PRO_LIFETIME_PRODUCT_ID}`);
  assert.deepEqual(
    restored.map((item) => item.purchaseToken),
    ['tok-pro-lifetime'],
  );
  assert.equal(state.restored, true);
  assert.deepEqual(state.requestedProductIds, [PRO_LIFETIME_PRODUCT_ID]);
  assert.match(purchasesSource, /function isPurchaseForProduct/);
  assert.match(purchasesSource, /const storeProductId = getPurchaseStoreProductId/);
  assert.match(
    purchasesSource,
    /requestRemoveAdsPurchase\(productId\)[\s\S]*isPurchaseForProduct\(\s*candidate,\s*productId,\s*storeProductId\s*\)/,
  );
  assert.match(
    purchasesSource,
    /restorePurchases\(productIds\)[\s\S]*productIds\.some\(\(productId\) =>[\s\S]*isPurchaseForProduct\(\s*purchase,\s*productId,\s*getPurchaseStoreProductId\(productId, storePlatform\),\s*\)/,
  );
});

test('Pro Lifetime entitlement storage and receipts require canonical UTC timestamps', async () => {
  const { createMemoryPurchaseStorage } = loadTs('lib/monetization/purchases.ts');
  const {
    PRO_LIFETIME_PRODUCT_ID,
    PRO_LIFETIME_STORAGE_KEY,
    buyProLifetime,
    getProLifetimeEntitlement,
  } = loadTs('lib/monetization/proLifetimePurchase.ts');
  const canonicalTimestamp = '2026-05-20T12:34:56.789Z';
  const storage = createMemoryPurchaseStorage();

  for (const { grantedAt, label, receiptValidatedAt } of [
    {
      grantedAt: '2026-05-20',
      label: 'date-only grantedAt',
      receiptValidatedAt: canonicalTimestamp,
    },
    {
      grantedAt: '2026-02-30T00:00:00.000Z',
      label: 'rollover grantedAt',
      receiptValidatedAt: canonicalTimestamp,
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'blank receiptValidatedAt',
      receiptValidatedAt: '',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'date-only receiptValidatedAt',
      receiptValidatedAt: '2026-05-20',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'timezone-offset receiptValidatedAt',
      receiptValidatedAt: '2026-05-20T12:34:56.789+00:00',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'rollover receiptValidatedAt',
      receiptValidatedAt: '2026-02-30T00:00:00.000Z',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'missing-milliseconds receiptValidatedAt',
      receiptValidatedAt: '2026-05-20T12:34:56Z',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'malformed receiptValidatedAt',
      receiptValidatedAt: 'not-a-date',
    },
  ]) {
    await storage.setItemAsync(
      PRO_LIFETIME_STORAGE_KEY,
      JSON.stringify({
        grantedAt,
        productId: PRO_LIFETIME_PRODUCT_ID,
        purchaseToken: 'tok-pro-lifetime',
        receiptValidatedAt,
        receiptValidationStatus: 'valid',
        schemaVersion: 1,
        source: 'purchase',
        transactionId: 'tx-pro-lifetime',
      }),
    );
    assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, false, label);
  }

  await storage.setItemAsync(
    PRO_LIFETIME_STORAGE_KEY,
    JSON.stringify({
      grantedAt: canonicalTimestamp,
      productId: PRO_LIFETIME_PRODUCT_ID,
      purchaseToken: 'tok-pro-lifetime',
      receiptValidatedAt: canonicalTimestamp,
      receiptValidationStatus: 'valid',
      schemaVersion: 1,
      source: 'purchase',
      transactionId: 'tx-pro-lifetime',
    }),
  );
  const validPersistedRecord = await storage.getItemAsync(PRO_LIFETIME_STORAGE_KEY);
  assert.equal((await getProLifetimeEntitlement({ storage })).spacedRepetition, true);
  assert.equal(await storage.getItemAsync(PRO_LIFETIME_STORAGE_KEY), validPersistedRecord);

  for (const [label, validatedAt] of [
    ['blank validator timestamp', ''],
    ['date-only validator timestamp', '2026-05-20'],
    ['timezone-offset validator timestamp', '2026-05-20T12:34:56.789+00:00'],
    ['rollover validator timestamp', '2026-02-30T00:00:00.000Z'],
    ['missing-milliseconds validator timestamp', '2026-05-20T12:34:56Z'],
    ['malformed validator timestamp', 'not-a-date'],
  ]) {
    const invalidTimestampStorage = createMemoryPurchaseStorage();
    const provider = {
      async connect() {},
      async disconnect() {},
      async finishPurchase() {},
      async requestRemoveAdsPurchase(productId) {
        return {
          productId,
          purchaseToken: 'tok-pro-lifetime',
          transactionId: 'tx-pro-lifetime',
        };
      },
      async restorePurchases() {
        return [];
      },
      async validateRemoveAdsReceipt(purchase, productId) {
        return {
          productId,
          purchaseToken: purchase.purchaseToken ?? null,
          status: 'valid',
          transactionId: purchase.transactionId ?? null,
          validatedAt,
        };
      },
    };
    const result = await buyProLifetime({ provider, storage: invalidTimestampStorage });

    assert.equal(result.status, 'pending', label);
    assert.equal(result.entitlements.spacedRepetition, false, label);
    assert.equal(await invalidTimestampStorage.getItemAsync(PRO_LIFETIME_STORAGE_KEY), null, label);
  }
});

test('remove-ads entitlement storage rejects stale boolean and malformed records', async () => {
  const {
    REMOVE_ADS_PRODUCT_ID,
    REMOVE_ADS_STORAGE_KEY,
    createMemoryPurchaseStorage,
    getPurchaseEntitlements,
  } = loadTs('lib/monetization/purchases.ts');

  const storage = createMemoryPurchaseStorage();
  const canonicalTimestamp = '2026-05-20T12:34:56.789Z';

  await storage.setItemAsync(REMOVE_ADS_STORAGE_KEY, 'true');
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, false);

  await storage.setItemAsync(REMOVE_ADS_STORAGE_KEY, '{not-json');
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, false);

  await storage.setItemAsync(
    REMOVE_ADS_STORAGE_KEY,
    JSON.stringify({
      grantedAt: canonicalTimestamp,
      productId: REMOVE_ADS_PRODUCT_ID,
      purchaseToken: 'mock-token-buy-remove-ads',
      receiptValidationStatus: 'valid',
      schemaVersion: 1,
      source: 'purchase',
      transactionId: 'buy-remove-ads',
    }),
  );
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, false);

  await storage.setItemAsync(
    REMOVE_ADS_STORAGE_KEY,
    JSON.stringify({
      grantedAt: 'not-a-date',
      productId: REMOVE_ADS_PRODUCT_ID,
      receiptValidatedAt: canonicalTimestamp,
      receiptValidationStatus: 'valid',
      schemaVersion: 1,
      source: 'restore',
      transactionId: 'restore-remove-ads',
    }),
  );
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, false);

  for (const { grantedAt, label, receiptValidatedAt } of [
    {
      grantedAt: '2026-05-20',
      label: 'date-only grantedAt',
      receiptValidatedAt: canonicalTimestamp,
    },
    {
      grantedAt: '2026-02-30T00:00:00.000Z',
      label: 'rollover grantedAt',
      receiptValidatedAt: canonicalTimestamp,
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'date-only receiptValidatedAt',
      receiptValidatedAt: '2026-05-20',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'timezone-offset receiptValidatedAt',
      receiptValidatedAt: '2026-05-20T12:34:56.789+00:00',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'rollover receiptValidatedAt',
      receiptValidatedAt: '2026-02-30T00:00:00.000Z',
    },
    {
      grantedAt: canonicalTimestamp,
      label: 'missing-milliseconds receiptValidatedAt',
      receiptValidatedAt: '2026-05-20T12:34:56Z',
    },
  ]) {
    await storage.setItemAsync(
      REMOVE_ADS_STORAGE_KEY,
      JSON.stringify({
        grantedAt,
        productId: REMOVE_ADS_PRODUCT_ID,
        purchaseToken: 'mock-token-buy-remove-ads',
        receiptValidatedAt,
        receiptValidationStatus: 'valid',
        schemaVersion: 1,
        source: 'purchase',
        transactionId: 'buy-remove-ads',
      }),
    );
    assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, false, label);
  }

  await storage.setItemAsync(
    REMOVE_ADS_STORAGE_KEY,
    JSON.stringify({
      grantedAt: canonicalTimestamp,
      productId: REMOVE_ADS_PRODUCT_ID,
      purchaseToken: 'mock-token-buy-remove-ads',
      receiptValidatedAt: canonicalTimestamp,
      receiptValidationStatus: 'valid',
      schemaVersion: 1,
      source: 'purchase',
      transactionId: 'buy-remove-ads',
    }),
  );
  const validPersistedRecord = await storage.getItemAsync(REMOVE_ADS_STORAGE_KEY);
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, true);
  assert.equal(await storage.getItemAsync(REMOVE_ADS_STORAGE_KEY), validPersistedRecord);
});

test('pending remove-ads purchase does not grant adsDisabled until store confirmation', async () => {
  const {
    REMOVE_ADS_PRODUCT_ID,
    REMOVE_ADS_STORAGE_KEY,
    buyRemoveAds,
    createMemoryPurchaseStorage,
    createMockPurchaseProvider,
  } = loadTs('lib/monetization/purchases.ts');
  const storage = createMemoryPurchaseStorage();

  const result = await buyRemoveAds({
    provider: createMockPurchaseProvider({ pendingPurchase: true }),
    storage,
  });

  assert.equal(result.status, 'pending');
  assert.equal(result.entitlements.adsDisabled, false);
  assert.equal(await storage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);
});

test('failed remove-ads receipt validation does not grant adsDisabled', async () => {
  const {
    REMOVE_ADS_PRODUCT_ID,
    REMOVE_ADS_RECORD_SCHEMA_VERSION,
    REMOVE_ADS_STORAGE_KEY,
    buyRemoveAds,
    createMemoryPurchaseStorage,
    createMockPurchaseProvider,
    restoreRemoveAdsPurchase,
    setRemoveAdsEntitlement,
  } = loadTs('lib/monetization/purchases.ts');

  function storedFakeRecord() {
    return JSON.stringify({
      grantedAt: '2026-05-20T12:00:00.000Z',
      productId: REMOVE_ADS_PRODUCT_ID,
      purchaseToken: 'fake-token',
      receiptValidatedAt: '2026-05-20T12:00:00.000Z',
      receiptValidationStatus: 'valid',
      schemaVersion: REMOVE_ADS_RECORD_SCHEMA_VERSION,
      source: 'purchase',
      transactionId: 'fake-tx',
    });
  }

  const failedPurchaseStorage = createMemoryPurchaseStorage();
  const failedPurchase = await buyRemoveAds({
    provider: createMockPurchaseProvider({ receiptValidationStatus: 'invalid' }),
    storage: failedPurchaseStorage,
  });

  assert.equal(failedPurchase.status, 'pending');
  assert.equal(failedPurchase.entitlements.adsDisabled, false);
  assert.equal(await failedPurchaseStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  const failedStoredPurchaseStorage = createMemoryPurchaseStorage();
  await failedStoredPurchaseStorage.setItemAsync(REMOVE_ADS_STORAGE_KEY, storedFakeRecord());
  const failedStoredPurchase = await buyRemoveAds({
    provider: createMockPurchaseProvider({ receiptValidationStatus: 'invalid' }),
    storage: failedStoredPurchaseStorage,
  });

  assert.equal(failedStoredPurchase.status, 'pending');
  assert.equal(failedStoredPurchase.entitlements.adsDisabled, false);
  assert.equal(await failedStoredPurchaseStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  const pendingPurchaseStorage = createMemoryPurchaseStorage();
  const pendingPurchase = await buyRemoveAds({
    provider: createMockPurchaseProvider({ receiptValidationStatus: 'pending' }),
    storage: pendingPurchaseStorage,
  });

  assert.equal(pendingPurchase.status, 'pending');
  assert.equal(pendingPurchase.entitlements.adsDisabled, false);
  assert.equal(await pendingPurchaseStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  const malformedValidationStorage = createMemoryPurchaseStorage();
  const malformedValidationProvider = {
    ...createMockPurchaseProvider(),
    async validateRemoveAdsReceipt() {
      return {
        productId: REMOVE_ADS_PRODUCT_ID,
        status: 'valid',
        validatedAt: new Date().toISOString(),
      };
    },
  };
  const malformedValidationPurchase = await buyRemoveAds({
    provider: malformedValidationProvider,
    storage: malformedValidationStorage,
  });

  assert.equal(malformedValidationPurchase.status, 'pending');
  assert.equal(malformedValidationPurchase.entitlements.adsDisabled, false);
  assert.equal(await malformedValidationStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  for (const [label, validatedAt] of [
    ['date-only validator timestamp', '2026-05-20'],
    ['timezone-offset validator timestamp', '2026-05-20T12:34:56.789+00:00'],
    ['rollover validator timestamp', '2026-02-30T00:00:00.000Z'],
  ]) {
    const invalidTimestampStorage = createMemoryPurchaseStorage();
    const invalidTimestampProvider = {
      ...createMockPurchaseProvider(),
      async validateRemoveAdsReceipt(purchase) {
        return {
          productId: REMOVE_ADS_PRODUCT_ID,
          purchaseToken: purchase.purchaseToken ?? null,
          status: 'valid',
          transactionId: purchase.transactionId ?? null,
          validatedAt,
        };
      },
    };
    const invalidTimestampPurchase = await buyRemoveAds({
      provider: invalidTimestampProvider,
      storage: invalidTimestampStorage,
    });

    assert.equal(invalidTimestampPurchase.status, 'pending', label);
    assert.equal(invalidTimestampPurchase.entitlements.adsDisabled, false, label);
    assert.equal(await invalidTimestampStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null, label);
  }

  const failedRestoreStorage = createMemoryPurchaseStorage();
  const failedRestore = await restoreRemoveAdsPurchase({
    provider: createMockPurchaseProvider({ owned: true, receiptValidationStatus: 'invalid' }),
    storage: failedRestoreStorage,
  });

  assert.equal(failedRestore.status, 'not_found');
  assert.equal(failedRestore.entitlements.adsDisabled, false);
  assert.equal(await failedRestoreStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  const failedStoredRestoreStorage = createMemoryPurchaseStorage();
  await failedStoredRestoreStorage.setItemAsync(REMOVE_ADS_STORAGE_KEY, storedFakeRecord());
  const failedStoredRestore = await restoreRemoveAdsPurchase({
    provider: createMockPurchaseProvider({ owned: true, receiptValidationStatus: 'invalid' }),
    storage: failedStoredRestoreStorage,
  });

  assert.equal(failedStoredRestore.status, 'not_found');
  assert.equal(failedStoredRestore.entitlements.adsDisabled, false);
  assert.equal(await failedStoredRestoreStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  const directGrantStorage = createMemoryPurchaseStorage();
  const directGrant = await setRemoveAdsEntitlement(true, { storage: directGrantStorage });

  assert.equal(directGrant.adsDisabled, false);
  assert.equal(await directGrantStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);
});

test('remove-ads paywall is surfaced near an ad placement and wired to purchase helpers', () => {
  const paywallSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PremiumBanner.tsx'),
    'utf8',
  );
  const placementCtaSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/RemoveAdsPlacementCta.tsx'),
    'utf8',
  );
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const profileSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');

  assert.match(paywallSource, /REMOVE_ADS_PRICE_LABEL/);
  assert.match(paywallSource, /buyRemoveAds/);
  assert.match(paywallSource, /restoreRemoveAdsPurchase/);
  assert.match(paywallSource, /createDefaultPurchaseRuntimeOptions/);
  assert.match(paywallSource, /setCurrentEntitlements/);
  assert.match(paywallSource, /setCurrentEntitlements\(entitlements\)/);
  assert.match(paywallSource, /onEntitlementsChange/);
  assert.match(paywallSource, /adsDisabled/);
  assert.match(paywallSource, /purchaseUnavailableReason === 'web_store_unavailable'/);
  assert.match(paywallSource, /copy\.webUnavailableBody\(REMOVE_ADS_PRICE_LABEL\)/);
  assert.match(paywallSource, /copy\.webUnavailableAccessibilityHint/);
  assert.match(paywallSource, /Buy in mobile app/);
  assert.match(paywallSource, /Köp i mobilappen/);
  assert.match(paywallSource, /Restore in mobile app/);
  assert.match(paywallSource, /Återställ i mobilappen/);
  assert.match(paywallSource, /web version shows status only/);
  assert.match(paywallSource, /Webbversionen visar bara status/);
  assert.match(paywallSource, /Buy Remove Ads for \$\{price\}/);
  assert.match(paywallSource, /Köp Ta bort annonser för \$\{price\}/);
  assert.match(
    paywallSource,
    /purchaseUnavailable \? copy\.webUnavailableAccessibilityHint : copy\.buyAccessibilityHint/,
  );
  assert.match(paywallSource, /Purchase removes ads after store confirmation/);
  assert.match(paywallSource, /tidsatta övningsprov i appen redan är annonsfria/);
  assert.match(paywallSource, /Tidsatta övningsprov i appen är redan annonsfria/);
  assert.match(paywallSource, /Restore Remove Ads purchase/);
  assert.match(paywallSource, /Återställ köp av Ta bort annonser/);
  assert.match(
    paywallSource,
    /purchaseUnavailable[\s\S]*\? copy\.webUnavailableAccessibilityHint[\s\S]*: copy\.restoreAccessibilityHint/,
  );
  assert.match(paywallSource, /same store account/);
  assert.match(paywallSource, /samma butikskonto/);
  assert.doesNotMatch(paywallSource, /ads are deferred|RevenueCat can be added/i);
  assert.match(homeSource, /import \{ PremiumBanner \}/);
  assert.match(
    homeSource,
    /const showRemoveAdsOffer = entitlementsReady && monetizationEntitlements\.adsDisabled !== true;/,
  );
  assert.match(homeSource, /\{showRemoveAdsOffer \? \([\s\S]*<PricingWedge/);
  assert.match(
    homeSource,
    /\{entitlementsReady \? \([\s\S]*<PremiumBanner[\s\S]*entitlements=\{monetizationEntitlements\}[\s\S]*onEntitlementsChange=\{setMonetizationEntitlements\}[\s\S]*runtimeOptions=\{purchaseRuntime\}[\s\S]*\/>[\s\S]*<AdBanner entitlements=\{monetizationEntitlements\} placement="home_banner" \/>/,
  );
  assert.match(
    homeSource,
    /<PremiumBanner[\s\S]*entitlements=\{monetizationEntitlements\}[\s\S]*onEntitlementsChange=\{setMonetizationEntitlements\}[\s\S]*runtimeOptions=\{purchaseRuntime\}[\s\S]*\/>\s*<AdBanner entitlements=\{monetizationEntitlements\} placement="home_banner" \/>/,
  );
  assert.match(profileSource, /useRemoveAdsEntitlements/);
  assert.match(profileSource, /onEntitlementsChange=\{setMonetizationEntitlements\}/);
  assert.match(profileSource, /runtimeOptions=\{purchaseRuntime\}/);
  assert.match(placementCtaSource, /purchaseUnavailableReason === 'web_store_unavailable'/);
  assert.match(placementCtaSource, /copy\.webUnavailableBody\(REMOVE_ADS_PRICE_LABEL\)/);
  assert.match(placementCtaSource, /copy\.webUnavailableAccessibilityHint/);
  assert.match(placementCtaSource, /Buy in mobile app/);
  assert.match(placementCtaSource, /Köp i mobilappen/);
  assert.match(placementCtaSource, /Restore in mobile app/);
  assert.match(placementCtaSource, /Återställ i mobilappen/);
  assert.match(
    placementCtaSource,
    /const actionsDisabled = activeAction !== null \|\| purchaseUnavailable;/,
  );
  assert.match(placementCtaSource, /disabled=\{actionsDisabled\}/);
});

test('home remove-ads pricing copy uses the canonical purchase price label', () => {
  const { REMOVE_ADS_PRICE_LABEL } = loadTs('lib/monetization/purchases.ts');
  const pricingWedgeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PricingWedge.tsx'),
    'utf8',
  );
  const placementCtaSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/RemoveAdsPlacementCta.tsx'),
    'utf8',
  );
  const paywallSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PremiumBanner.tsx'),
    'utf8',
  );
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');

  assert.equal(REMOVE_ADS_PRICE_LABEL, '29 SEK');
  assert.match(pricingWedgeSource, /import \{ REMOVE_ADS_PRICE_LABEL \}/);
  assert.match(pricingWedgeSource, /t\.pitch\(REMOVE_ADS_PRICE_LABEL\)/);
  assert.match(pricingWedgeSource, /tidsatta övningsprov är alltid annonsfria/);
  assert.match(placementCtaSource, /Tidsatta övningsprov är redan annonsfria/);
  assert.match(paywallSource, /REMOVE_ADS_PRICE_LABEL/);
  assert.match(paywallSource, /tidsatta övningsprov i appen redan är annonsfria/);
  assert.match(homeSource, /<PricingWedge[\s\S]*language=\{language\}[\s\S]*\/>/);
  assert.doesNotMatch(pricingWedgeSource, /29 kr/);
  assert.doesNotMatch(paywallSource, /29 kr/);
  assert.doesNotMatch(
    pricingWedgeSource,
    /\bprov(?:et)?\s+(?:är|förblir)\s+(?:alltid\s+|redan\s+)?annonsfri(?:tt|a)?\b/i,
  );
  assert.doesNotMatch(
    paywallSource,
    /\bprov(?:et)?\s+(?:är|förblir)\s+(?:alltid\s+|redan\s+)?annonsfri(?:tt|a)?\b/i,
  );
  assert.doesNotMatch(
    placementCtaSource,
    /\bprov(?:et)?\s+(?:är|förblir)\s+(?:alltid\s+|redan\s+)?annonsfri(?:tt|a)?\b/i,
  );
});

test('AdBanner testStatus copy stays platform-neutral while liveStatus stays live-only', () => {
  const webBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.tsx'),
    'utf8',
  );
  const nativeBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.native.tsx'),
    'utf8',
  );
  const practiceInterstitialSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PracticeInterstitialAd.tsx'),
    'utf8',
  );
  const { adBannerCopy, getAdBannerStatusLabel } = loadTs('lib/monetization/adCopy.ts');

  assert.match(webBannerSource, /getAdBannerStatusLabel/);
  assert.match(webBannerSource, /const unit = getAdUnit\(placement\);/);
  assert.match(webBannerSource, /const adStatusLabel = getAdBannerStatusLabel\(copy, unit\);/);
  assert.match(nativeBannerSource, /const unit = getAdUnit\(placement\);/);
  assert.match(nativeBannerSource, /getAdBannerStatusLabel/);
  assert.match(nativeBannerSource, /const adStatusLabel = getAdBannerStatusLabel\(copy, unit\);/);
  assert.match(practiceInterstitialSource, /getAdBannerStatusLabel/);
  assert.match(
    practiceInterstitialSource,
    /const unit = getAdUnit\('quiz_completed_interstitial'\);/,
  );
  assert.match(
    practiceInterstitialSource,
    /const adStatusLabel = getAdBannerStatusLabel\(copy, unit\);/,
  );
  assert.doesNotMatch(
    practiceInterstitialSource,
    /unit\?\.testOnly\s*\?\s*copy\.testStatus\s*:\s*copy\.liveStatus|const adStatusLabel = copy\.liveStatus/,
  );
  assert.doesNotMatch(
    nativeBannerSource,
    /accessibilityLabel=\{copy\.accessibilityLabel\(placementLabel, copy\.liveStatus\)\}/,
  );
  assert.equal(adBannerCopy.en.testStatus, 'AdMob test unit active - preview');
  assert.equal(adBannerCopy.sv.testStatus, 'AdMob-testannons aktiv - förhandsvisning');
  assert.equal(adBannerCopy.en.liveStatus, 'AdMob placement active');
  assert.equal(adBannerCopy.sv.liveStatus, 'AdMob-placering aktiv');

  for (const copy of Object.values(adBannerCopy)) {
    assert.doesNotMatch(copy.testStatus, /web preview|webbförhandsvisning/);
    assert.doesNotMatch(copy.liveStatus, /test unit|testannons|testplacering|preview/i);
    assert.equal(getAdBannerStatusLabel(copy, { testOnly: true }), copy.testStatus);
    assert.equal(getAdBannerStatusLabel(copy, { testOnly: false }), copy.liveStatus);
    assert.equal(getAdBannerStatusLabel(copy, undefined), copy.liveStatus);
  }

  assert.equal(
    adBannerCopy.en.accessibilityLabel(
      adBannerCopy.en.placementLabels.home_banner,
      adBannerCopy.en.testStatus,
    ),
    'Google AdMob: Home banner. AdMob test unit active - preview. Hidden after Remove Ads is active.',
  );
  assert.equal(
    adBannerCopy.sv.accessibilityLabel(
      adBannerCopy.sv.placementLabels.chapter_list_banner,
      adBannerCopy.sv.testStatus,
    ),
    'Google AdMob: Annons i kapitellistan. AdMob-testannons aktiv - förhandsvisning. Döljs när Ta bort annonser är aktivt.',
  );
});

test('ad placements hydrate persisted remove-ads entitlements by default', () => {
  const webBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.tsx'),
    'utf8',
  );
  const nativeBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.native.tsx'),
    'utf8',
  );
  const nativeAdCardSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/NativeAdCard.tsx'),
    'utf8',
  );
  const entitlementHookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useRemoveAdsEntitlements.ts'),
    'utf8',
  );

  assert.match(entitlementHookSource, /defaultWebPurchaseRuntimeOptions/);
  assert.match(entitlementHookSource, /defaultNativePurchaseRuntimeOptions/);
  assert.match(entitlementHookSource, /createNativePurchaseProvider/);
  assert.match(entitlementHookSource, /createSecureStorePurchaseStorage/);
  assert.match(entitlementHookSource, /createWebPurchaseStorage/);
  assert.doesNotMatch(entitlementHookSource, /if \(Platform\.OS !== 'web'\) return undefined;/);
  assert.match(entitlementHookSource, /publishRemoveAdsEntitlements/);
  assert.match(entitlementHookSource, /subscribeToRemoveAdsEntitlements/);
  assert.match(entitlementHookSource, /AD_BLOCKED_PENDING_ENTITLEMENTS/);
  assert.match(entitlementHookSource, /useResolvedAdEntitlements/);
  assert.match(webBannerSource, /useResolvedAdEntitlements\(entitlements\)/);
  assert.match(webBannerSource, /!entitlementsReady/);
  assert.match(nativeBannerSource, /useResolvedAdEntitlements\(entitlements\)/);
  assert.match(nativeBannerSource, /entitlementsReady\s+&&[\s\S]*mobileAdsConsent\.initialized/);
  assert.match(nativeAdCardSource, /useResolvedAdEntitlements\(entitlements\)/);
  assert.match(nativeAdCardSource, /!entitlementsReady/);
});

test('explicit ad entitlements skip default purchase runtime side effects', async () => {
  const entitlementHookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useRemoveAdsEntitlements.ts'),
    'utf8',
  );
  const resolvedHookSource = entitlementHookSource.slice(
    entitlementHookSource.indexOf('export function useResolvedAdEntitlements'),
  );

  assert.match(entitlementHookSource, /function useRemoveAdsEntitlementsRuntime/);
  assert.match(entitlementHookSource, /purchaseRuntimeEnabled:\s*!skipPurchaseRuntime/);
  assert.match(resolvedHookSource, /useRemoveAdsEntitlementsRuntime\(/);
  assert.match(resolvedHookSource, /purchaseRuntimeEnabled:\s*!hasExplicitEntitlements/);
  assert.doesNotMatch(resolvedHookSource, /useRemoveAdsEntitlements\(/);
  assert.doesNotMatch(resolvedHookSource, /skipPurchaseRuntime/);

  const localStorage = createMemoryLocalStorage();

  await withGlobalProperties(
    {
      __SMT_E2E__: true,
      __SMT_REMOVE_ADS_MOCK_OWNED__: false,
      localStorage,
    },
    async () => {
      const moduleCache = new Map();
      const moduleMocks = {
        react: createReactHookStub(),
        'react-native': createReactNativeWebStub(),
      };
      const { REMOVE_ADS_STORAGE_KEY } = loadTs(
        'lib/monetization/purchases.ts',
        undefined,
        moduleCache,
        moduleMocks,
      );
      const { useResolvedAdEntitlements } = loadTs(
        'lib/monetization/useRemoveAdsEntitlements.ts',
        undefined,
        moduleCache,
        moduleMocks,
      );

      const resolved = useResolvedAdEntitlements({ adsDisabled: true });

      assert.equal(resolved.entitlements.adsDisabled, true);
      assert.equal(resolved.entitlementsReady, true);
      assert.equal(resolved.entitlementStatus, 'ready');
      const malformedResolved = useResolvedAdEntitlements({ adsDisabled: 'yes' });
      assert.equal(malformedResolved.entitlements.adsDisabled, false);
      assert.equal(malformedResolved.entitlementsReady, true);
      assert.equal(malformedResolved.entitlementStatus, 'ready');
      assert.equal(
        localStorage.getItem(REMOVE_ADS_STORAGE_KEY),
        null,
        'explicit entitlements must not seed web purchase storage',
      );
    },
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

  const malformedDisabledState = {
    ...disabledState,
    entitlements: { adsDisabled: 'yes' },
    umpConsentStatus: 'not_required',
  };
  const malformedDisabledDecision = getAdConsentDecision(malformedDisabledState);
  const malformedDisabledInit = getAdSdkInitializationDecision(malformedDisabledState);

  assert.equal(malformedDisabledDecision.adServingAllowed, true);
  assert.deepEqual(malformedDisabledDecision.pendingPrompts, []);
  assert.equal(malformedDisabledInit.canInitializeGoogleMobileAds, true);
  assert.equal(malformedDisabledInit.blockReason, undefined);

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

test('AdConsentRegion runtime normalization fails closed for invalid Mobile Ads regions', () => {
  const { getAdSdkInitializationDecision, normalizeAdConsentRegion, regionRequiresUmpConsent } =
    loadTs('lib/monetization/consent.ts');
  const { createInitialAdConsentState } = loadTs('lib/monetization/mobileAdsConsent.ts');
  const baseState = {
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    platform: 'android',
    realAdsEnabled: true,
    trackingTransparencyStatus: 'unavailable',
    umpConsentStatus: 'unknown',
  };

  for (const region of ['banana', '', null, 'future_region']) {
    const state = createInitialAdConsentState({ ...baseState, region });
    const decision = getAdSdkInitializationDecision(state);

    assert.equal(normalizeAdConsentRegion(region), 'unknown');
    assert.equal(regionRequiresUmpConsent(region), true);
    assert.equal(state.region, 'unknown');
    assert.equal(decision.canInitializeGoogleMobileAds, false);
    assert.deepEqual(decision.consentDecision.pendingPrompts, ['ump_consent_form']);
    assert.equal(decision.blockReason, 'pending_consent_prompts');
  }

  for (const region of ['eea', 'uk', 'unknown']) {
    const state = createInitialAdConsentState({ ...baseState, region });
    const decision = getAdSdkInitializationDecision(state);

    assert.equal(state.region, region);
    assert.equal(regionRequiresUmpConsent(region), true);
    assert.equal(decision.canInitializeGoogleMobileAds, false);
    assert.deepEqual(decision.consentDecision.pendingPrompts, ['ump_consent_form']);
  }

  for (const region of ['us', 'other']) {
    const state = createInitialAdConsentState({ ...baseState, region });
    const decision = getAdSdkInitializationDecision(state);

    assert.equal(state.region, region);
    assert.equal(regionRequiresUmpConsent(region), false);
    assert.equal(decision.canInitializeGoogleMobileAds, true);
    assert.deepEqual(decision.consentDecision.pendingPrompts, []);
  }
});

test('native Mobile Ads consent runtime requests ATT and UMP before SDK init', async () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8'));
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const nativeBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.native.tsx'),
    'utf8',
  );
  const launchSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/LaunchPopupAd.native.tsx'),
    'utf8',
  );
  const mobileConsentSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/mobileAdsConsent.ts'),
    'utf8',
  );
  const hookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useMobileAdsConsent.ts'),
    'utf8',
  );
  const trackingPlugin = appJson.expo.plugins.find(
    (entry) => Array.isArray(entry) && entry[0] === 'expo-tracking-transparency',
  );
  const {
    collectMobileAdsConsentState,
    initializeGoogleMobileAdsAfterConsent,
    mapTrackingTransparencyStatus,
    mapUmpConsentStatus,
  } = loadTs('lib/monetization/mobileAdsConsent.ts');

  assert.equal(packageJson.dependencies['expo-tracking-transparency'], '~6.0.8');
  assert.ok(trackingPlugin, 'expo-tracking-transparency plugin should be configured');
  assert.match(trackingPlugin[1].userTrackingPermission, /ads after consent/);
  assert.match(mobileConsentSource, /expo-tracking-transparency/);
  assert.match(mobileConsentSource, /AdsConsent\.gatherConsent/);
  assert.match(mobileConsentSource, /mobileAds\(\)\.initialize/);
  assert.match(hookSource, /const platform = options\.platform \?\? Platform\.OS/);
  assert.match(hookSource, /createNativeMobileAdsConsentRuntime\(platform\)/);
  assert.match(nativeBannerSource, /useMobileAdsConsent/);
  assert.match(nativeBannerSource, /consentDecision/);
  assert.match(
    nativeBannerSource,
    /shouldShowAd\(\s*placement\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );
  assert.match(launchSource, /useMobileAdsConsent/);
  assert.match(launchSource, /shouldShowLaunchPopupAd\(\{[\s\S]*consentDecision/);
  assert.match(launchSource, /shouldShowLaunchPopupAd\(\{[\s\S]*platform: Platform\.OS/);
  assert.equal(mapTrackingTransparencyStatus({ status: 'granted' }, 'ios'), 'authorized');
  assert.equal(mapTrackingTransparencyStatus({ status: 'undetermined' }, 'ios'), 'not_determined');
  assert.equal(mapUmpConsentStatus({ status: 'OBTAINED' }), 'obtained');
  assert.equal(mapUmpConsentStatus({ status: 'NOT_REQUIRED' }), 'not_required');
  assert.equal(mapUmpConsentStatus({ canRequestAds: true, status: 'REQUIRED' }), 'obtained');

  const calls = [];
  const initializedResult = await initializeGoogleMobileAdsAfterConsent({
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    realAdsEnabled: true,
    runtime: {
      async gatherUmpConsent() {
        calls.push('ump');
        return { canRequestAds: true, status: 'OBTAINED' };
      },
      async getTrackingPermissionsAsync() {
        calls.push('att:get');
        return { status: 'undetermined' };
      },
      async initializeGoogleMobileAds() {
        calls.push('ads:init');
      },
      platform: 'ios',
      async requestTrackingPermissionsAsync() {
        calls.push('att:request');
        return { status: 'denied' };
      },
    },
  });

  assert.equal(initializedResult.initialized, true);
  assert.equal(initializedResult.state.trackingTransparencyStatus, 'denied');
  assert.equal(initializedResult.state.umpConsentStatus, 'obtained');
  assert.equal(initializedResult.decision.canInitializeGoogleMobileAds, true);
  assert.equal(initializedResult.decision.requestNonPersonalizedAdsOnly, true);
  assert.deepEqual(calls, ['att:get', 'att:request', 'ump', 'ads:init']);

  const disabledCalls = [];
  const disabledState = await collectMobileAdsConsentState({
    entitlements: { adsDisabled: true },
    googleMobileAdsEnabled: true,
    realAdsEnabled: true,
    runtime: {
      async gatherUmpConsent() {
        disabledCalls.push('ump');
        return { status: 'REQUIRED' };
      },
      async getTrackingPermissionsAsync() {
        disabledCalls.push('att:get');
        return { status: 'undetermined' };
      },
      platform: 'ios',
      async requestTrackingPermissionsAsync() {
        disabledCalls.push('att:request');
        return { status: 'denied' };
      },
    },
  });

  assert.deepEqual(disabledCalls, []);
  assert.equal(disabledState.trackingTransparencyStatus, 'unavailable');
  assert.equal(disabledState.umpConsentStatus, 'not_required');

  const malformedDisabledCalls = [];
  const malformedDisabledState = await collectMobileAdsConsentState({
    entitlements: { adsDisabled: 'yes' },
    googleMobileAdsEnabled: true,
    realAdsEnabled: true,
    runtime: {
      async gatherUmpConsent() {
        malformedDisabledCalls.push('ump');
        return { canRequestAds: true, status: 'REQUIRED' };
      },
      async getTrackingPermissionsAsync() {
        malformedDisabledCalls.push('att:get');
        return { status: 'undetermined' };
      },
      platform: 'ios',
      async requestTrackingPermissionsAsync() {
        malformedDisabledCalls.push('att:request');
        return { status: 'denied' };
      },
    },
  });

  assert.deepEqual(malformedDisabledCalls, ['att:get', 'att:request', 'ump']);
  assert.equal(malformedDisabledState.trackingTransparencyStatus, 'denied');
  assert.equal(malformedDisabledState.umpConsentStatus, 'obtained');

  const canRequestAdsCalls = [];
  const canRequestAdsResult = await initializeGoogleMobileAdsAfterConsent({
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    realAdsEnabled: true,
    runtime: {
      async gatherUmpConsent() {
        canRequestAdsCalls.push('ump');
        return { canRequestAds: true, status: 'REQUIRED' };
      },
      async initializeGoogleMobileAds() {
        canRequestAdsCalls.push('ads:init');
      },
      platform: 'android',
    },
  });

  assert.equal(canRequestAdsResult.initialized, true);
  assert.equal(canRequestAdsResult.state.umpConsentStatus, 'obtained');
  assert.equal(canRequestAdsResult.decision.canInitializeGoogleMobileAds, true);
  assert.deepEqual(canRequestAdsCalls, ['ump', 'ads:init']);

  const consentInfoFallbackCalls = [];
  const consentInfoFallbackResult = await initializeGoogleMobileAdsAfterConsent({
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    realAdsEnabled: true,
    runtime: {
      async gatherUmpConsent() {
        consentInfoFallbackCalls.push('ump');
        throw new Error('UMP unavailable');
      },
      async getUmpConsentInfo() {
        consentInfoFallbackCalls.push('ump:cached-info');
        return { canRequestAds: true, status: 'UNKNOWN' };
      },
      async initializeGoogleMobileAds() {
        consentInfoFallbackCalls.push('ads:init');
      },
      platform: 'android',
    },
  });

  assert.equal(consentInfoFallbackResult.initialized, true);
  assert.equal(consentInfoFallbackResult.state.umpConsentStatus, 'obtained');
  assert.equal(consentInfoFallbackResult.decision.canInitializeGoogleMobileAds, true);
  assert.deepEqual(consentInfoFallbackCalls, ['ump', 'ump:cached-info', 'ads:init']);
});

test('Mobile Ads consent hook retries after initialized false blocked results', () => {
  const hookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useMobileAdsConsent.ts'),
    'utf8',
  );

  assert.match(
    hookSource,
    /function\s+resetInitializationPromise\(\)\s*\{\s*initializationPromise\s*=\s*undefined;\s*initializationPromisePlatform\s*=\s*undefined;\s*\}/,
  );
  assert.match(
    hookSource,
    /if\s*\(\s*!result\.initialized\s*\)\s*\{\s*resetInitializationPromise\(\);\s*return\s+result;\s*\}/,
  );
  assert.match(
    hookSource,
    /initializationPromise\s*\?\?=\s*initializeGoogleMobileAdsAfterConsent\([\s\S]*\.then\(\(result\)\s*=>\s*resolveInitializationResult\(result,\s*platform\)\)/,
  );
  assert.match(hookSource, /cachedInitialization\s*=\s*result;/);
  assert.match(hookSource, /cachedInitializationPlatform\s*=\s*platform;/);
});

test('exam screen does not import ad components', () => {
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const accessHookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useMockExamAccess.ts'),
    'utf8',
  );

  assert.doesNotMatch(examSource, /AdBanner|NativeAd|Interstitial|RewardedAd/i);
  assert.doesNotMatch(
    examSource,
    /showRewardedExtraExamAd|rewardPreview|sponsor preview|Sponsored preview|Sponsrad förhandsvisning|Complete sponsor preview|Slutför förhandsvisning|Unlock extra exam|Lås upp extra prov/i,
  );
  assert.match(examSource, /useMockExamAccess/);
  assert.match(examSource, /recordExamCompletion\(examAttemptId\)/);
  assert.match(examSource, /handleStartAccessibleExam/);
  assert.match(examSource, /Start unlocked mock exam/);
  assert.match(accessHookSource, /getMockExamAccessDecision/);
  assert.match(accessHookSource, /platform: Platform\.OS/);
  assert.match(accessHookSource, /recordStoredMockExamCompletion\(\{ storage, sessionId \}\)/);
  assert.match(accessHookSource, /grantStoredRewardedExtraExamCredit/);
  assert.match(accessHookSource, /consumeStoredRewardedExtraExamCredit/);
  assert.match(accessHookSource, /createWebMockExamAccessStorage/);
  assert.match(accessHookSource, /createSecureStoreMockExamAccessStorage/);
});

test('global launch popup ad is suppressed on active question and compliance routes', () => {
  const layoutSource = fs.readFileSync(path.join(repoRoot, 'app/_layout.tsx'), 'utf8');
  const entitlementHookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useRemoveAdsEntitlements.ts'),
    'utf8',
  );
  const { adsConfig, isLaunchPopupAdEligibleForPath, shouldSuppressLaunchPopupAdForPath } =
    loadTs('lib/monetization/ads.ts');

  assert.match(layoutSource, /usePathname/);
  assert.match(layoutSource, /useRemoveAdsEntitlements/);
  assert.match(layoutSource, /shouldSuppressLaunchPopupAdForPath\(pathname\)/);
  assert.match(layoutSource, /entitlementsReady/);
  assert.match(layoutSource, /<LaunchPopupAd entitlements=\{monetizationEntitlements\} \/>/);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/exam'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/exam/review'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/practice'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/practice/review'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/quiz/q001'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/quiz/q001/review'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/about-the-test'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/chapter/ch01'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/chapter/ch01/summary'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/citizenship-requirements'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/onboarding'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/privacy'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/search'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/search?q=riksdag'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/settings'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/terms'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/support'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/disclaimer'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/sources'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/unknown'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/home/details'), true);
  assert.equal(isLaunchPopupAdEligibleForPath('/'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/home'), false);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/learn'), false);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/mistakes'), false);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/profile'), false);
  assert.deepEqual(adsConfig.eligibleLaunchPopupRoutes, [
    '/',
    '/home',
    '/learn',
    '/mistakes',
    '/profile',
  ]);
  assert.deepEqual(adsConfig.suppressedLaunchPopupRoutes, [
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
  ]);
  assert.match(entitlementHookSource, /getPurchaseEntitlements/);
  assert.match(entitlementHookSource, /createWebPurchaseStorage/);
  assert.match(entitlementHookSource, /Platform\.OS === 'web'/);
  assert.match(entitlementHookSource, /createNativePurchaseProvider/);
});
