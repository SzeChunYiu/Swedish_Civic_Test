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
      assert.match(getPlatformAdUnitId('rewarded_extra_exam', 'android'), /5224354917$/);
      assert.match(getPlatformAdUnitId('rewarded_extra_exam', 'ios'), /1712485313$/);
    },
  );
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
        grantRewardedExtraExamCredit,
      } = loadTs('lib/monetization/rewardedExam.ts');
      const { shouldShowAd } = loadTs('lib/monetization/ads.ts');
      const freeEntitlements = { adsDisabled: false, unlimitedMockExams: false };

      assert.equal(REWARDED_EXTRA_EXAM_PLACEMENT, 'rewarded_extra_exam');
      assert.equal(shouldShowAd('exam_screen', { adsDisabled: false }), false);

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
    },
  );
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
        }).reason,
        'consent_required',
      );

      assert.deepEqual(
        getMockExamAccessDecision({
          completedMockExamsToday: 1,
          consentDecision: { adServingAllowed: true },
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

  assert.deepEqual(await getStoredMockExamAccess({ date: '2026-05-17T09:30:00.000Z', storage }), {
    completedMockExamsByDate: {},
    completedMockExamsToday: 0,
    dateKey: '2026-05-17',
    rewardedExtraExamCredits: 0,
  });

  await recordStoredMockExamCompletion({ date: '2026-05-17T10:00:00.000Z', storage });
  const todaySnapshot = await recordStoredMockExamCompletion({
    date: '2026-05-17T11:00:00.000Z',
    storage,
  });

  assert.equal(todaySnapshot.completedMockExamsToday, 2);
  assert.equal(todaySnapshot.completedMockExamsByDate['2026-05-17'], 2);

  const tomorrowSnapshot = await getStoredMockExamAccess({
    date: '2026-05-18T08:00:00.000Z',
    storage,
  });

  assert.equal(tomorrowSnapshot.completedMockExamsToday, 0);
  assert.equal(tomorrowSnapshot.completedMockExamsByDate['2026-05-17'], 2);

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
      invalid: 9,
    },
    rewardedExtraExamCredits: 1.9,
  });
  const seededSnapshot = await getStoredMockExamAccess({
    date: '2026-05-17T09:00:00.000Z',
    storage: seededStorage,
  });

  assert.deepEqual(seededSnapshot.completedMockExamsByDate, { '2026-05-17': 2 });
  assert.equal(seededSnapshot.rewardedExtraExamCredits, 1);

  assert.equal(typeof createSecureStoreMockExamAccessStorage().getItemAsync, 'function');

  const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const localStorageValues = new Map();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem(key) {
        return localStorageValues.get(key) ?? null;
      },
      removeItem(key) {
        localStorageValues.delete(key);
      },
      setItem(key, value) {
        localStorageValues.set(key, String(value));
      },
    },
  });

  try {
    const webStorage = createWebMockExamAccessStorage();

    await recordStoredMockExamCompletion({
      date: '2026-05-18T09:00:00.000Z',
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
  } finally {
    if (previousLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', previousLocalStorage);
    } else {
      delete globalThis.localStorage;
    }
  }

  assert.deepEqual(
    await clearStoredMockExamAccess({
      date: '2026-05-17T09:00:00.000Z',
      storage: seededStorage,
    }),
    {
      completedMockExamsByDate: {},
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

  assert.deepEqual(defaultResult, {
    reward: {
      amount: 1,
      type: 'extra_mock_exam',
    },
    status: 'earned_reward',
  });
  assert.deepEqual(removeAdsResult, { status: 'unavailable' });
  assert.deepEqual(disabledAdsResult, { status: 'unavailable' });
  assert.match(webRewardedAdSource, /shouldShowAd\(REWARDED_EXTRA_EXAM_PLACEMENT, entitlements\)/);
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
  assert.match(
    examSource,
    /accessDecision\.canOfferRewardedAd \|\| accessDecision\.reason === 'consent_required'/,
  );
  assert.match(
    examSource,
    /const rewardedAdResult = await showRewardedExtraExamAd\(\{ entitlements \}\);[\s\S]*rewardedAdResult\.status !== 'earned_reward'[\s\S]*await grantRewardedExamCredit\(\);/,
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
    REMOVE_ADS_RECORD_SCHEMA_VERSION,
    REMOVE_ADS_PRODUCT_ID,
    REMOVE_ADS_STORAGE_KEY,
    buyRemoveAds,
    createMemoryPurchaseStorage,
    createMockPurchaseProvider,
    createWebPurchaseStorage,
    getPurchaseEntitlements,
    restoreRemoveAdsPurchase,
    setRemoveAdsEntitlement,
  } = purchaseExports;
  const purchasesSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/purchases.ts'),
    'utf8',
  );
  const removedVerifierExportName = ['REMOVE_ADS', 'VERIFIER', 'TOKEN'].join('_');

  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const appConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8')).expo;
  const expectedRemoveAdsProductId = `${appConfig.ios.bundleIdentifier}.removeads`;
  assert.equal(packageJson.dependencies['expo-secure-store'], '~15.0.8');
  assert.equal(packageJson.dependencies['react-native-iap'], '^15.3.0');
  assert.equal(REMOVE_ADS_PRODUCT_ID, expectedRemoveAdsProductId);
  assert.match(REMOVE_ADS_PRODUCT_ID, /removeads$/);
  assert.equal(REMOVE_ADS_PRICE_LABEL, '29 SEK');
  assert.equal(REMOVE_ADS_RECORD_SCHEMA_VERSION, 1);
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
  const storedPurchaseRecord = JSON.parse(await storage.getItemAsync(REMOVE_ADS_STORAGE_KEY));
  assert.deepEqual(
    {
      productId: storedPurchaseRecord.productId,
      purchaseToken: storedPurchaseRecord.purchaseToken,
      schemaVersion: storedPurchaseRecord.schemaVersion,
      source: storedPurchaseRecord.source,
      transactionId: storedPurchaseRecord.transactionId,
    },
    {
      productId: REMOVE_ADS_PRODUCT_ID,
      purchaseToken: 'mock-token-buy-remove-ads',
      schemaVersion: REMOVE_ADS_RECORD_SCHEMA_VERSION,
      source: 'purchase',
      transactionId: 'buy-remove-ads',
    },
  );
  assert.match(storedPurchaseRecord.grantedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(Object.hasOwn(storedPurchaseRecord, 'raw'), false);

  const restoredStorage = createMemoryPurchaseStorage();
  const restoreResult = await restoreRemoveAdsPurchase({
    provider: createMockPurchaseProvider({ owned: true }),
    storage: restoredStorage,
  });

  assert.equal(restoreResult.status, 'restored');
  assert.equal(restoreResult.entitlements.adsDisabled, true);
  assert.equal((await getPurchaseEntitlements({ storage: restoredStorage })).adsDisabled, true);
  const storedRestoreRecord = JSON.parse(
    await restoredStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY),
  );
  assert.equal(storedRestoreRecord.source, 'restore');
  assert.equal(storedRestoreRecord.transactionId, 'restore-remove-ads');
  assert.equal(storedRestoreRecord.purchaseToken, 'mock-token-restore-remove-ads');

  const missingRestore = await restoreRemoveAdsPurchase({
    provider: createMockPurchaseProvider(),
    storage: createMemoryPurchaseStorage(),
  });
  assert.equal(missingRestore.status, 'not_found');
  assert.equal(missingRestore.entitlements.adsDisabled, false);

  const previousLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const localStorageValues = new Map();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem(key) {
        return localStorageValues.get(key) ?? null;
      },
      removeItem(key) {
        localStorageValues.delete(key);
      },
      setItem(key, value) {
        localStorageValues.set(key, String(value));
      },
    },
  });

  try {
    const webStorage = createWebPurchaseStorage();
    await setRemoveAdsEntitlement(true, { storage: webStorage });

    const webStorageAfterReload = createWebPurchaseStorage();
    assert.equal(
      (await getPurchaseEntitlements({ storage: webStorageAfterReload })).adsDisabled,
      true,
    );

    await setRemoveAdsEntitlement(false, { storage: webStorageAfterReload });
    assert.equal(localStorageValues.has(REMOVE_ADS_STORAGE_KEY), false);
  } finally {
    if (previousLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', previousLocalStorage);
    } else {
      delete globalThis.localStorage;
    }
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

  await storage.setItemAsync(REMOVE_ADS_STORAGE_KEY, 'true');
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, false);

  await storage.setItemAsync(REMOVE_ADS_STORAGE_KEY, '{not-json');
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, false);

  await storage.setItemAsync(
    REMOVE_ADS_STORAGE_KEY,
    JSON.stringify({
      grantedAt: new Date().toISOString(),
      productId: REMOVE_ADS_PRODUCT_ID,
      schemaVersion: 1,
      source: 'purchase',
    }),
  );
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, false);

  await storage.setItemAsync(
    REMOVE_ADS_STORAGE_KEY,
    JSON.stringify({
      grantedAt: 'not-a-date',
      productId: REMOVE_ADS_PRODUCT_ID,
      schemaVersion: 1,
      source: 'restore',
      transactionId: 'restore-remove-ads',
    }),
  );
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, false);
});

test('pending remove-ads purchase does not grant adsDisabled until store confirmation', async () => {
  const {
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

test('remove-ads paywall is surfaced near an ad placement and wired to purchase helpers', () => {
  const paywallSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PremiumBanner.tsx'),
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
  assert.match(paywallSource, /Buy Remove Ads for \$\{price\}/);
  assert.match(paywallSource, /Köp Ta bort annonser för \$\{price\}/);
  assert.match(paywallSource, /Hela frågebanken och alla 13 ämnen ingår gratis/);
  assert.match(paywallSource, /The full question bank and all 13 topics are free/);
  assert.match(paywallSource, /accessibilityHint=\{copy\.buyAccessibilityHint\}/);
  assert.match(paywallSource, /Purchase removes ads after store confirmation/);
  assert.match(paywallSource, /Tidsatta övningsprov är redan annonsfria/);
  assert.match(paywallSource, /Provläget är redan annonsfritt/);
  assert.match(placementCtaSource, /Tidsatta övningsprov är redan annonsfria/);
  assert.match(placementCtaSource, /restoreRemoveAdsPurchase/);
  assert.match(placementCtaSource, /runPurchaseAction\('restore', restoreRemoveAdsPurchase\)/);
  assert.match(placementCtaSource, /accessibilityLabel=\{copy\.restoreAccessibilityLabel\}/);
  assert.match(placementCtaSource, /accessibilityHint=\{copy\.restoreAccessibilityHint\}/);
  assert.match(placementCtaSource, /href="\/profile\?focus=remove-ads"/);
  assert.match(placementCtaSource, /Open the Remove Ads panel in Profile/);
  assert.match(placementCtaSource, /Öppna Ta bort annonser-panelen i profilen/);
  assert.match(placementCtaSource, /Restore Remove Ads purchase/);
  assert.match(placementCtaSource, /Återställ köp av Ta bort annonser/);
  assert.match(placementCtaSource, /No previous Remove Ads purchase was found/);
  assert.match(placementCtaSource, /Purchase restored\. Study ads are being removed/);
  assert.doesNotMatch(placementCtaSource, /\bProv är redan annonsfria\b/);
  assert.doesNotMatch(placementCtaSource, /\b(?:prov|provet)\b.{0,48}\bannonsfri(?:tt|a)?\b/i);
  assert.doesNotMatch(paywallSource, /\bprov förblir annonsfria\b/i);
  assert.match(paywallSource, /Restore Remove Ads purchase/);
  assert.match(paywallSource, /Återställ köp av Ta bort annonser/);
  assert.doesNotMatch(paywallSource, /ads are deferred|RevenueCat can be added/i);
  assert.match(homeSource, /import \{ PremiumBanner \}/);
  assert.match(
    homeSource,
    /<PremiumBanner[\s\S]*entitlements=\{monetizationEntitlements\}[\s\S]*onEntitlementsChange=\{setMonetizationEntitlements\}[\s\S]*runtimeOptions=\{purchaseRuntime\}[\s\S]*\/>\s*<AdBanner entitlements=\{monetizationEntitlements\} placement="home_banner" \/>/,
  );
  assert.match(profileSource, /useRemoveAdsEntitlements/);
  assert.match(profileSource, /onEntitlementsChange=\{setMonetizationEntitlements\}/);
  assert.match(profileSource, /runtimeOptions=\{purchaseRuntime\}/);
});

test('home remove-ads pricing copy uses the canonical purchase price label', () => {
  const { REMOVE_ADS_PRICE_LABEL } = loadTs('lib/monetization/purchases.ts');
  const pricingWedgeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PricingWedge.tsx'),
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
  assert.match(paywallSource, /REMOVE_ADS_PRICE_LABEL/);
  assert.match(homeSource, /<PricingWedge[\s\S]*language=\{language\}[\s\S]*\/>/);
  assert.doesNotMatch(pricingWedgeSource, /29 kr/);
  assert.doesNotMatch(paywallSource, /29 kr/);
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
  assert.match(entitlementHookSource, /createWebPurchaseStorage/);
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

test('release monetization policy requires ad-supported free tier and Remove Ads IAP', () => {
  const appConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8')).expo;
  const { REMOVE_ADS_PRICE_LABEL, REMOVE_ADS_PRODUCT_ID } = loadTs('lib/monetization/purchases.ts');
  const { isReleaseMonetizationPolicyReady, releaseMonetizationPolicy } = loadTs(
    'lib/monetization/releasePolicy.ts',
  );

  assert.equal(isReleaseMonetizationPolicyReady(), true);
  assert.equal(REMOVE_ADS_PRODUCT_ID, `${appConfig.ios.bundleIdentifier}.removeads`);
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
  assert.match(hookSource, /createNativeMobileAdsConsentRuntime\(Platform\.OS\)/);
  assert.match(nativeBannerSource, /useMobileAdsConsent/);
  assert.match(nativeBannerSource, /consentDecision/);
  assert.match(launchSource, /useMobileAdsConsent/);
  assert.match(launchSource, /shouldShowLaunchPopupAd\(\{[\s\S]*consentDecision/);
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
  assert.deepEqual(calls, ['att:get', 'ump', 'att:request', 'ads:init']);

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

test('exam screen does not import ad components', () => {
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const accessHookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useMockExamAccess.ts'),
    'utf8',
  );

  assert.doesNotMatch(examSource, /AdBanner|NativeAd|Interstitial/i);
  assert.match(examSource, /useMockExamAccess/);
  assert.match(examSource, /recordExamCompletion/);
  assert.match(examSource, /handleStartAccessibleExam/);
  assert.match(examSource, /Unlock extra exam/);
  assert.match(accessHookSource, /getMockExamAccessDecision/);
  assert.match(accessHookSource, /recordStoredMockExamCompletion/);
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
  const { adsConfig, shouldSuppressLaunchPopupAdForPath } = loadTs('lib/monetization/ads.ts');

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
  assert.equal(shouldSuppressLaunchPopupAdForPath('/privacy'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/terms'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/support'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/disclaimer'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/about-the-test'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/about-the-test/intro'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/onboarding'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/onboarding/checklist'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/sources'), true);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/home'), false);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/learn'), false);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/mistakes'), false);
  assert.equal(shouldSuppressLaunchPopupAdForPath('/profile'), false);
  assert.deepEqual(adsConfig.suppressedLaunchPopupRoutes, [
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
  ]);
  assert.match(entitlementHookSource, /getPurchaseEntitlements/);
  assert.match(entitlementHookSource, /createWebPurchaseStorage/);
  assert.match(entitlementHookSource, /Platform\.OS !== 'web'/);
});
