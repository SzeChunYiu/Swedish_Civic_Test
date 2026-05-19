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

function assertRealAdUnitEnvInliningSource(adsSource, adsConfig) {
  assert.match(
    adsSource,
    /REAL_AD_UNIT_ENV_VALUES/,
    'real ad units should use a literal env-value table for bundler inlining',
  );
  assert.doesNotMatch(
    adsSource,
    /process\.env\s*\[[^\]]+\]/,
    'real ad unit IDs must not use dynamic process.env[key] lookup',
  );

  for (const [placement, envKeys] of Object.entries(adsConfig.realUnitEnvKeys)) {
    for (const [platform, envKey] of Object.entries(envKeys)) {
      const literalReadPattern = new RegExp(
        `${placement}:\\s*\\{[\\s\\S]*${platform}:\\s*readEnvString\\(\\s*process\\.env\\.${envKey}\\s*,?\\s*\\)`,
      );
      assert.match(
        adsSource,
        literalReadPattern,
        `${placement} ${platform} real ad unit must read ${envKey} through a literal process.env.${envKey} expression`,
      );
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
  const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
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

  assertRealAdUnitEnvInliningSource(adsSource, adsConfig);
});

test('real ad unit env inlining guard rejects dynamic or missing env reads', () => {
  const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
  const { adsConfig } = loadTs('lib/monetization/ads.ts');

  assert.throws(
    () =>
      assertRealAdUnitEnvInliningSource(
        adsSource.replace(
          'process.env.EXPO_PUBLIC_ADMOB_ANDROID_HOME_BANNER_UNIT_ID',
          'process.env[envKeys.android]',
        ),
        adsConfig,
      ),
    /dynamic process\.env\[key\]|home_banner android real ad unit/,
  );
  assert.throws(
    () =>
      assertRealAdUnitEnvInliningSource(
        adsSource.replace(
          'process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_EXTRA_EXAM_UNIT_ID',
          'process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_EXTRA_EXAM_ID',
        ),
        adsConfig,
      ),
    /rewarded_extra_exam ios real ad unit/,
  );
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
  assert.match(nativeAdCardSource, /NativeAd\.createForAdRequest/);
  assert.match(nativeAdCardSource, /NativeAdView/);
  assert.match(nativeAdCardSource, /<NativeAdView accessible=\{false\}/);
  assert.match(nativeAdCardSource, /accessibilityRole="summary"/);
  assert.match(nativeAdCardSource, /NativeAssetType\.HEADLINE/);
  assert.match(nativeAdCardSource, /NativeAssetType\.BODY/);
  assert.match(nativeAdCardSource, /NativeAssetType\.CALL_TO_ACTION/);
  for (const [assetType, directChild] of [
    ['ICON', 'Image'],
    ['HEADLINE', 'Text'],
    ['BODY', 'Text'],
    ['ADVERTISER', 'Text'],
    ['CALL_TO_ACTION', 'Text'],
  ]) {
    assert.match(
      nativeAdCardSource,
      new RegExp(
        `<NativeAsset assetType=\\{NativeAssetType\\.${assetType}\\}>\\s*<${directChild}\\b`,
      ),
    );
  }
  assert.match(
    nativeAdCardSource,
    /accessibilityLabel=\{copy\.ctaAccessibilityLabel\(nativeAd\.callToAction\)\}/,
  );
  assert.match(nativeAdCardSource, /minHeight:\s*space\[6\]/);
  assert.match(nativeAdCardSource, /NativeMediaView/);
  assert.match(nativeAdCardSource, /getPlatformAdUnitId\('results_native', Platform\.OS\)/);
  assert.match(nativeAdCardSource, /requestNonPersonalizedAdsOnly/);
  assert.match(nativeAdCardSource, /\.destroy\(\)/);
  assert.match(
    nativeAdCardSource,
    /shouldShowAd\(\s*'results_native'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,?\s*\)/,
  );
  assert.doesNotMatch(nativeAdCardSource, /createPlaceholderNativeAd|Sponsored study placement/);

  assert.match(webAdCardSource, /shouldShowAd\('results_native', resolvedEntitlements\)/);
  assert.match(
    webAdCardSource,
    /<Card accessibilityHint=\{copy\.hint\} accessibilityLabel=\{copy\.accessibilityLabel\}>/,
  );
  assert.doesNotMatch(webAdCardSource, /react-native-google-mobile-ads|NativeAdView/);
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

test('rewarded extra exam ad copy uses Swedish practice-exam wording', () => {
  const { adBannerCopy } = loadTs('lib/monetization/adCopy.ts');
  const adCopySource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/adCopy.ts'), 'utf8');
  const placementCtaSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/RemoveAdsPlacementCta.tsx'),
    'utf8',
  );
  const rewardedPlacementLabel = adBannerCopy.sv.placementLabels.rewarded_extra_exam;
  const liveAccessibilityLabel = adBannerCopy.sv.accessibilityLabel(
    rewardedPlacementLabel,
    adBannerCopy.sv.liveStatus,
  );
  const testAccessibilityLabel = adBannerCopy.sv.accessibilityLabel(
    rewardedPlacementLabel,
    adBannerCopy.sv.testStatus,
  );
  const placementCtaTitle = `Ta bort annonser vid ${rewardedPlacementLabel.toLowerCase()}`;

  for (const renderedCopy of [
    rewardedPlacementLabel,
    liveAccessibilityLabel,
    testAccessibilityLabel,
    placementCtaTitle,
  ]) {
    assert.match(renderedCopy, /övningsprov/i);
    assert.doesNotMatch(renderedCopy, /\bextra prov\b|\bprov\b|\bprovet\b/i);
  }

  assert.equal(rewardedPlacementLabel, 'Annons för extra övningsprov');
  assert.match(placementCtaSource, /adBannerCopy\[language\]\.placementLabels\[placement\]/);
  assert.match(placementCtaSource, /copy\.title\(placementLabel\)/);
  assert.doesNotMatch(adCopySource, /\bAnnons för extra prov\b|\bextra prov\b/i);
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
    completedMockExamSessionIdsByDate: {},
    completedMockExamsToday: 0,
    dateKey: '2026-05-17',
    rewardedExtraExamCredits: 0,
  });

  await recordStoredMockExamCompletion({
    date: '2026-05-17T10:00:00.000Z',
    sessionId: 'mock-exam-1',
    storage,
  });
  const duplicateSnapshot = await recordStoredMockExamCompletion({
    date: '2026-05-17T10:05:00.000Z',
    sessionId: 'mock-exam-1',
    storage,
  });
  const todaySnapshot = await recordStoredMockExamCompletion({
    date: '2026-05-17T11:00:00.000Z',
    sessionId: 'mock-exam-2',
    storage,
  });

  assert.equal(duplicateSnapshot.completedMockExamsToday, 1);
  assert.equal(todaySnapshot.completedMockExamsToday, 2);
  assert.equal(todaySnapshot.completedMockExamsByDate['2026-05-17'], 2);
  assert.deepEqual(todaySnapshot.completedMockExamSessionIdsByDate['2026-05-17'], [
    'mock-exam-1',
    'mock-exam-2',
  ]);

  const tomorrowSnapshot = await getStoredMockExamAccess({
    date: '2026-05-18T08:00:00.000Z',
    storage,
  });

  assert.equal(tomorrowSnapshot.completedMockExamsToday, 0);
  assert.equal(tomorrowSnapshot.completedMockExamsByDate['2026-05-17'], 2);
  assert.deepEqual(tomorrowSnapshot.completedMockExamSessionIdsByDate['2026-05-17'], [
    'mock-exam-1',
    'mock-exam-2',
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
      invalid: 9,
    },
    completedMockExamSessionIdsByDate: {
      '2026-05-17': [' mock-exam-legacy ', '', 'mock-exam-legacy', 'bad/session'],
      invalid: ['mock-exam-invalid-date'],
    },
    rewardedExtraExamCredits: 1.9,
  });
  const seededSnapshot = await getStoredMockExamAccess({
    date: '2026-05-17T09:00:00.000Z',
    storage: seededStorage,
  });

  assert.deepEqual(seededSnapshot.completedMockExamsByDate, { '2026-05-17': 2 });
  assert.deepEqual(seededSnapshot.completedMockExamSessionIdsByDate, {
    '2026-05-17': ['mock-exam-legacy'],
  });
  assert.equal(seededSnapshot.rewardedExtraExamCredits, 1);

  const seededNewCompletionSnapshot = await recordStoredMockExamCompletion({
    date: '2026-05-17T09:15:00.000Z',
    sessionId: 'mock-exam-new',
    storage: seededStorage,
  });
  assert.equal(seededNewCompletionSnapshot.completedMockExamsToday, 3);
  assert.deepEqual(seededNewCompletionSnapshot.completedMockExamSessionIdsByDate['2026-05-17'], [
    'mock-exam-legacy',
    'mock-exam-new',
  ]);

  const invalidSessionStorage = createMemoryMockExamAccessStorage();
  await assert.rejects(
    () =>
      recordStoredMockExamCompletion({
        date: '2026-05-17T09:00:00.000Z',
        sessionId: '   ',
        storage: invalidSessionStorage,
      }),
    /valid sessionId/,
  );
  assert.equal(
    (
      await getStoredMockExamAccess({
        date: '2026-05-17T09:10:00.000Z',
        storage: invalidSessionStorage,
      })
    ).completedMockExamsToday,
    0,
  );

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
      sessionId: 'mock-exam-web-1',
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
  const defaultResult = await showRewardedExtraExamAd();
  const confirmedResult = await showRewardedExtraExamAd({
    confirmReward: () => true,
  });
  const rejectedResult = await showRewardedExtraExamAd({
    confirmReward: () => false,
  });
  const failedConfirmationResult = await showRewardedExtraExamAd({
    confirmReward: () => {
      throw new Error('preview did not complete');
    },
  });
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

  assert.deepEqual(defaultResult, { status: 'closed_without_reward' });
  assert.deepEqual(confirmedResult, {
    reward: {
      amount: 1,
      type: 'extra_mock_exam',
    },
    status: 'earned_reward',
  });
  assert.deepEqual(rejectedResult, { status: 'closed_without_reward' });
  assert.deepEqual(failedConfirmationResult, { status: 'closed_without_reward' });
  assert.deepEqual(removeAdsResult, { status: 'unavailable' });
  assert.deepEqual(disabledAdsResult, { status: 'unavailable' });
  assert.match(webRewardedAdSource, /shouldShowAd\(REWARDED_EXTRA_EXAM_PLACEMENT, entitlements\)/);
  assert.match(webRewardedAdSource, /confirmReward\?: RewardedExtraExamRewardConfirmation;/);
  assert.match(
    webRewardedAdSource,
    /rewardConfirmed = \(await confirmReward\?\.\(\)\) === true;[\s\S]*if \(!rewardConfirmed\) \{[\s\S]*return \{ status: 'closed_without_reward' \};[\s\S]*\}/,
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
  const {
    PRO_LIFETIME_ENTITLEMENTS,
    REMOVE_ADS_ENTITLEMENTS,
    hasAdsDisabled,
    hasProEntitlement,
    isPremiumUser,
  } = loadTs('lib/monetization/premium.ts');

  assert.equal(hasAdsDisabled(REMOVE_ADS_ENTITLEMENTS), true);
  assert.equal(isPremiumUser(REMOVE_ADS_ENTITLEMENTS), false);
  assert.equal(hasAdsDisabled(PRO_LIFETIME_ENTITLEMENTS), false);
  assert.equal(hasProEntitlement(PRO_LIFETIME_ENTITLEMENTS), true);
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
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, true);
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
  assert.equal(storedRestoreRecord.receiptValidationStatus, 'valid');
  assert.match(storedRestoreRecord.receiptValidatedAt, /^\d{4}-\d{2}-\d{2}T/);

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
    await buyRemoveAds({
      provider: createMockPurchaseProvider(),
      storage: webStorage,
    });

    const webStorageAfterReload = createWebPurchaseStorage();
    assert.equal(
      (await getPurchaseEntitlements({ storage: webStorageAfterReload })).adsDisabled,
      true,
    );

    await purchaseExports.setRemoveAdsEntitlement(false, { storage: webStorageAfterReload });
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
      receiptValidatedAt: new Date().toISOString(),
      receiptValidationStatus: 'valid',
      schemaVersion: 1,
      source: 'restore',
      transactionId: 'restore-remove-ads',
    }),
  );
  assert.equal((await getPurchaseEntitlements({ storage })).adsDisabled, false);
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
    REMOVE_ADS_STORAGE_KEY,
    buyRemoveAds,
    createMemoryPurchaseStorage,
    createMockPurchaseProvider,
    restoreRemoveAdsPurchase,
    setRemoveAdsEntitlement,
  } = loadTs('lib/monetization/purchases.ts');

  const failedPurchaseStorage = createMemoryPurchaseStorage();
  const failedPurchase = await buyRemoveAds({
    provider: createMockPurchaseProvider({ receiptValidationStatus: 'invalid' }),
    storage: failedPurchaseStorage,
  });

  assert.equal(failedPurchase.status, 'pending');
  assert.equal(failedPurchase.entitlements.adsDisabled, false);
  assert.equal(await failedPurchaseStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

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

  const failedRestoreStorage = createMemoryPurchaseStorage();
  const failedRestore = await restoreRemoveAdsPurchase({
    provider: createMockPurchaseProvider({ owned: true, receiptValidationStatus: 'invalid' }),
    storage: failedRestoreStorage,
  });

  assert.equal(failedRestore.status, 'not_found');
  assert.equal(failedRestore.entitlements.adsDisabled, false);
  assert.equal(await failedRestoreStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);

  const directGrantStorage = createMemoryPurchaseStorage();
  const directGrant = await setRemoveAdsEntitlement(true, { storage: directGrantStorage });

  assert.equal(directGrant.adsDisabled, false);
  assert.equal(await directGrantStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY), null);
});

test('remove-ads purchase cleanup failures do not replace primary outcomes', async () => {
  const {
    REMOVE_ADS_STORAGE_KEY,
    buyRemoveAds,
    createMemoryPurchaseStorage,
    createMockPurchaseProvider,
    getPurchaseEntitlements,
    restoreRemoveAdsPurchase,
  } = loadTs('lib/monetization/purchases.ts');

  const purchaseCleanupCalls = [];
  const purchasedStorage = createMemoryPurchaseStorage();
  const successfulPurchaseProvider = {
    ...createMockPurchaseProvider(),
    async disconnect() {
      purchaseCleanupCalls.push('disconnect');
      throw new Error('endConnection failed');
    },
  };
  const purchaseResult = await buyRemoveAds({
    provider: successfulPurchaseProvider,
    storage: purchasedStorage,
  });

  assert.equal(purchaseResult.status, 'purchased');
  assert.equal(purchaseResult.entitlements.adsDisabled, true);
  assert.equal((await getPurchaseEntitlements({ storage: purchasedStorage })).adsDisabled, true);
  assert.ok(await purchasedStorage.getItemAsync(REMOVE_ADS_STORAGE_KEY));
  assert.deepEqual(purchaseCleanupCalls, ['disconnect']);

  const restoreCleanupCalls = [];
  const restoredStorage = createMemoryPurchaseStorage();
  const successfulRestoreProvider = {
    ...createMockPurchaseProvider({ owned: true }),
    async disconnect() {
      restoreCleanupCalls.push('disconnect');
      throw new Error('endConnection failed');
    },
  };
  const restoreResult = await restoreRemoveAdsPurchase({
    provider: successfulRestoreProvider,
    storage: restoredStorage,
  });

  assert.equal(restoreResult.status, 'restored');
  assert.equal(restoreResult.entitlements.adsDisabled, true);
  assert.equal((await getPurchaseEntitlements({ storage: restoredStorage })).adsDisabled, true);
  assert.deepEqual(restoreCleanupCalls, ['disconnect']);

  const requestFailureCalls = [];
  const requestFailureProvider = {
    async connect() {
      requestFailureCalls.push('connect');
    },
    async disconnect() {
      requestFailureCalls.push('disconnect');
      throw new Error('endConnection failed');
    },
    async requestRemoveAdsPurchase() {
      requestFailureCalls.push('request');
      throw new Error('store request failed');
    },
    async restorePurchases() {
      return [];
    },
  };

  await assert.rejects(
    () =>
      buyRemoveAds({
        provider: requestFailureProvider,
        storage: createMemoryPurchaseStorage(),
      }),
    /store request failed/,
  );
  assert.deepEqual(requestFailureCalls, ['connect', 'request', 'disconnect']);

  const validationFailureCalls = [];
  const validationFailureProvider = {
    ...createMockPurchaseProvider(),
    async disconnect() {
      validationFailureCalls.push('disconnect');
      throw new Error('endConnection failed');
    },
    async validateRemoveAdsReceipt() {
      validationFailureCalls.push('validate');
      throw new Error('receipt validation failed');
    },
  };

  await assert.rejects(
    () =>
      buyRemoveAds({
        provider: validationFailureProvider,
        storage: createMemoryPurchaseStorage(),
      }),
    /receipt validation failed/,
  );
  assert.deepEqual(validationFailureCalls, ['validate', 'disconnect']);
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
  assert.match(paywallSource, /updateEntitlements\(result\.entitlements\)/);
  assert.match(paywallSource, /setStatus\(result\.status\)/);
  assert.match(paywallSource, /onEntitlementsChange/);
  assert.match(paywallSource, /adsDisabled/);
  assert.match(paywallSource, /bodyActive:/);
  assert.match(paywallSource, /bodyIdle: \(price\) =>/);
  assert.match(paywallSource, /Purchase confirmed\. Study ads are disabled on this device/);
  assert.match(paywallSource, /Köpet är bekräftat\. Studieannonser är avstängda/);
  assert.match(
    paywallSource,
    /\{adsDisabled \? copy\.bodyActive : copy\.bodyIdle\(REMOVE_ADS_PRICE_LABEL\)\}/,
  );
  assert.match(paywallSource, /Buy Remove Ads for \$\{price\}/);
  assert.match(paywallSource, /Köp Ta bort annonser för \$\{price\}/);
  assert.match(
    paywallSource,
    /\{!adsDisabled \? \(\s*<Button[\s\S]*copy\.buyAccessibilityLabel\(REMOVE_ADS_PRICE_LABEL\)[\s\S]*\) : null\}/,
  );
  assert.match(paywallSource, /accessibilityHint=\{copy\.buyAccessibilityHint\}/);
  assert.match(paywallSource, /Purchase removes ads after store confirmation/);
  assert.match(paywallSource, /Tidsatta övningsprov är redan annonsfria/);
  assert.match(paywallSource, /Provläget är redan annonsfritt/);
  assert.match(placementCtaSource, /Tidsatta övningsprov är redan annonsfria/);
  assert.doesNotMatch(placementCtaSource, /\bProv är redan annonsfria\b/);
  assert.doesNotMatch(placementCtaSource, /\b(?:prov|provet)\b.{0,48}\bannonsfri(?:tt|a)?\b/i);
  assert.doesNotMatch(paywallSource, /\bprov förblir annonsfria\b/i);
  assert.match(paywallSource, /Restore Remove Ads purchase/);
  assert.match(paywallSource, /Återställ köp av Ta bort annonser/);
  assert.match(paywallSource, /accessibilityHint=\{copy\.restoreAccessibilityHint\}/);
  assert.match(paywallSource, /same store account/);
  assert.match(paywallSource, /samma butikskonto/);
  assert.match(paywallSource, /status === 'restored' \? 'restored' : 'purchased'/);
  assert.doesNotMatch(paywallSource, /adsDisabled \? copy\.bodyIdle/);
  assert.doesNotMatch(paywallSource, /activeAction !== null \|\| adsDisabled/);
  assert.doesNotMatch(paywallSource, /ads are deferred|RevenueCat can be added/i);
  assert.match(homeSource, /import \{ PremiumBanner \}/);
  assert.match(homeSource, /entitlementsReady: monetizationEntitlementsReady/);
  assert.match(
    homeSource,
    /monetizationEntitlementsReady && !monetizationEntitlements\.adsDisabled/,
  );
  assert.match(
    homeSource,
    /\{monetizationEntitlementsReady \? \([\s\S]*<PremiumBanner[\s\S]*entitlements=\{monetizationEntitlements\}[\s\S]*onEntitlementsChange=\{setMonetizationEntitlements\}[\s\S]*runtimeOptions=\{purchaseRuntime\}[\s\S]*\/>[\s\S]*\) : null\}[\s\S]*<AdBanner placement="home_banner" \/>/,
  );
  assert.doesNotMatch(homeSource, /<AdBanner entitlements=\{monetizationEntitlements\}/);
  assert.match(profileSource, /useRemoveAdsEntitlements/);
  assert.match(profileSource, /entitlementsReady/);
  assert.match(
    profileSource,
    /\{entitlementsReady \? \(\s*<PremiumBanner[\s\S]*entitlements=\{monetizationEntitlements\}/,
  );
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
  assert.match(pricingWedgeSource, /tidsatta övningsprov är alltid annonsfria/);
  assert.match(paywallSource, /REMOVE_ADS_PRICE_LABEL/);
  assert.match(homeSource, /<PricingWedge[\s\S]*language=\{language\}[\s\S]*\/>/);
  assert.doesNotMatch(pricingWedgeSource, /29 kr/);
  assert.doesNotMatch(pricingWedgeSource, /\bprovet är alltid annonsfritt\b/i);
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
  assert.doesNotMatch(
    mobileConsentSource,
    /Promise\.all\(\s*\[[\s\S]*resolveTrackingTransparencyStatus[\s\S]*resolveUmpConsentStatus/,
  );
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
  assert.deepEqual(calls, ['att:get', 'att:request', 'ump', 'ads:init']);

  const sequencedCalls = [];
  let attFinished = false;
  await initializeGoogleMobileAdsAfterConsent({
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    realAdsEnabled: true,
    runtime: {
      async gatherUmpConsent() {
        sequencedCalls.push(`ump:${attFinished ? 'after-att' : 'before-att'}`);
        return { canRequestAds: true, status: 'OBTAINED' };
      },
      async getTrackingPermissionsAsync() {
        sequencedCalls.push('att:get:start');
        await Promise.resolve();
        sequencedCalls.push('att:get:end');
        return { status: 'undetermined' };
      },
      async initializeGoogleMobileAds() {
        sequencedCalls.push('ads:init');
      },
      platform: 'ios',
      async requestTrackingPermissionsAsync() {
        sequencedCalls.push('att:request:start');
        await Promise.resolve();
        sequencedCalls.push('att:request:end');
        attFinished = true;
        return { status: 'denied' };
      },
    },
  });

  assert.deepEqual(sequencedCalls, [
    'att:get:start',
    'att:get:end',
    'att:request:start',
    'att:request:end',
    'ump:after-att',
    'ads:init',
  ]);

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
  assert.match(examSource, /recordExamCompletion\(examSessionId\)/);
  assert.match(examSource, /handleStartAccessibleExam/);
  assert.match(examSource, /Unlock extra exam/);
  assert.match(accessHookSource, /getMockExamAccessDecision/);
  assert.match(accessHookSource, /recordStoredMockExamCompletion/);
  assert.match(accessHookSource, /recordStoredMockExamCompletion\(\{ sessionId, storage \}\)/);
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
    '/privacy',
    '/sources',
    '/support',
    '/terms',
  ]);
  assert.match(entitlementHookSource, /getPurchaseEntitlements/);
  assert.match(entitlementHookSource, /createWebPurchaseStorage/);
  assert.match(entitlementHookSource, /Platform\.OS !== 'web'/);
});
