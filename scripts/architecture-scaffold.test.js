const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

require('../tests/architecture-public-exports.test.js');

const repoRoot = path.resolve(__dirname, '..');

const architectureTabRouteFiles = [
  'app/(tabs)/home.tsx',
  'app/(tabs)/learn.tsx',
  'app/(tabs)/practice.tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/(tabs)/profile.tsx',
];

const architectureTabRouteNames = architectureTabRouteFiles.map((routeFile) =>
  path.basename(routeFile, '.tsx'),
);

const architectureProductCoverageRoots = ['app', 'components', 'lib'];

const architectureTargetFiles = [
  'app/_layout.tsx',
  'app/index.tsx',
  'app/onboarding.tsx',
  'app/(tabs)/_layout.tsx',
  ...architectureTabRouteFiles,
  'app/chapter/[chapterId].tsx',
  'app/quiz/[sessionId].tsx',
  'app/settings.tsx',
  'components/ui/Button.tsx',
  'components/ui/Card.tsx',
  'components/ui/ProgressBar.tsx',
  'components/quiz/QuestionCard.tsx',
  'components/quiz/AnswerOption.tsx',
  'components/quiz/ExplanationPanel.tsx',
  'components/quiz/UHRReferenceCard.tsx',
  'components/learning/ChapterCard.tsx',
  'components/learning/Flashcard.tsx',
  'components/learning/AudioButton.tsx',
  'components/monetization/AdBanner.tsx',
  'components/monetization/PremiumBanner.tsx',
  'data/chapters.ts',
  'data/questions.ts',
  'data/glossary.ts',
  'data/mockExamConfig.ts',
  'lib/quiz/examGenerator.ts',
  'lib/quiz/scoring.ts',
  'lib/quiz/answerValidation.ts',
  'lib/learning/spacedRepetition.ts',
  'lib/learning/mastery.ts',
  'lib/learning/streaks.ts',
  'lib/storage/progressStore.ts',
  'lib/storage/settingsStore.ts',
  'lib/audio/speak.ts',
  'lib/monetization/ads.ts',
  'lib/monetization/premium.ts',
  'lib/localization/strings.ts',
  'lib/localization/language.ts',
  'types/content.ts',
  'types/progress.ts',
  'types/monetization.ts',
];

function valuesInConstArray(source, constName) {
  const match = source.match(
    new RegExp(`export const ${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as const`),
  );

  assert.notEqual(match, null, `${constName} should be declared as an exported array`);

  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((arrayMatch) => arrayMatch[1]);
}

function valuesForFieldInSource(source, fieldName) {
  return [...source.matchAll(new RegExp(`${fieldName}:\\s*['"]([^'"]+)['"]`, 'g'))].map(
    (match) => match[1],
  );
}

function fileLikeValuesInSource(source) {
  return [...source.matchAll(/['"]([^'"]+\.(?:tsx?|js|json|png))['"]/g)].map((match) => match[1]);
}

const architectureRouteFiles = architectureTargetFiles.filter(
  (relativePath) => relativePath.startsWith('app/') && relativePath.endsWith('.tsx'),
);

const releaseComplianceRouteFiles = [
  'app/+not-found.tsx',
  'app/disclaimer.tsx',
  'app/privacy.tsx',
  'app/sources.tsx',
  'app/support.tsx',
  'app/terms.tsx',
];

const routerShellRuntimeFiles = [
  'app/index.tsx',
  'app/_layout.tsx',
  'app/+not-found.tsx',
  'app/+html.tsx',
  'app/+native-intent.ts',
  'lib/scaffold/routerShellManifest.ts',
];

const scaffoldToolingFiles = [
  'lib/scaffold/architectureManifest.ts',
  'scripts/architecture-scaffold.test.js',
  'tests/architecture-public-exports.test.js',
];

const appConfigRuntimeFiles = [
  'app.json',
  'package.json',
  'assets/icon.png',
  'assets/adaptive-icon.png',
  'assets/splash-icon.png',
  'scripts/app-assets.test.js',
  'tests/content-app-config-schema.test.js',
];

const complianceSupportComponentFiles = [
  'components/compliance/ComplianceLinks.tsx',
  'components/compliance/LegalPage.tsx',
];

const legalRouteRuntimeFiles = [
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
];

const routeCopyRuntimeFiles = [
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
];

const designSystemSupportComponentFiles = [
  'components/Surface.tsx',
  'components/ui/Badge.tsx',
  'components/ui/MetricCard.tsx',
  'components/ui/ScreenShell.tsx',
];

const sharedUiRuntimeFiles = [
  'components/Surface.tsx',
  'components/ui/Badge.tsx',
  'components/ui/Button.tsx',
  'components/ui/Card.tsx',
  'components/ui/MetricCard.tsx',
  'components/ui/ProgressBar.tsx',
  'components/ui/ScreenShell.tsx',
  'lib/theme/index.ts',
];

const themeRuntimeFiles = [
  'lib/theme/index.ts',
  'lib/theme/colors.ts',
  'lib/theme/motion.ts',
  'lib/theme/radius.ts',
  'lib/theme/shadows.ts',
  'lib/theme/spacing.ts',
  'lib/theme/typography.ts',
];

const answerShuffleRuntimeFiles = [
  'lib/quiz/answerOptionShuffle.ts',
  'lib/quiz/practiceSessionStore.ts',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'lib/quiz/examGenerator.ts',
];

const answerShuffleReviewRuntimeFiles = [
  'lib/quiz/answerOptionShuffle.ts',
  'lib/quiz/examGenerator.ts',
  'lib/storage/mistakeReviewStore.ts',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
];

const answerShuffleReviewContracts = [
  {
    runtimeFile: 'app/(tabs)/practice.tsx',
    snippets: [
      'shuffleQuestionOptionsForSession(rawQuestion, shuffleSessionId)',
      'const selectedOption = question.options.find((option) => option.id === optionId);',
      'recordWrongAnswerReview({',
      'selectedOptionTextEn: selectedOption.textEn',
      'selectedOptionTextSv: selectedOption.textSv',
    ],
  },
  {
    runtimeFile: 'app/quiz/[sessionId].tsx',
    snippets: [
      'shuffleQuestionOptionsForSession(pickedQuestion, normalizedSessionId)',
      'const selectedOption = question.options.find((option) => option.id === optionId);',
      'recordWrongAnswerReview({',
      'selectedOptionTextEn: selectedOption.textEn',
      'selectedOptionTextSv: selectedOption.textSv',
    ],
  },
  {
    runtimeFile: 'lib/quiz/examGenerator.ts',
    snippets: [
      'return selected.map((question) => shuffleQuestionOptionsForSession(question, sessionId));',
      'const selectedOption = question.options.find((option) => option.id === answers[question.id]);',
      'const correctOption = question.options.find((option) => option.id === question.correctOptionId);',
    ],
  },
  {
    runtimeFile: 'app/(tabs)/exam.tsx',
    snippets: [
      'const examSessionId = `mock-exam-${examAttemptIndex}`;',
      'sessionId: examSessionId',
      'const reviewItems = result ? buildExamReviewItems(examQuestions, answers) : [];',
      "language === 'en' ? item.selectedOptionTextEn : item.selectedOptionTextSv",
      "language === 'en' ? item.correctOptionTextEn : item.correctOptionTextSv",
    ],
  },
  {
    runtimeFile: 'lib/storage/mistakeReviewStore.ts',
    snippets: [
      'selectedOptionTextEn: string;',
      'selectedOptionTextSv: string;',
      'recordWrongAnswerReview: (review: {',
      'selectedOptionTextEn,',
      'selectedOptionTextSv,',
    ],
  },
  {
    runtimeFile: 'app/(tabs)/mistakes.tsx',
    snippets: [
      'const wrongAnswerReview = wrongAnswerReviews[question.id];',
      'wrongAnswerReview.selectedOptionTextEn',
      'wrongAnswerReview.selectedOptionTextSv',
      'const correctAnswer = getOptionLabel(question, question.correctOptionId, language);',
    ],
  },
];

const questionLanguageRuntimeFiles = [
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
];

const sourceCitationRuntimeFiles = [
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
];

const sourceCitationBoundaryRuntimeFiles = [
  'lib/quiz/questionText.ts',
  'lib/audio/speak.ts',
  'components/quiz/QuestionCard.tsx',
  'components/quiz/QuestionDisclaimer.tsx',
  'components/quiz/UHRReferenceCard.tsx',
];

const sourceCitationBoundaryContracts = [
  {
    runtimeFile: 'lib/quiz/questionText.ts',
    snippets: [
      'const SOURCE_AUTHORITY_REPLACEMENTS = [',
      'export function stripSourceAuthorityPhrasing',
      'export function getQuestionSourceCitation',
      'Källa: Sverige i fokus',
      'Source: Sverige i fokus',
      'Källhänvisning saknas',
      'Source citation unavailable',
    ],
  },
  {
    runtimeFile: 'lib/audio/speak.ts',
    snippets: [
      "import { stripSourceAuthorityPhrasing } from '../quiz/questionText';",
      'const promptText = stripSourceAuthorityPhrasing(question.questionSv) || question.questionSv;',
      'Alternativ ${optionLetter(index)}',
    ],
  },
  {
    runtimeFile: 'components/quiz/QuestionCard.tsx',
    snippets: [
      'getQuestionDisplayText',
      'getQuestionSourceCitation',
      'getQuestionTranslationText',
      'const sourceCitation = getQuestionSourceCitation(question, language);',
      '<Text style={styles.sourceCitation}>{sourceCitation}</Text>',
      'sourceCitationLabel: ',
    ],
  },
  {
    runtimeFile: 'components/quiz/QuestionDisclaimer.tsx',
    snippets: [
      'Oberoende studieverktyg',
      'Inte officiellt',
      'är inte riktiga provfrågor',
      'Independent study tool',
      'Not official',
      'not real exam questions',
    ],
  },
  {
    runtimeFile: 'components/quiz/UHRReferenceCard.tsx',
    snippets: [
      'UHR-källa',
      'UHR reference',
      'const label = reference ? `${reference.chapter} · ${reference.section}` : copy.unavailable;',
      'reference?.pageApprox',
      '`${copy.approximatePage} ${reference.pageApprox}`',
    ],
  },
];

const questionSurfaceRuntimeFiles = [
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
];

const questionSurfaceRouteContracts = [
  {
    routeFile: 'app/(tabs)/practice.tsx',
    sourceSnippet: '<UHRReferenceCard language={language} reference={question.uhrReference} />',
  },
  {
    routeFile: 'app/quiz/[sessionId].tsx',
    sourceSnippet: '<UHRReferenceCard language={language} reference={question.uhrReference} />',
  },
  {
    routeFile: 'app/(tabs)/exam.tsx',
    sourceSnippet: '<UHRReferenceCard language={language} reference={item.uhrReference} />',
  },
  {
    routeFile: 'app/(tabs)/mistakes.tsx',
    sourceSnippet: '<UHRReferenceCard language={language} reference={question.uhrReference} />',
  },
  {
    routeFile: 'app/chapter/[chapterId].tsx',
    sourceSnippet: '<UHRReferenceCard language={language} reference={question.uhrReference} />',
  },
];

const settingsRuntimeFiles = [
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
];

const settingsPreferenceRuntimeFiles = [
  'lib/storage/settingsStore.ts',
  'app/settings.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/profile.tsx',
  'app/onboarding.tsx',
];

const settingsPreferenceContracts = [
  {
    runtimeFile: 'lib/storage/settingsStore.ts',
    snippets: [
      "const languageKey = 'language';",
      "const audioEnabledKey = 'audioEnabled';",
      "const dailyGoalKey = 'dailyGoalAnswers';",
      'language: readLanguage()',
      'audioEnabled: readAudioEnabled()',
      'dailyGoalAnswers: readDailyGoalAnswers()',
      'settingsStorage?.set(languageKey, language);',
      'settingsStorage?.set(audioEnabledKey, audioEnabled);',
      'const safeGoal = Math.max(1, Math.min(50, Math.round(dailyGoalAnswers)));',
      'settingsStorage?.set(dailyGoalKey, safeGoal);',
    ],
  },
  {
    runtimeFile: 'app/settings.tsx',
    snippets: [
      'const language = useSettingsStore((state) => state.language);',
      'const audioEnabled = useSettingsStore((state) => state.audioEnabled);',
      'const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);',
      'const setLanguage = useSettingsStore((state) => state.setLanguage);',
      'const setAudioEnabled = useSettingsStore((state) => state.setAudioEnabled);',
      'const setDailyGoalAnswers = useSettingsStore((state) => state.setDailyGoalAnswers);',
      'const copy = settingsCopy[language];',
      'accessibilityRole="switch"',
      'onPress={() => setAudioEnabled(!audioEnabled)}',
      'onPress={() => setDailyGoalAnswers(goal)}',
    ],
  },
  {
    runtimeFile: 'app/(tabs)/_layout.tsx',
    snippets: [
      'const language = useSettingsStore((state) => state.language);',
      'const copy = tabTitleCopy[language];',
      '<Tabs.Screen name="home" options={getTabOptions(copy.home)} />',
      '<Tabs.Screen name="profile" options={getTabOptions(copy.profile)} />',
    ],
  },
  {
    runtimeFile: 'app/(tabs)/profile.tsx',
    snippets: [
      'const dailyGoalAnswers = useSettingsStore((state) => state.dailyGoalAnswers);',
      'const language = useSettingsStore((state) => state.language);',
      'const copy = profileCopy[language];',
      '{dailyGoalAnswers} {copy.answersPerDay}',
      'href="/settings"',
    ],
  },
  {
    runtimeFile: 'app/onboarding.tsx',
    snippets: [
      'const language = useSettingsStore((state) => state.language);',
      'const copy = onboardingCopy[language];',
      'href="/settings"',
      'accessibilityLabel={copy.adjustSettingsAccessibilityLabel}',
    ],
  },
];

const tabNavigationRuntimeFiles = [
  'app/(tabs)/_layout.tsx',
  'lib/storage/settingsStore.ts',
  'app/(tabs)/home.tsx',
  'app/(tabs)/learn.tsx',
  'app/(tabs)/practice.tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/(tabs)/profile.tsx',
];

const speechRuntimeFiles = [
  'lib/audio/speak.ts',
  'lib/quiz/questionText.ts',
  'lib/storage/settingsStore.ts',
  'components/learning/AudioButton.tsx',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
];

const practiceFlowRuntimeFiles = [
  'lib/quiz/practiceFlow.ts',
  'lib/quiz/practiceSessionStore.ts',
  'app/(tabs)/practice.tsx',
  'app/(tabs)/learn.tsx',
  'app/chapter/[chapterId].tsx',
  'app/quiz/[sessionId].tsx',
];

const mockExamRuntimeFiles = [
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
];

const contentDerivationRuntimeFiles = [
  'data/questions.ts',
  'data/additionalQuestions.ts',
  'lib/content/derivedQuestions.ts',
  'scripts/derived-content.test.js',
];

const quizFeedbackRuntimeFiles = [
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
];

const mistakeReviewRuntimeFiles = [
  'lib/storage/mistakeReviewStore.ts',
  'lib/storage/progressStore.ts',
  'components/quiz/QuestionCard.tsx',
  'components/quiz/ExplanationPanel.tsx',
  'components/quiz/UHRReferenceCard.tsx',
  'components/quiz/QuestionDisclaimer.tsx',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'app/(tabs)/mistakes.tsx',
];

const monetizationRuntimeFiles = [
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
];

const removeAdsRuntimeFiles = [
  'lib/monetization/premium.ts',
  'lib/monetization/purchases.ts',
  'lib/monetization/useRemoveAdsEntitlements.ts',
  'components/monetization/PremiumBanner.tsx',
  'components/monetization/AdBanner.tsx',
  'components/monetization/AdBanner.native.tsx',
  'components/monetization/NativeAdCard.tsx',
  'app/(tabs)/home.tsx',
  'app/(tabs)/profile.tsx',
];

const removeAdsRuntimeContracts = [
  {
    runtimeFile: 'lib/monetization/premium.ts',
    snippets: [
      'export const REMOVE_ADS_ENTITLEMENTS',
      'adsDisabled: true,',
      'unlimitedMockExams: false,',
      'fullMistakeReview: false,',
      'return entitlements.unlimitedMockExams && entitlements.fullMistakeReview;',
    ],
  },
  {
    runtimeFile: 'lib/monetization/purchases.ts',
    snippets: [
      "export const REMOVE_ADS_PRICE_LABEL = '29 SEK';",
      'requestRemoveAdsPurchase(REMOVE_ADS_PRODUCT_ID)',
      'restorePurchases([REMOVE_ADS_PRODUCT_ID])',
      'isConsumable: false',
    ],
  },
  {
    runtimeFile: 'lib/monetization/useRemoveAdsEntitlements.ts',
    snippets: [
      'AD_BLOCKED_PENDING_ENTITLEMENTS',
      'getPurchaseEntitlements(purchaseRuntime)',
      'publishRemoveAdsEntitlements(storedEntitlements)',
      'entitlements: explicitEntitlements',
      'entitlements: AD_BLOCKED_PENDING_ENTITLEMENTS',
    ],
  },
  {
    runtimeFile: 'components/monetization/PremiumBanner.tsx',
    snippets: [
      'buyRemoveAds',
      'restoreRemoveAdsPurchase',
      'createDefaultPurchaseRuntimeOptions',
      'onEntitlementsChange',
      'copy.buyAccessibilityLabel(REMOVE_ADS_PRICE_LABEL)',
      'copy.restoreAccessibilityLabel',
      'statusAccessibilityLabel(statusMessage)',
    ],
  },
  {
    runtimeFile: 'components/monetization/AdBanner.tsx',
    snippets: [
      'useResolvedAdEntitlements(entitlements)',
      'if (!entitlementsReady || !shouldShowAd(placement, resolvedEntitlements)) return null;',
    ],
  },
  {
    runtimeFile: 'components/monetization/AdBanner.native.tsx',
    snippets: [
      'useResolvedAdEntitlements(entitlements)',
      'mobileAdsConsent.initialized',
      'shouldShowAd(placement, resolvedEntitlements, mobileAdsConsent.decision.consentDecision)',
    ],
  },
  {
    runtimeFile: 'components/monetization/NativeAdCard.tsx',
    snippets: [
      'useResolvedAdEntitlements(entitlements)',
      "shouldShowAd('results_native', resolvedEntitlements)",
    ],
  },
  {
    runtimeFile: 'app/(tabs)/home.tsx',
    snippets: [
      'useRemoveAdsEntitlements()',
      'entitlements: monetizationEntitlements',
      'setEntitlements: setMonetizationEntitlements',
      'onEntitlementsChange={setMonetizationEntitlements}',
      '<AdBanner entitlements={monetizationEntitlements} placement="home_banner" />',
    ],
  },
  {
    runtimeFile: 'app/(tabs)/profile.tsx',
    snippets: [
      'useRemoveAdsEntitlements()',
      'entitlements: monetizationEntitlements',
      'setEntitlements: setMonetizationEntitlements',
      'onEntitlementsChange={setMonetizationEntitlements}',
      'runtimeOptions={purchaseRuntime}',
    ],
  },
];

const learningProgressRuntimeFiles = [
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
];

const learningProgressSurfaceContracts = [
  {
    runtimeFile: 'app/(tabs)/home.tsx',
    snippets: [
      'const questionProgress = useProgressStore((state) => state.questionProgress);',
      'const totalXp = useProgressStore((state) => state.totalXp);',
      'const answerDates = useProgressStore((state) => state.answerDates);',
      'const completedToday = Math.min(countAnswersForLocalDate(questionProgress), dailyGoalAnswers);',
      'const currentStreak = calculateStreak(answerDates);',
      'const level = calculateLevel(totalXp);',
      'const weakChapterCount = findWeakChapterIds(questions, questionProgress, 0.6).length;',
      '<ProgressBar language={language} progress={progress} />',
    ],
  },
  {
    runtimeFile: 'app/(tabs)/learn.tsx',
    snippets: [
      'const completedQuestionIds = useProgressStore((state) => state.completedQuestionIds);',
      'const questionCount = questionCountForChapter(chapter.id);',
      'const completedCount = completedCountForChapter(chapter.id, completedQuestionIds);',
      'completedCount={completedCount}',
      'questionCount={questionCount}',
    ],
  },
  {
    runtimeFile: 'lib/storage/progressStore.ts',
    snippets: [
      'recordAnswer: (questionId, isCorrect) =>',
      'const answerDate = getLocalDateKey(new Date(answeredAt));',
      'nextReviewAt: getNextReviewAt({ isCorrect, correctStreak, answeredAt }),',
      'totalXp: state.totalXp + calculateAnswerXp({ isCorrect, explanationRead: true }),',
      'answerDates,',
    ],
  },
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function assertIncludes(source, snippet, message) {
  assert.equal(source.includes(snippet), true, message);
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

function extractTabScreenNames(tabLayoutSource) {
  return Array.from(
    tabLayoutSource.matchAll(/<Tabs\.Screen\s+name=(["'])([^"']+)\1/g),
    (match) => match[2],
  );
}

function extractStackScreenNames(rootLayoutSource) {
  return Array.from(
    rootLayoutSource.matchAll(/<Stack\.Screen\s+name=(["'])([^"']+)\1/g),
    (match) => match[2],
  );
}

test('architecture target scaffold files exist', () => {
  assert.deepEqual(
    architectureTargetFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('product architecture manifest matches the target scaffold files', () => {
  const manifest = readText('lib/scaffold/architectureManifest.ts');
  const manifestFiles = valuesForFieldInSource(manifest, 'file');
  const manifestDirectories = valuesInConstArray(manifest, 'architectureScaffoldDirectories');
  const manifestProductCoverageRoots = valuesInConstArray(
    manifest,
    'architectureProductCoverageRoots',
  );
  const manifestTabRoutes = valuesInConstArray(manifest, 'architectureTabRouteFiles');
  const manifestSupplementalRoutes = valuesInConstArray(
    manifest,
    'architectureSupplementalRouteFiles',
  );
  const manifestRouterShellRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureRouterShellRuntimeFiles',
  );
  const manifestScaffoldToolingFiles = valuesInConstArray(
    manifest,
    'architectureScaffoldToolingFiles',
  );
  const manifestAppConfigRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureAppConfigRuntimeFiles',
  );
  const manifestComplianceSupportFiles = valuesInConstArray(
    manifest,
    'architectureComplianceSupportFiles',
  );
  const manifestLegalRouteRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureLegalRouteRuntimeFiles',
  );
  const manifestRouteCopyRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureRouteCopyRuntimeFiles',
  );
  const manifestDesignSystemSupportFiles = valuesInConstArray(
    manifest,
    'architectureDesignSystemSupportFiles',
  );
  const manifestSharedUiRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureSharedUiRuntimeFiles',
  );
  const manifestThemeRuntimeFiles = valuesInConstArray(manifest, 'architectureThemeRuntimeFiles');
  const manifestAnswerShuffleRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureAnswerShuffleRuntimeFiles',
  );
  const manifestAnswerShuffleReviewRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureAnswerShuffleReviewRuntimeFiles',
  );
  const manifestQuestionLanguageRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureQuestionLanguageRuntimeFiles',
  );
  const manifestSourceCitationRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureSourceCitationRuntimeFiles',
  );
  const manifestSourceCitationBoundaryRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureSourceCitationBoundaryRuntimeFiles',
  );
  const manifestQuestionSurfaceRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureQuestionSurfaceRuntimeFiles',
  );
  const manifestSettingsRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureSettingsRuntimeFiles',
  );
  const manifestSettingsPreferenceRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureSettingsPreferenceRuntimeFiles',
  );
  const manifestTabNavigationRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureTabNavigationRuntimeFiles',
  );
  const manifestSpeechRuntimeFiles = valuesInConstArray(manifest, 'architectureSpeechRuntimeFiles');
  const manifestPracticeFlowRuntimeFiles = valuesInConstArray(
    manifest,
    'architecturePracticeFlowRuntimeFiles',
  );
  const manifestMockExamRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureMockExamRuntimeFiles',
  );
  const manifestContentDerivationRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureContentDerivationRuntimeFiles',
  );
  const manifestQuizFeedbackRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureQuizFeedbackRuntimeFiles',
  );
  const manifestMistakeReviewRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureMistakeReviewRuntimeFiles',
  );
  const manifestMonetizationRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureMonetizationRuntimeFiles',
  );
  const manifestRemoveAdsRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureRemoveAdsRuntimeFiles',
  );
  const manifestLearningProgressRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureLearningProgressRuntimeFiles',
  );

  assert.deepEqual(manifestFiles, architectureTargetFiles);
  assert.deepEqual(manifestDirectories, ['app', 'components', 'data', 'lib', 'types']);
  assert.deepEqual(manifestProductCoverageRoots, architectureProductCoverageRoots);
  assert.deepEqual(manifestTabRoutes, architectureTabRouteFiles);
  assert.deepEqual(manifestSupplementalRoutes, releaseComplianceRouteFiles);
  assert.deepEqual(manifestRouterShellRuntimeFiles, routerShellRuntimeFiles);
  assert.deepEqual(manifestScaffoldToolingFiles, scaffoldToolingFiles);
  assert.deepEqual(manifestAppConfigRuntimeFiles, appConfigRuntimeFiles);
  assert.deepEqual(manifestComplianceSupportFiles, complianceSupportComponentFiles);
  assert.deepEqual(manifestLegalRouteRuntimeFiles, legalRouteRuntimeFiles);
  assert.deepEqual(manifestRouteCopyRuntimeFiles, routeCopyRuntimeFiles);
  assert.deepEqual(manifestDesignSystemSupportFiles, designSystemSupportComponentFiles);
  assert.deepEqual(manifestSharedUiRuntimeFiles, sharedUiRuntimeFiles);
  assert.deepEqual(manifestThemeRuntimeFiles, themeRuntimeFiles);
  assert.deepEqual(manifestAnswerShuffleRuntimeFiles, answerShuffleRuntimeFiles);
  assert.deepEqual(manifestAnswerShuffleReviewRuntimeFiles, answerShuffleReviewRuntimeFiles);
  assert.deepEqual(manifestQuestionLanguageRuntimeFiles, questionLanguageRuntimeFiles);
  assert.deepEqual(manifestSourceCitationRuntimeFiles, sourceCitationRuntimeFiles);
  assert.deepEqual(manifestSourceCitationBoundaryRuntimeFiles, sourceCitationBoundaryRuntimeFiles);
  assert.deepEqual(manifestQuestionSurfaceRuntimeFiles, questionSurfaceRuntimeFiles);
  assert.deepEqual(manifestSettingsRuntimeFiles, settingsRuntimeFiles);
  assert.deepEqual(manifestSettingsPreferenceRuntimeFiles, settingsPreferenceRuntimeFiles);
  assert.deepEqual(manifestTabNavigationRuntimeFiles, tabNavigationRuntimeFiles);
  assert.deepEqual(manifestSpeechRuntimeFiles, speechRuntimeFiles);
  assert.deepEqual(manifestPracticeFlowRuntimeFiles, practiceFlowRuntimeFiles);
  assert.deepEqual(manifestMockExamRuntimeFiles, mockExamRuntimeFiles);
  assert.deepEqual(manifestContentDerivationRuntimeFiles, contentDerivationRuntimeFiles);
  assert.deepEqual(manifestQuizFeedbackRuntimeFiles, quizFeedbackRuntimeFiles);
  assert.deepEqual(manifestMistakeReviewRuntimeFiles, mistakeReviewRuntimeFiles);
  assert.deepEqual(manifestMonetizationRuntimeFiles, monetizationRuntimeFiles);
  assert.deepEqual(manifestRemoveAdsRuntimeFiles, removeAdsRuntimeFiles);
  assert.deepEqual(manifestLearningProgressRuntimeFiles, learningProgressRuntimeFiles);
});

test('current SETUP-owned product runtime files are assigned to architecture manifest coverage', () => {
  const manifest = readText('lib/scaffold/architectureManifest.ts');
  const manifestCoveredFiles = new Set(fileLikeValuesInSource(manifest));
  const currentProductFiles = architectureProductCoverageRoots
    .flatMap((coverageRoot) => listFiles(coverageRoot))
    .filter((relativePath) => /\.(?:tsx?|ts)$/.test(relativePath))
    .sort();

  assert.deepEqual(
    currentProductFiles.filter((relativePath) => !manifestCoveredFiles.has(relativePath)),
    [],
  );
});

test('architecture design system support files exist', () => {
  assert.deepEqual(
    designSystemSupportComponentFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture shared UI runtime files exist', () => {
  assert.deepEqual(
    sharedUiRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture compliance support files exist', () => {
  assert.deepEqual(
    complianceSupportComponentFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture legal route runtime files exist', () => {
  assert.deepEqual(
    legalRouteRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture route copy runtime files exist', () => {
  assert.deepEqual(
    routeCopyRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture router shell runtime files exist', () => {
  assert.deepEqual(
    routerShellRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture scaffold tooling files exist', () => {
  assert.deepEqual(
    scaffoldToolingFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture app config runtime files exist', () => {
  assert.deepEqual(
    appConfigRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture theme runtime files exist', () => {
  assert.deepEqual(
    themeRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture answer shuffle runtime files exist', () => {
  assert.deepEqual(
    answerShuffleRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture answer shuffle review runtime files exist', () => {
  assert.deepEqual(
    answerShuffleReviewRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('answer shuffle review surfaces preserve shuffled answer identity', () => {
  for (const contract of answerShuffleReviewContracts) {
    const source = readText(contract.runtimeFile);

    for (const snippet of contract.snippets) {
      assertIncludes(
        source,
        snippet,
        `${contract.runtimeFile} should keep answer-shuffle review wiring: ${snippet}`,
      );
    }
  }
});

test('architecture question language runtime files exist', () => {
  assert.deepEqual(
    questionLanguageRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture source citation runtime files exist', () => {
  assert.deepEqual(
    sourceCitationRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture source citation boundary runtime files exist', () => {
  assert.deepEqual(
    sourceCitationBoundaryRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('source citation, disclaimer, and speech boundaries stay separated', () => {
  for (const contract of sourceCitationBoundaryContracts) {
    const source = readText(contract.runtimeFile);

    for (const snippet of contract.snippets) {
      assertIncludes(
        source,
        snippet,
        `${contract.runtimeFile} should keep source-citation boundary wiring: ${snippet}`,
      );
    }
  }

  const disclaimerSource = readText('components/quiz/QuestionDisclaimer.tsx');
  const questionCardSource = readText('components/quiz/QuestionCard.tsx');
  const speechSource = readText('lib/audio/speak.ts');

  assert.doesNotMatch(disclaimerSource, /getQuestionSourceCitation|UHRReferenceCard|uhrReference/);
  assert.doesNotMatch(questionCardSource, /QuestionDisclaimer/);
  assert.doesNotMatch(speechSource, /getQuestionSourceCitation|UHRReferenceCard|Källa:|Source:/);
});

test('architecture question surface runtime files exist', () => {
  assert.deepEqual(
    questionSurfaceRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('question-bearing routes keep disclaimer and source-citation surface wiring', () => {
  for (const contract of questionSurfaceRouteContracts) {
    const routeSource = readText(contract.routeFile);

    assert.match(
      routeSource,
      /QuestionDisclaimer/,
      `${contract.routeFile} should keep the not-real-exam disclaimer component`,
    );
    assert.match(
      routeSource,
      /UHRReferenceCard/,
      `${contract.routeFile} should keep the source reference component import or usage`,
    );
    assert.equal(
      routeSource.includes(contract.sourceSnippet),
      true,
      `${contract.routeFile} should keep its source reference card next to question content`,
    );
  }
});

test('architecture settings runtime files exist', () => {
  assert.deepEqual(
    settingsRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture settings preference runtime files exist', () => {
  assert.deepEqual(
    settingsPreferenceRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('settings preference surfaces keep persisted language, audio, and daily-goal wiring', () => {
  for (const contract of settingsPreferenceContracts) {
    const source = readText(contract.runtimeFile);

    for (const snippet of contract.snippets) {
      assertIncludes(
        source,
        snippet,
        `${contract.runtimeFile} should keep settings-preference wiring: ${snippet}`,
      );
    }
  }
});

test('architecture tab navigation runtime files exist', () => {
  assert.deepEqual(
    tabNavigationRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture speech runtime files exist', () => {
  assert.deepEqual(
    speechRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture practice flow runtime files exist', () => {
  assert.deepEqual(
    practiceFlowRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture mock exam runtime files exist', () => {
  assert.deepEqual(
    mockExamRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture content derivation runtime files exist', () => {
  assert.deepEqual(
    contentDerivationRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture quiz feedback runtime files exist', () => {
  assert.deepEqual(
    quizFeedbackRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture mistake review runtime files exist', () => {
  assert.deepEqual(
    mistakeReviewRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture monetization runtime files exist', () => {
  assert.deepEqual(
    monetizationRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture Remove Ads runtime files exist', () => {
  assert.deepEqual(
    removeAdsRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('Remove Ads runtime surfaces keep purchase, entitlement, and ad gating wiring', () => {
  for (const contract of removeAdsRuntimeContracts) {
    const source = readText(contract.runtimeFile);

    for (const snippet of contract.snippets) {
      assertIncludes(
        source,
        snippet,
        `${contract.runtimeFile} should keep Remove Ads wiring: ${snippet}`,
      );
    }
  }
});

test('architecture learning progress runtime files exist', () => {
  assert.deepEqual(
    learningProgressRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('learning progress surfaces keep local progress wiring', () => {
  for (const contract of learningProgressSurfaceContracts) {
    const source = readText(contract.runtimeFile);

    for (const snippet of contract.snippets) {
      assertIncludes(
        source,
        snippet,
        `${contract.runtimeFile} should keep learning-progress wiring: ${snippet}`,
      );
    }
  }
});

test('Expo Router route scaffold files expose default component exports', () => {
  assert.deepEqual(
    architectureRouteFiles.filter(
      (relativePath) => !/export\s+default\s+/.test(readText(relativePath)),
    ),
    [],
  );
});

test('current Expo Router route files expose default component exports', () => {
  const currentRouteFiles = listFiles('app')
    .filter((relativePath) => relativePath.endsWith('.tsx'))
    .sort();

  assert.deepEqual(
    releaseComplianceRouteFiles.filter((relativePath) => !currentRouteFiles.includes(relativePath)),
    [],
  );
  assert.deepEqual(
    currentRouteFiles.filter((relativePath) => !/export\s+default\s+/.test(readText(relativePath))),
    [],
  );
});

test('Expo Router scaffold wiring matches the TypeScript architecture', () => {
  const appJson = readJson('app.json').expo;
  const packageJson = readJson('package.json');
  const tsconfig = readJson('tsconfig.json');
  const babelConfig = readText('babel.config.js');

  assert.equal(packageJson.main, 'expo-router/entry');
  assert.equal(packageJson.scripts.start, 'expo start');
  assert.equal(packageJson.scripts.typecheck, 'tsc --noEmit');
  assert.equal(packageJson.dependencies.expo.startsWith('~54.'), true);
  assert.equal(typeof packageJson.dependencies['expo-router'], 'string');
  assert.equal(typeof packageJson.dependencies.zustand, 'string');
  assert.equal(typeof packageJson.dependencies['react-native-mmkv'], 'string');
  assert.equal(typeof packageJson.dependencies['expo-speech'], 'string');
  assert.equal(appJson.plugins.includes('expo-router'), true);
  assert.equal(appJson.scheme, 'swedish-civic-test');
  assert.equal(tsconfig.extends, 'expo/tsconfig.base');
  assert.equal(tsconfig.compilerOptions.strict, true);
  assert.match(babelConfig, /babel-preset-expo/);
});

test('Expo Router tab scaffold exposes the architecture tab routes', () => {
  const tabLayout = readText('app/(tabs)/_layout.tsx');

  assert.match(tabLayout, /import\s+\{\s*Tabs\s*\}\s+from ['"]expo-router['"]/);
  assert.deepEqual(extractTabScreenNames(tabLayout).sort(), [...architectureTabRouteNames].sort());
});

test('Expo Router tab scaffold titles follow the persisted settings language', () => {
  const tabLayout = readText('app/(tabs)/_layout.tsx');

  assert.match(tabLayout, /useSettingsStore, type AppLanguage/);
  assert.match(
    tabLayout,
    /type TabRouteName = 'home' \| 'learn' \| 'practice' \| 'exam' \| 'mistakes' \| 'profile';/,
  );
  assert.match(tabLayout, /type TabTitleCopy = Record<TabRouteName, string>;/);
  assert.match(tabLayout, /const tabTitleCopy: Record<AppLanguage, TabTitleCopy> = \{/);
  assert.match(tabLayout, /const hiddenTabIcon = \(\) => null;/);
  assert.match(tabLayout, /function getTabOptions\(title: string\)/);
  assert.match(tabLayout, /tabBarAccessibilityLabel: title/);
  assert.match(tabLayout, /tabBarIcon: hiddenTabIcon/);
  assert.match(tabLayout, /home: 'Hem'/);
  assert.match(tabLayout, /learn: 'Lär dig'/);
  assert.match(tabLayout, /practice: 'Öva'/);
  assert.match(tabLayout, /exam: 'Prov'/);
  assert.match(tabLayout, /mistakes: 'Misstag'/);
  assert.match(tabLayout, /profile: 'Profil'/);
  assert.match(tabLayout, /home: 'Home'/);
  assert.match(tabLayout, /learn: 'Learn'/);
  assert.match(tabLayout, /practice: 'Practice'/);
  assert.match(tabLayout, /exam: 'Exam'/);
  assert.match(tabLayout, /mistakes: 'Mistakes'/);
  assert.match(tabLayout, /profile: 'Profile'/);
  assert.match(tabLayout, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(tabLayout, /const copy = tabTitleCopy\[language\];/);

  for (const routeName of architectureTabRouteNames) {
    assert.match(
      tabLayout,
      new RegExp(
        `<Tabs\\.Screen\\s+name="${routeName}"\\s+options=\\{getTabOptions\\(copy\\.${routeName}\\)\\}`,
      ),
    );
  }
});

test('Expo Router root scaffold redirects into the tab shell', () => {
  const rootLayout = readText('app/_layout.tsx');
  const indexRoute = readText('app/index.tsx');

  assert.match(rootLayout, /import\s+\{\s*Stack\s*,\s*usePathname\s*\}\s+from ['"]expo-router['"]/);
  assert.deepEqual(extractStackScreenNames(rootLayout).sort(), ['(tabs)', '+not-found', 'index']);
  assert.match(rootLayout, /<Stack\s+screenOptions=\{\{\s*headerShown:\s*false\s*\}\}>/);
  assert.match(rootLayout, /<Stack\.Screen\s+name=["']index["']\s*\/>/);
  assert.match(rootLayout, /<Stack\.Screen\s+name=["']\(tabs\)["']\s*\/>/);
  assert.match(rootLayout, /<Stack\.Screen\s+name=["']\+not-found["']\s*\/>/);
  assert.match(indexRoute, /import\s+\{\s*Redirect\s*\}\s+from ['"]expo-router['"]/);
  assert.match(indexRoute, /<Redirect\s+href=["']\/home["']\s*\/>/);
});

test('Expo Router unmatched routes fall back to the Home tab', () => {
  const notFoundRoute = readText('app/+not-found.tsx');

  assert.match(notFoundRoute, /import\s+\{\s*Redirect\s*\}\s+from ['"]expo-router['"]/);
  assert.match(notFoundRoute, /import\s+HomeScreen\s+from ['"]\.\/\(tabs\)\/home['"]/);
  assert.match(notFoundRoute, /window\.location\.protocol\s+===\s+['"]file:['"]/);
  assert.match(notFoundRoute, /return\s+<HomeScreen\s*\/>/);
  assert.match(notFoundRoute, /<Redirect\s+href=["']\/home["']\s*\/>/);
});
