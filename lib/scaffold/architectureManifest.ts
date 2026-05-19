export type ArchitectureScaffoldArea = 'app' | 'components' | 'data' | 'lib' | 'types';

export type ArchitectureScaffoldFile = {
  readonly file: string;
  readonly area: ArchitectureScaffoldArea;
  readonly purpose: string;
};

export const architectureScaffoldDirectories = [
  'app',
  'components',
  'data',
  'lib',
  'types',
] as const satisfies readonly ArchitectureScaffoldArea[];

export const architectureProductCoverageRoots = ['app', 'components', 'lib'] as const;

export const architectureTabRouteFiles = [
  'app/(tabs)/home.tsx',
  'app/(tabs)/learn.tsx',
  'app/(tabs)/practice.tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/(tabs)/profile.tsx',
] as const;

export const architectureSupplementalRouteFiles = [
  'app/+not-found.tsx',
  'app/disclaimer.tsx',
  'app/privacy.tsx',
  'app/sources.tsx',
  'app/support.tsx',
  'app/terms.tsx',
] as const;

export const architectureRouterShellRuntimeFiles = [
  'app/index.tsx',
  'app/_layout.tsx',
  'app/(tabs)/_layout.tsx',
  'app/search.tsx',
  'app/dashboard.tsx',
  'app/+not-found.tsx',
  'app/+html.tsx',
  'app/+native-intent.ts',
  'lib/scaffold/routerShellManifest.ts',
] as const;

export const architectureScaffoldToolingFiles = [
  'lib/scaffold/architectureManifest.ts',
  'scripts/architecture-scaffold.test.js',
  'tests/architecture-public-exports.test.js',
] as const;

export const architectureAppConfigRuntimeFiles = [
  'app.json',
  'package.json',
  'assets/icon.png',
  'assets/adaptive-icon.png',
  'assets/splash-icon.png',
  'scripts/app-assets.test.js',
  'tests/content-app-config-schema.test.js',
] as const;

export const architectureComplianceSupportFiles = [
  'components/compliance/ComplianceLinks.tsx',
  'components/compliance/LegalPage.tsx',
] as const;

export const architectureLegalRouteRuntimeFiles = [
  'components/compliance/ComplianceLinks.tsx',
  'components/compliance/LegalPage.tsx',
  'lib/storage/settingsStore.ts',
  'lib/theme/index.ts',
  'app/disclaimer.tsx',
  'app/privacy.tsx',
  'app/sources.tsx',
  'app/support.tsx',
  'app/terms.tsx',
  'app/(tabs)/profile.tsx',
  'app/onboarding.tsx',
  'app/settings.tsx',
] as const;

export const architectureRouteCopyRuntimeFiles = [
  'lib/localization/language.ts',
  'lib/storage/settingsStore.ts',
  'components/ui/ScreenShell.tsx',
  'components/compliance/LegalPage.tsx',
  'app/(tabs)/home.tsx',
  'app/(tabs)/learn.tsx',
  'app/(tabs)/practice.tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/(tabs)/profile.tsx',
  'app/chapter/[chapterId].tsx',
  'app/quiz/[sessionId].tsx',
  'app/settings.tsx',
  'app/onboarding.tsx',
  'app/disclaimer.tsx',
  'app/privacy.tsx',
  'app/sources.tsx',
  'app/support.tsx',
  'app/terms.tsx',
] as const;

export const architectureDesignSystemSupportFiles = [
  'components/Surface.tsx',
  'components/ui/Badge.tsx',
  'components/ui/MetricCard.tsx',
  'components/ui/ScreenShell.tsx',
] as const;

export const architectureSharedUiRuntimeFiles = [
  'components/Surface.tsx',
  'components/ui/Badge.tsx',
  'components/ui/Button.tsx',
  'components/ui/Card.tsx',
  'components/ui/MetricCard.tsx',
  'components/ui/ProgressBar.tsx',
  'components/ui/ScreenShell.tsx',
  'lib/theme/index.ts',
] as const;

export const architectureThemeRuntimeFiles = [
  'lib/theme/index.ts',
  'lib/theme/colors.ts',
  'lib/theme/flag.ts',
  'lib/theme/motion.ts',
  'lib/theme/radius.ts',
  'lib/theme/shadows.ts',
  'lib/theme/spacing.ts',
  'lib/theme/typography.ts',
] as const;

export const architectureAudioRuntimeFiles = [
  'lib/audio/speak.ts',
  'components/learning/AudioButton.tsx',
  'lib/storage/settingsStore.ts',
  'app/settings.tsx',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
] as const;

export const architectureAnswerShuffleRuntimeFiles = [
  'lib/quiz/answerOptionShuffle.ts',
  'lib/quiz/practiceSessionStore.ts',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'lib/quiz/examGenerator.ts',
] as const;

export const architectureAnswerShuffleReviewRuntimeFiles = [
  'lib/quiz/answerOptionShuffle.ts',
  'lib/quiz/examGenerator.ts',
  'lib/storage/mistakeReviewStore.ts',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
] as const;

export const architectureQuestionLanguageRuntimeFiles = [
  'lib/localization/language.ts',
  'lib/storage/settingsStore.ts',
  'lib/quiz/questionText.ts',
  'components/quiz/QuestionCard.tsx',
  'components/quiz/AnswerOption.tsx',
  'components/quiz/ExplanationPanel.tsx',
  'components/quiz/UHRReferenceCard.tsx',
  'components/learning/AudioButton.tsx',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'app/(tabs)/exam.tsx',
] as const;

export const architectureSourceCitationRuntimeFiles = [
  'lib/quiz/questionText.ts',
  'lib/audio/speak.ts',
  'components/quiz/QuestionCard.tsx',
  'components/quiz/QuestionDisclaimer.tsx',
  'components/quiz/UHRReferenceCard.tsx',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/chapter/[chapterId].tsx',
] as const;

export const architectureSourceCitationBoundaryRuntimeFiles = [
  'lib/quiz/questionText.ts',
  'lib/audio/speak.ts',
  'components/quiz/QuestionCard.tsx',
  'components/quiz/QuestionDisclaimer.tsx',
  'components/quiz/UHRReferenceCard.tsx',
] as const;

export const architectureQuestionSurfaceRuntimeFiles = [
  'components/quiz/AnswerOption.tsx',
  'components/quiz/ExplanationPanel.tsx',
  'components/quiz/QuestionCard.tsx',
  'components/quiz/QuestionDisclaimer.tsx',
  'components/quiz/UHRReferenceCard.tsx',
  'lib/quiz/answerValidation.ts',
  'lib/quiz/questionText.ts',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/chapter/[chapterId].tsx',
] as const;

export const architectureSettingsRuntimeFiles = [
  'lib/localization/language.ts',
  'lib/localization/strings.ts',
  'lib/storage/settingsStore.ts',
  'components/ui/Button.tsx',
  'components/ui/MetricCard.tsx',
  'components/ui/ScreenShell.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/profile.tsx',
  'app/onboarding.tsx',
  'app/settings.tsx',
] as const;

export const architectureSettingsPreferenceRuntimeFiles = [
  'lib/storage/settingsStore.ts',
  'app/settings.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/profile.tsx',
  'app/onboarding.tsx',
] as const;

export const architectureTabNavigationRuntimeFiles = [
  'app/(tabs)/_layout.tsx',
  'lib/storage/settingsStore.ts',
  'app/(tabs)/home.tsx',
  'app/(tabs)/learn.tsx',
  'app/(tabs)/practice.tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/(tabs)/profile.tsx',
] as const;

export const architectureSpeechRuntimeFiles = [
  'lib/audio/speak.ts',
  'lib/quiz/questionText.ts',
  'lib/storage/settingsStore.ts',
  'components/learning/AudioButton.tsx',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
] as const;

export const architecturePracticeFlowRuntimeFiles = [
  'lib/quiz/practiceFlow.ts',
  'lib/quiz/practiceSessionStore.ts',
  'app/(tabs)/practice.tsx',
  'app/(tabs)/learn.tsx',
  'app/chapter/[chapterId].tsx',
  'app/quiz/[sessionId].tsx',
] as const;

export const architectureMockExamRuntimeFiles = [
  'data/mockExamConfig.ts',
  'data/questions.ts',
  'data/chapters.ts',
  'lib/quiz/examGenerator.ts',
  'lib/quiz/questionText.ts',
  'lib/monetization/rewardedAd.native.ts',
  'lib/monetization/rewardedAd.ts',
  'lib/monetization/rewardedExam.ts',
  'lib/monetization/useMockExamAccess.ts',
  'components/quiz/ExplanationPanel.tsx',
  'components/quiz/QuestionDisclaimer.tsx',
  'components/quiz/UHRReferenceCard.tsx',
  'components/ui/ProgressBar.tsx',
  'app/(tabs)/exam.tsx',
] as const;

export const architectureContentDerivationRuntimeFiles = [
  'data/questions.ts',
  'data/additionalQuestions.ts',
  'lib/content/derivedQuestions.ts',
  'scripts/derived-content.test.js',
] as const;

export const architectureQuizFeedbackRuntimeFiles = [
  'components/quiz/AnswerOption.tsx',
  'components/quiz/ExplanationPanel.tsx',
  'components/quiz/UHRReferenceCard.tsx',
  'components/quiz/QuestionDisclaimer.tsx',
  'components/quiz/CelebrationBurst.tsx',
  'lib/quiz/answerValidation.ts',
  'lib/quiz/scoring.ts',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'app/(tabs)/exam.tsx',
] as const;

export const architectureMistakeReviewRuntimeFiles = [
  'lib/storage/mistakeReviewStore.ts',
  'lib/storage/progressStore.ts',
  'components/quiz/QuestionCard.tsx',
  'components/quiz/ExplanationPanel.tsx',
  'components/quiz/UHRReferenceCard.tsx',
  'components/quiz/QuestionDisclaimer.tsx',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'app/(tabs)/mistakes.tsx',
] as const;

export const architectureMonetizationRuntimeFiles = [
  'lib/monetization/adCopy.ts',
  'lib/monetization/ads.ts',
  'lib/monetization/consent.ts',
  'lib/monetization/mobileAdsConsent.ts',
  'lib/monetization/premium.ts',
  'lib/monetization/purchases.ts',
  'lib/monetization/releasePolicy.ts',
  'lib/monetization/rewardedAd.native.ts',
  'lib/monetization/rewardedAd.ts',
  'lib/monetization/rewardedExam.ts',
  'lib/monetization/useMobileAdsConsent.ts',
  'lib/monetization/useMockExamAccess.ts',
  'lib/monetization/useRemoveAdsEntitlements.ts',
  'components/monetization/AdBanner.native.tsx',
  'components/monetization/AdBanner.tsx',
  'components/monetization/LaunchPopupAd.native.tsx',
  'components/monetization/LaunchPopupAd.tsx',
  'components/monetization/NativeAdCard.tsx',
  'components/monetization/PremiumBanner.tsx',
  'app/_layout.tsx',
  'app/(tabs)/home.tsx',
  'app/(tabs)/learn.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/(tabs)/exam.tsx',
] as const;

export const architectureRemoveAdsRuntimeFiles = [
  'lib/monetization/premium.ts',
  'lib/monetization/purchases.ts',
  'lib/monetization/useRemoveAdsEntitlements.ts',
  'components/monetization/PremiumBanner.tsx',
  'components/monetization/AdBanner.tsx',
  'components/monetization/AdBanner.native.tsx',
  'components/monetization/NativeAdCard.tsx',
  'app/(tabs)/home.tsx',
  'app/(tabs)/profile.tsx',
] as const;

export const architectureLearningProgressRuntimeFiles = [
  'lib/learning/badges.ts',
  'lib/learning/mastery.ts',
  'lib/learning/spacedRepetition.ts',
  'lib/learning/streaks.ts',
  'lib/learning/xp.ts',
  'lib/storage/progressStore.ts',
  'components/learning/ChapterCard.tsx',
  'components/learning/Flashcard.tsx',
  'components/learning/AudioButton.tsx',
  'components/ui/ProgressBar.tsx',
  'app/(tabs)/home.tsx',
  'app/(tabs)/learn.tsx',
  'app/chapter/[chapterId].tsx',
] as const;

export const architectureProfileSettingsRuntimeFiles = [
  'app/(tabs)/profile.tsx',
  'app/settings.tsx',
  'lib/storage/settingsStore.ts',
  'lib/storage/progressStore.ts',
  'lib/learning/badges.ts',
  'lib/learning/streaks.ts',
  'lib/learning/xp.ts',
  'components/ui/Badge.tsx',
  'components/ui/Card.tsx',
  'components/ui/MetricCard.tsx',
  'components/ui/ScreenShell.tsx',
  'components/monetization/PremiumBanner.tsx',
  'components/compliance/ComplianceLinks.tsx',
] as const;

export const architectureScaffoldFiles = [
  {
    file: 'app/_layout.tsx',
    area: 'app',
    purpose: 'Root Expo Router stack, app shell, and global placements',
  },
  {
    file: 'app/index.tsx',
    area: 'app',
    purpose: 'Initial route redirect into the primary tab shell',
  },
  {
    file: 'app/onboarding.tsx',
    area: 'app',
    purpose: 'First-run learning setup route',
  },
  {
    file: 'app/(tabs)/_layout.tsx',
    area: 'app',
    purpose: 'Primary tab navigator scaffold',
  },
  {
    file: 'app/(tabs)/home.tsx',
    area: 'app',
    purpose: 'Home tab route required by the architecture',
  },
  {
    file: 'app/(tabs)/learn.tsx',
    area: 'app',
    purpose: 'Learn tab route required by the architecture',
  },
  {
    file: 'app/(tabs)/practice.tsx',
    area: 'app',
    purpose: 'Practice tab route required by the architecture',
  },
  {
    file: 'app/(tabs)/exam.tsx',
    area: 'app',
    purpose: 'Exam tab route required by the architecture',
  },
  {
    file: 'app/(tabs)/mistakes.tsx',
    area: 'app',
    purpose: 'Mistakes tab route required by the architecture',
  },
  {
    file: 'app/(tabs)/profile.tsx',
    area: 'app',
    purpose: 'Profile tab route required by the architecture',
  },
  {
    file: 'app/chapter/[chapterId].tsx',
    area: 'app',
    purpose: 'Chapter detail route for learning and quiz entry',
  },
  {
    file: 'app/quiz/[sessionId].tsx',
    area: 'app',
    purpose: 'Routed quiz session surface',
  },
  {
    file: 'app/settings.tsx',
    area: 'app',
    purpose: 'Settings route for local preferences',
  },
  {
    file: 'components/ui/Button.tsx',
    area: 'components',
    purpose: 'Shared button primitive',
  },
  {
    file: 'components/ui/Card.tsx',
    area: 'components',
    purpose: 'Shared card primitive',
  },
  {
    file: 'components/ui/ProgressBar.tsx',
    area: 'components',
    purpose: 'Shared progress indicator primitive',
  },
  {
    file: 'components/quiz/QuestionCard.tsx',
    area: 'components',
    purpose: 'Quiz prompt display component',
  },
  {
    file: 'components/quiz/AnswerOption.tsx',
    area: 'components',
    purpose: 'Quiz answer option component',
  },
  {
    file: 'components/quiz/ExplanationPanel.tsx',
    area: 'components',
    purpose: 'Quiz answer explanation component',
  },
  {
    file: 'components/quiz/UHRReferenceCard.tsx',
    area: 'components',
    purpose: 'Source reference display component',
  },
  {
    file: 'components/learning/ChapterCard.tsx',
    area: 'components',
    purpose: 'Chapter list item component',
  },
  {
    file: 'components/learning/Flashcard.tsx',
    area: 'components',
    purpose: 'Learning flashcard component',
  },
  {
    file: 'components/learning/AudioButton.tsx',
    area: 'components',
    purpose: 'Swedish text-to-speech trigger component',
  },
  {
    file: 'components/monetization/AdBanner.tsx',
    area: 'components',
    purpose: 'Ad banner placement component',
  },
  {
    file: 'components/monetization/PremiumBanner.tsx',
    area: 'components',
    purpose: 'Remove Ads and premium upsell component',
  },
  {
    file: 'data/chapters.ts',
    area: 'data',
    purpose: 'Bundled chapter metadata',
  },
  {
    file: 'data/questions.ts',
    area: 'data',
    purpose: 'Bundled published question bank',
  },
  {
    file: 'data/glossary.ts',
    area: 'data',
    purpose: 'Bundled glossary entries',
  },
  {
    file: 'data/mockExamConfig.ts',
    area: 'data',
    purpose: 'Mock exam generation defaults',
  },
  {
    file: 'lib/quiz/examGenerator.ts',
    area: 'lib',
    purpose: 'Mock exam generation and scoring helpers',
  },
  {
    file: 'lib/quiz/scoring.ts',
    area: 'lib',
    purpose: 'Quiz answer scoring helpers',
  },
  {
    file: 'lib/quiz/answerValidation.ts',
    area: 'lib',
    purpose: 'Quiz answer correctness and feedback helpers',
  },
  {
    file: 'lib/learning/spacedRepetition.ts',
    area: 'lib',
    purpose: 'Local review scheduling helpers',
  },
  {
    file: 'lib/learning/mastery.ts',
    area: 'lib',
    purpose: 'Chapter mastery calculation helpers',
  },
  {
    file: 'lib/learning/streaks.ts',
    area: 'lib',
    purpose: 'Local study streak helpers',
  },
  {
    file: 'lib/storage/progressStore.ts',
    area: 'lib',
    purpose: 'Local progress persistence store',
  },
  {
    file: 'lib/storage/settingsStore.ts',
    area: 'lib',
    purpose: 'Local settings persistence store',
  },
  {
    file: 'lib/audio/speak.ts',
    area: 'lib',
    purpose: 'Swedish speech runtime helpers',
  },
  {
    file: 'lib/monetization/ads.ts',
    area: 'lib',
    purpose: 'Ad placement and ad-unit decisions',
  },
  {
    file: 'lib/monetization/premium.ts',
    area: 'lib',
    purpose: 'Premium and Remove Ads entitlement decisions',
  },
  {
    file: 'lib/localization/strings.ts',
    area: 'lib',
    purpose: 'Localized app copy registry',
  },
  {
    file: 'lib/localization/language.ts',
    area: 'lib',
    purpose: 'Supported language metadata',
  },
  {
    file: 'types/content.ts',
    area: 'types',
    purpose: 'Content data contracts',
  },
  {
    file: 'types/progress.ts',
    area: 'types',
    purpose: 'Progress data contracts',
  },
  {
    file: 'types/monetization.ts',
    area: 'types',
    purpose: 'Monetization data contracts',
  },
] as const satisfies readonly ArchitectureScaffoldFile[];

export type ArchitectureScaffoldDirectory = (typeof architectureScaffoldDirectories)[number];
export type ArchitectureProductCoverageRoot = (typeof architectureProductCoverageRoots)[number];
export type ArchitectureScaffoldFilePath = (typeof architectureScaffoldFiles)[number]['file'];
export type ArchitectureSupplementalRouteFilePath =
  (typeof architectureSupplementalRouteFiles)[number];
export type ArchitectureRouterShellRuntimeFilePath =
  (typeof architectureRouterShellRuntimeFiles)[number];
export type ArchitectureScaffoldToolingFilePath = (typeof architectureScaffoldToolingFiles)[number];
export type ArchitectureAppConfigRuntimeFilePath =
  (typeof architectureAppConfigRuntimeFiles)[number];
export type ArchitectureComplianceSupportFilePath =
  (typeof architectureComplianceSupportFiles)[number];
export type ArchitectureLegalRouteRuntimeFilePath =
  (typeof architectureLegalRouteRuntimeFiles)[number];
export type ArchitectureRouteCopyRuntimeFilePath =
  (typeof architectureRouteCopyRuntimeFiles)[number];
export type ArchitectureDesignSystemSupportFilePath =
  (typeof architectureDesignSystemSupportFiles)[number];
export type ArchitectureSharedUiRuntimeFilePath = (typeof architectureSharedUiRuntimeFiles)[number];
export type ArchitectureThemeRuntimeFilePath = (typeof architectureThemeRuntimeFiles)[number];
export type ArchitectureAudioRuntimeFilePath = (typeof architectureAudioRuntimeFiles)[number];
export type ArchitectureAnswerShuffleRuntimeFilePath =
  (typeof architectureAnswerShuffleRuntimeFiles)[number];
export type ArchitectureAnswerShuffleReviewRuntimeFilePath =
  (typeof architectureAnswerShuffleReviewRuntimeFiles)[number];
export type ArchitectureQuestionLanguageRuntimeFilePath =
  (typeof architectureQuestionLanguageRuntimeFiles)[number];
export type ArchitectureSourceCitationRuntimeFilePath =
  (typeof architectureSourceCitationRuntimeFiles)[number];
export type ArchitectureSourceCitationBoundaryRuntimeFilePath =
  (typeof architectureSourceCitationBoundaryRuntimeFiles)[number];
export type ArchitectureQuestionSurfaceRuntimeFilePath =
  (typeof architectureQuestionSurfaceRuntimeFiles)[number];
export type ArchitectureSettingsRuntimeFilePath = (typeof architectureSettingsRuntimeFiles)[number];
export type ArchitectureSettingsPreferenceRuntimeFilePath =
  (typeof architectureSettingsPreferenceRuntimeFiles)[number];
export type ArchitectureTabNavigationRuntimeFilePath =
  (typeof architectureTabNavigationRuntimeFiles)[number];
export type ArchitectureSpeechRuntimeFilePath = (typeof architectureSpeechRuntimeFiles)[number];
export type ArchitecturePracticeFlowRuntimeFilePath =
  (typeof architecturePracticeFlowRuntimeFiles)[number];
export type ArchitectureMockExamRuntimeFilePath = (typeof architectureMockExamRuntimeFiles)[number];
export type ArchitectureContentDerivationRuntimeFilePath =
  (typeof architectureContentDerivationRuntimeFiles)[number];
export type ArchitectureQuizFeedbackRuntimeFilePath =
  (typeof architectureQuizFeedbackRuntimeFiles)[number];
export type ArchitectureMistakeReviewRuntimeFilePath =
  (typeof architectureMistakeReviewRuntimeFiles)[number];
export type ArchitectureMonetizationRuntimeFilePath =
  (typeof architectureMonetizationRuntimeFiles)[number];
export type ArchitectureRemoveAdsRuntimeFilePath =
  (typeof architectureRemoveAdsRuntimeFiles)[number];
export type ArchitectureLearningProgressRuntimeFilePath =
  (typeof architectureLearningProgressRuntimeFiles)[number];
export type ArchitectureProfileSettingsRuntimeFilePath =
  (typeof architectureProfileSettingsRuntimeFiles)[number];
