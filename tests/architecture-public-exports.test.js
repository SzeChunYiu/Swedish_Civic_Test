const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const architectureExpectedExports = {
  'components/Surface.tsx': ['Surface', 'SurfaceElevation', 'SurfaceProps', 'SurfaceTone'],
  'components/compliance/ComplianceLinks.tsx': ['ComplianceLinks'],
  'components/compliance/LegalPage.tsx': ['LegalPage', 'LegalSection'],
  'components/ui/Badge.tsx': ['Badge'],
  'components/ui/Button.tsx': ['Button'],
  'components/ui/Card.tsx': ['Card'],
  'components/ui/MetricCard.tsx': ['MetricCard'],
  'components/ui/ProgressBar.tsx': ['ProgressBar'],
  'components/ui/ScreenShell.tsx': ['ScreenShell', 'SectionHeader'],
  'components/quiz/QuestionCard.tsx': ['QuestionCard'],
  'components/quiz/AnswerOption.tsx': ['AnswerOption'],
  'components/quiz/CelebrationBurst.tsx': ['CelebrationBurst'],
  'components/quiz/ExplanationPanel.tsx': ['ExplanationPanel'],
  'components/quiz/QuestionDisclaimer.tsx': ['QuestionDisclaimer'],
  'components/quiz/UHRReferenceCard.tsx': ['UHRReferenceCard'],
  'components/learning/ChapterCard.tsx': ['ChapterCard'],
  'components/learning/Flashcard.tsx': ['Flashcard'],
  'components/learning/AudioButton.tsx': ['AudioButton'],
  'components/monetization/AdBanner.native.tsx': ['AdBanner'],
  'components/monetization/AdBanner.tsx': ['AdBanner'],
  'components/monetization/LaunchPopupAd.native.tsx': ['LaunchPopupAd'],
  'components/monetization/LaunchPopupAd.tsx': ['LaunchPopupAd'],
  'components/monetization/NativeAdCard.tsx': ['NativeAdCard'],
  'components/monetization/PremiumBanner.tsx': ['PremiumBanner'],
  'data/chapters.ts': ['chapters'],
  'data/questions.ts': ['questions'],
  'data/glossary.ts': ['glossaryTerms'],
  'data/mockExamConfig.ts': ['defaultMockExamConfig'],
  'lib/quiz/examGenerator.ts': [
    'buildExamChapterBreakdownItems',
    'buildExamReviewItems',
    'formatExamTime',
    'generateExam',
    'scoreExam',
    'shouldAutoSubmitExam',
  ],
  'lib/quiz/practiceFlow.ts': [
    'getChapterQuizSessionId',
    'getCompletedQuestionIdsForQuestionBank',
    'getFirstQuestionForChapter',
    'getPracticeQuestionForSession',
  ],
  'lib/quiz/practiceSessionStore.ts': ['usePracticeSessionStore'],
  'lib/quiz/scoring.ts': ['scoreAnswers'],
  'lib/quiz/answerValidation.ts': ['isCorrectAnswer', 'getAnswerOptionFeedback'],
  'lib/quiz/answerOptionShuffle.ts': [
    'ANSWER_SHUFFLE_MAX_CORRECT_POSITION_SHARE',
    'answerShuffleDistributionIsBalanced',
    'shuffleQuestionOptionsForSession',
    'summarizeAnswerShuffleDistribution',
  ],
  'lib/learning/badges.ts': ['Badge', 'badgeCatalog', 'deriveBadges'],
  'lib/learning/spacedRepetition.ts': ['spacedRepetitionSchedule', 'getNextReviewAt'],
  'lib/learning/mastery.ts': ['calculateChapterMastery', 'calculateMastery', 'findWeakChapterIds'],
  'lib/learning/streaks.ts': ['getLocalDateKey', 'calculateStreak'],
  'lib/learning/xp.ts': ['calculateAnswerXp', 'calculateLevel', 'calculateQuizCompletionXp'],
  'lib/storage/progressStore.ts': ['QuestionProgress', 'useProgressStore'],
  'lib/storage/mistakeReviewStore.ts': ['MistakeAnswerReview', 'useMistakeReviewStore'],
  'lib/storage/settingsStore.ts': ['AppLanguage', 'useSettingsStore'],
  'lib/audio/speak.ts': ['buildQuestionSpeechText', 'speakSwedish', 'stopSpeech'],
  'lib/content/derivedQuestions.ts': ['derivePublishedQuestions', 'publishQuestions'],
  'lib/monetization/ads.ts': [
    'adsConfig',
    'getAdUnit',
    'getPlatformAdUnitId',
    'shouldShowAd',
    'shouldShowLaunchPopupAd',
    'shouldSuppressLaunchPopupAdForPath',
  ],
  'lib/monetization/adCopy.ts': ['adBannerCopy', 'nativeAdCardCopy'],
  'lib/monetization/consent.ts': [
    'consentConfig',
    'getAdConsentDecision',
    'getAdSdkInitializationDecision',
  ],
  'lib/monetization/mobileAdsConsent.ts': [
    'collectMobileAdsConsentState',
    'createInitialAdConsentState',
    'createNativeMobileAdsConsentRuntime',
    'initializeGoogleMobileAdsAfterConsent',
    'mapTrackingTransparencyStatus',
    'mapUmpConsentStatus',
    'normalizeAdConsentPlatform',
  ],
  'lib/monetization/premium.ts': [
    'FREE_ENTITLEMENTS',
    'PREMIUM_ENTITLEMENTS',
    'REMOVE_ADS_ENTITLEMENTS',
    'hasAdsDisabled',
    'isPremiumUser',
    'premiumConfig',
  ],
  'lib/monetization/purchases.ts': [
    'REMOVE_ADS_PRICE_LABEL',
    'REMOVE_ADS_PRODUCT_ID',
    'buyRemoveAds',
    'createMemoryPurchaseStorage',
    'createMockPurchaseProvider',
    'createNativePurchaseProvider',
    'createSecureStorePurchaseStorage',
    'createWebPurchaseStorage',
    'getPurchaseEntitlements',
    'restoreRemoveAdsPurchase',
    'setRemoveAdsEntitlement',
  ],
  'lib/monetization/releasePolicy.ts': [
    'isReleaseMonetizationPolicyReady',
    'releaseMonetizationPolicy',
  ],
  'lib/monetization/rewardedAd.native.ts': ['showRewardedExtraExamAd'],
  'lib/monetization/rewardedAd.ts': ['showRewardedExtraExamAd'],
  'lib/monetization/rewardedExam.ts': [
    'FREE_MOCK_EXAM_DAILY_LIMIT',
    'MOCK_EXAM_ACCESS_STORAGE_KEY',
    'REWARDED_EXTRA_EXAM_PLACEMENT',
    'clearStoredMockExamAccess',
    'consumeRewardedExtraExamCredit',
    'consumeStoredRewardedExtraExamCredit',
    'createMemoryMockExamAccessStorage',
    'createSecureStoreMockExamAccessStorage',
    'createWebMockExamAccessStorage',
    'getMockExamAccessDateKey',
    'getMockExamAccessDecision',
    'getStoredMockExamAccess',
    'grantRewardedExtraExamCredit',
    'grantStoredRewardedExtraExamCredit',
    'recordStoredMockExamCompletion',
  ],
  'lib/monetization/useMobileAdsConsent.ts': ['useMobileAdsConsent'],
  'lib/monetization/useMockExamAccess.ts': ['useMockExamAccess'],
  'lib/monetization/useRemoveAdsEntitlements.ts': [
    'createDefaultPurchaseRuntimeOptions',
    'useRemoveAdsEntitlements',
    'useResolvedAdEntitlements',
  ],
  'lib/localization/strings.ts': ['strings'],
  'lib/localization/language.ts': ['SupportedLanguage', 'supportedLanguages'],
  'lib/theme/index.ts': [
    'colors',
    'flagColors',
    'SWEDISH_FLAG_BLUE',
    'SWEDISH_FLAG_GOLD',
    'motion',
    'radius',
    'shadows',
    'space',
    'typography',
  ],
  'lib/theme/colors.ts': ['ColorToken', 'colors'],
  'lib/theme/flag.ts': ['flagColors', 'SWEDISH_FLAG_BLUE', 'SWEDISH_FLAG_GOLD'],
  'lib/theme/motion.ts': ['motion'],
  'lib/theme/radius.ts': ['radius'],
  'lib/theme/shadows.ts': ['shadows'],
  'lib/theme/spacing.ts': ['space'],
  'lib/theme/typography.ts': ['typography'],
  'lib/scaffold/architectureManifest.ts': [
    'ArchitectureAnswerShuffleRuntimeFilePath',
    'ArchitectureAudioRuntimeFilePath',
    'ArchitectureComplianceSupportFilePath',
    'ArchitectureDesignSystemSupportFilePath',
    'ArchitectureLearningProgressRuntimeFilePath',
    'ArchitectureMistakeReviewRuntimeFilePath',
    'ArchitectureMonetizationRuntimeFilePath',
    'ArchitectureProfileSettingsRuntimeFilePath',
    'ArchitectureQuestionLanguageRuntimeFilePath',
    'ArchitectureQuizFeedbackRuntimeFilePath',
    'ArchitectureRouterShellRuntimeFilePath',
    'ArchitectureScaffoldArea',
    'ArchitectureScaffoldDirectory',
    'ArchitectureScaffoldFile',
    'ArchitectureScaffoldFilePath',
    'ArchitectureSupplementalRouteFilePath',
    'ArchitectureThemeRuntimeFilePath',
    'architectureAnswerShuffleRuntimeFiles',
    'architectureAudioRuntimeFiles',
    'architectureComplianceSupportFiles',
    'architectureDesignSystemSupportFiles',
    'architectureLearningProgressRuntimeFiles',
    'architectureMistakeReviewRuntimeFiles',
    'architectureMonetizationRuntimeFiles',
    'architectureProfileSettingsRuntimeFiles',
    'architectureQuestionLanguageRuntimeFiles',
    'architectureQuizFeedbackRuntimeFiles',
    'architectureRouterShellRuntimeFiles',
    'architectureScaffoldDirectories',
    'architectureScaffoldFiles',
    'architectureSupplementalRouteFiles',
    'architectureTabRouteFiles',
    'architectureThemeRuntimeFiles',
  ],
  'lib/scaffold/routerShellManifest.ts': [
    'ExpoRouterShellFile',
    'ExpoRouterShellFilePath',
    'ExpoRouterShellRecoveryHref',
    'ExpoRouterShellRole',
    'ExpoRouterStandaloneHeaderHiddenRoute',
    'expoRouterShellContract',
    'expoRouterShellFiles',
    'expoRouterShellRecoveryHrefs',
    'expoRouterStandaloneHeaderHiddenRoutes',
  ],
  'types/content.ts': ['Chapter', 'PracticeQuestion', 'UHRReference'],
  'types/progress.ts': ['QuizSession', 'UserProgress'],
  'types/monetization.ts': [
    'AdPlacement',
    'AdUnitConfig',
    'MonetizationState',
    'PremiumEntitlements',
  ],
};

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function pathExists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function listFiles(relativePath) {
  return fs
    .readdirSync(path.join(repoRoot, relativePath), { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(relativePath, entry.name);
      if (entry.isDirectory()) return listFiles(entryPath);
      return entryPath;
    });
}

function exportedNamePattern(exportName) {
  return new RegExp(
    `export\\s+(?:declare\\s+)?(?:async\\s+)?(?:function|const|let|var|type|interface|class)\\s+${exportName}\\b|export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`,
  );
}

function rootBarrelExportSpecifiers(source) {
  return [...source.matchAll(/^export\s+\*\s+from\s+['"]([^'"]+)['"];$/gm)].map(
    (match) => match[1],
  );
}

function resolveComponentExportTarget(exportSpecifier) {
  const relativePath = path.posix.normalize(
    path.posix.join('components', exportSpecifier.replace(/^\.\//, '')),
  );
  const candidates = [`${relativePath}.tsx`, `${relativePath}.ts`];
  const targetPath = candidates.find((candidate) => pathExists(candidate));
  assert.ok(targetPath, `${exportSpecifier} should resolve to a component source file`);
  return targetPath;
}

function sourceFilesForRootBarrelReachability() {
  return ['app', 'components']
    .filter(pathExists)
    .flatMap(listFiles)
    .filter((relativePath) => /\.(?:ts|tsx)$/.test(relativePath))
    .filter((relativePath) => relativePath !== 'components/index.ts');
}

function resolveImportSpecifier(importerPath, importSpecifier) {
  if (!importSpecifier.startsWith('.')) return null;
  const basePath = path.posix.normalize(
    path.posix.join(path.posix.dirname(importerPath), importSpecifier),
  );
  const candidates = [
    `${basePath}.tsx`,
    `${basePath}.ts`,
    `${basePath}/index.tsx`,
    `${basePath}/index.ts`,
  ];
  return candidates.find((candidate) => pathExists(candidate)) || null;
}

function fileImportsTarget(importerPath, targetPath) {
  const source = readText(importerPath);
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].some((match) => {
    const resolvedPath = resolveImportSpecifier(importerPath, match[1]);
    return resolvedPath === targetPath;
  });
}

const allowedRootBarrelFoundationExports = {
  'components/QuestionNavigator.tsx': {
    rationale:
      'QuestionNavigator is a public exam-navigation foundation kept for the queued exam integration.',
    focusedTests: [
      {
        path: 'scripts/accessibility-labels.test.js',
        pattern: /QuestionNavigator tabs keep token-sized touch targets/,
      },
    ],
  },
};

test('architecture scaffold files expose expected public exports', () => {
  const missingExports = Object.entries(architectureExpectedExports).flatMap(
    ([relativePath, exportNames]) => {
      const source = readText(relativePath);

      return exportNames
        .filter((exportName) => !exportedNamePattern(exportName).test(source))
        .map((exportName) => `${relativePath}:${exportName}`);
    },
  );

  assert.deepEqual(missingExports, []);
});

test('root component barrel does not export retired unreachable primitives', () => {
  const componentBarrel = readText('components/index.ts');
  const retiredPrimitivePaths = ['components/ChapterRow.tsx', 'components/Screen.tsx'];
  const retiredPrimitiveExports = ['ChapterRow', 'Screen'];

  for (const relativePath of retiredPrimitivePaths) {
    assert.equal(pathExists(relativePath), false);
  }

  for (const exportName of retiredPrimitiveExports) {
    assert.doesNotMatch(componentBarrel, new RegExp(`['"]\\./${exportName}['"]`));
    assert.doesNotMatch(componentBarrel, new RegExp(`\\b${exportName}\\b`));
  }
});

test('mock exam draft primitives are not public exports unless the Exam route renders them', () => {
  const componentBarrel = readText('components/index.ts');
  const examRoute = readText('app/(tabs)/exam.tsx');

  for (const componentName of ['MockExamStatusBar', 'MockExamConfigPanel']) {
    const renderedByExamRoute = new RegExp(`\\b${componentName}\\b`).test(examRoute);
    const exportedByRootBarrel = new RegExp(
      `['"]\\./${componentName}['"]|\\b${componentName}\\b`,
    ).test(componentBarrel);

    assert.ok(
      renderedByExamRoute || !exportedByRootBarrel,
      `${componentName} must be rendered by app/(tabs)/exam.tsx before root export`,
    );
  }
});

test('root component barrel exports are reachable or explicitly allowed foundations', () => {
  const componentBarrel = readText('components/index.ts');
  const sourceFiles = sourceFilesForRootBarrelReachability();
  const unreachableExports = [];

  for (const exportSpecifier of rootBarrelExportSpecifiers(componentBarrel)) {
    const targetPath = resolveComponentExportTarget(exportSpecifier);
    const hasConsumer = sourceFiles
      .filter((sourcePath) => sourcePath !== targetPath)
      .some((sourcePath) => fileImportsTarget(sourcePath, targetPath));
    if (hasConsumer) continue;

    const allowedFoundation = allowedRootBarrelFoundationExports[targetPath];
    if (allowedFoundation) {
      assert.ok(allowedFoundation.rationale.trim().length >= 40);
      for (const focusedTest of allowedFoundation.focusedTests) {
        assert.match(
          readText(focusedTest.path),
          focusedTest.pattern,
          `${targetPath} allowlist should point at focused test coverage`,
        );
      }
      continue;
    }

    unreachableExports.push(`${exportSpecifier} -> ${targetPath}`);
  }

  assert.deepEqual(unreachableExports, []);
});
