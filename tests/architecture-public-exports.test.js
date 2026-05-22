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
  'components/monetization/RemoveAdsPlacementCta.tsx': ['RemoveAdsPlacementCta'],
  'data/chapters.ts': ['chapters'],
  'data/questions.ts': ['questions'],
  'data/glossary.ts': ['glossaryTerms'],
  'data/mockExamConfig.ts': ['defaultMockExamConfig'],
  'lib/quiz/examGenerator.ts': [
    'buildExamChapterBreakdownItems',
    'buildExamReviewItems',
    'formatExamTime',
    'getMockExamTimerUrgency',
    'generateExam',
    'MockExamTimerUrgency',
    'scoreExam',
    'shouldAutoSubmitExam',
  ],
  'lib/quiz/practiceFlow.ts': [
    'getChapterQuizSessionId',
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
  'lib/audio/speak.ts': [
    'buildAnswerFeedbackSpeechText',
    'buildQuestionSpeechText',
    'speakSwedish',
    'stopSpeech',
  ],
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
  'lib/theme/index.ts': ['colors', 'motion', 'radius', 'shadows', 'space', 'typography'],
  'lib/theme/colors.ts': ['ColorToken', 'colors'],
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

function exportedNamePattern(exportName) {
  return new RegExp(
    `export\\s+(?:declare\\s+)?(?:async\\s+)?(?:function|const|let|var|type|interface|class)\\s+${exportName}\\b|export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`,
  );
}

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

test('component barrel does not advertise the retired Screen wrapper', () => {
  const componentBarrel = readText('components/index.ts');

  assert.equal(
    fs.existsSync(path.join(repoRoot, 'components/Screen.tsx')),
    false,
    'components/Screen.tsx should stay removed; components/ui/ScreenShell.tsx is the reachable screen wrapper',
  );
  assert.doesNotMatch(
    componentBarrel,
    /export\s+\*\s+from ['"]\.\/Screen['"]/,
    'components/index.ts should not re-export the retired Screen wrapper',
  );
});
