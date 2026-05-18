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

function valuesForFieldInConstArray(source, constName, fieldName) {
  const match = source.match(
    new RegExp(`export const ${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s+as const`),
  );

  assert.notEqual(match, null, `${constName} should be declared as an exported array`);

  return valuesForFieldInSource(match[1], fieldName);
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
  'app/(tabs)/_layout.tsx',
  'app/search.tsx',
  'app/+not-found.tsx',
  'app/+html.tsx',
  'app/+native-intent.ts',
  'lib/scaffold/routerShellManifest.ts',
];

const complianceSupportComponentFiles = [
  'components/compliance/ComplianceLinks.tsx',
  'components/compliance/LegalPage.tsx',
];

const designSystemSupportComponentFiles = [
  'components/Surface.tsx',
  'components/ui/Badge.tsx',
  'components/ui/MetricCard.tsx',
  'components/ui/ScreenShell.tsx',
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

const audioRuntimeFiles = [
  'lib/audio/speak.ts',
  'components/learning/AudioButton.tsx',
  'lib/storage/settingsStore.ts',
  'app/settings.tsx',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
];

const answerShuffleRuntimeFiles = [
  'lib/quiz/answerOptionShuffle.ts',
  'lib/quiz/practiceSessionStore.ts',
  'app/(tabs)/practice.tsx',
  'app/quiz/[sessionId].tsx',
  'lib/quiz/examGenerator.ts',
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

const profileSettingsRuntimeFiles = [
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
  const manifestTabRoutes = valuesInConstArray(manifest, 'architectureTabRouteFiles');
  const manifestSupplementalRoutes = valuesInConstArray(
    manifest,
    'architectureSupplementalRouteFiles',
  );
  const manifestRouterShellRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureRouterShellRuntimeFiles',
  );
  const manifestComplianceSupportFiles = valuesInConstArray(
    manifest,
    'architectureComplianceSupportFiles',
  );
  const manifestDesignSystemSupportFiles = valuesInConstArray(
    manifest,
    'architectureDesignSystemSupportFiles',
  );
  const manifestThemeRuntimeFiles = valuesInConstArray(manifest, 'architectureThemeRuntimeFiles');
  const manifestAudioRuntimeFiles = valuesInConstArray(manifest, 'architectureAudioRuntimeFiles');
  const manifestAnswerShuffleRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureAnswerShuffleRuntimeFiles',
  );
  const manifestQuestionLanguageRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureQuestionLanguageRuntimeFiles',
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
  const manifestLearningProgressRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureLearningProgressRuntimeFiles',
  );
  const manifestProfileSettingsRuntimeFiles = valuesInConstArray(
    manifest,
    'architectureProfileSettingsRuntimeFiles',
  );

  assert.deepEqual(manifestFiles, architectureTargetFiles);
  assert.deepEqual(manifestDirectories, ['app', 'components', 'data', 'lib', 'types']);
  assert.deepEqual(manifestTabRoutes, architectureTabRouteFiles);
  assert.deepEqual(manifestSupplementalRoutes, releaseComplianceRouteFiles);
  assert.deepEqual(manifestRouterShellRuntimeFiles, routerShellRuntimeFiles);
  assert.deepEqual(manifestComplianceSupportFiles, complianceSupportComponentFiles);
  assert.deepEqual(manifestDesignSystemSupportFiles, designSystemSupportComponentFiles);
  assert.deepEqual(manifestThemeRuntimeFiles, themeRuntimeFiles);
  assert.deepEqual(manifestAudioRuntimeFiles, audioRuntimeFiles);
  assert.deepEqual(manifestAnswerShuffleRuntimeFiles, answerShuffleRuntimeFiles);
  assert.deepEqual(manifestQuestionLanguageRuntimeFiles, questionLanguageRuntimeFiles);
  assert.deepEqual(manifestQuizFeedbackRuntimeFiles, quizFeedbackRuntimeFiles);
  assert.deepEqual(manifestMistakeReviewRuntimeFiles, mistakeReviewRuntimeFiles);
  assert.deepEqual(manifestMonetizationRuntimeFiles, monetizationRuntimeFiles);
  assert.deepEqual(manifestLearningProgressRuntimeFiles, learningProgressRuntimeFiles);
  assert.deepEqual(manifestProfileSettingsRuntimeFiles, profileSettingsRuntimeFiles);
});

test('architecture design system support files exist', () => {
  assert.deepEqual(
    designSystemSupportComponentFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture compliance support files exist', () => {
  assert.deepEqual(
    complianceSupportComponentFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture router shell runtime files exist', () => {
  const routerShellManifest = readText('lib/scaffold/routerShellManifest.ts');
  const routerShellContractFiles = [
    ...valuesForFieldInConstArray(routerShellManifest, 'expoRouterShellFiles', 'file'),
    ...valuesForFieldInConstArray(routerShellManifest, 'expoRouterRootStackScreens', 'file'),
    'lib/scaffold/routerShellManifest.ts',
  ];

  assert.deepEqual(
    routerShellRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
  assert.deepEqual(
    routerShellContractFiles.filter(
      (relativePath) => !routerShellRuntimeFiles.includes(relativePath),
    ),
    [],
  );
});

test('architecture theme runtime files exist', () => {
  assert.deepEqual(
    themeRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture audio runtime files exist', () => {
  assert.deepEqual(
    audioRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture answer shuffle runtime files exist', () => {
  assert.deepEqual(
    answerShuffleRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture question language runtime files exist', () => {
  assert.deepEqual(
    questionLanguageRuntimeFiles.filter((relativePath) => !exists(relativePath)),
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

test('architecture learning progress runtime files exist', () => {
  assert.deepEqual(
    learningProgressRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
});

test('architecture profile settings runtime files exist', () => {
  assert.deepEqual(
    profileSettingsRuntimeFiles.filter((relativePath) => !exists(relativePath)),
    [],
  );
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
  assert.deepEqual(extractStackScreenNames(rootLayout).sort(), [
    '(tabs)',
    '+not-found',
    'index',
    'search',
  ]);
  assert.match(
    rootLayout,
    /<Stack\s+screenOptions=\{\{[\s\S]*headerShown:\s*true,[\s\S]*headerTitle:\s*'',[\s\S]*headerRight:\s*\(\)\s*=>\s*<LanguagePicker\s*\/>,[\s\S]*\}\}/,
  );
  assert.match(
    rootLayout,
    /<Stack\.Screen\s+name=["']index["']\s+options=\{\{\s*headerShown:\s*false\s*\}\}\s*\/>/,
  );
  assert.match(
    rootLayout,
    /<Stack\.Screen\s+name=["']\(tabs\)["']\s+options=\{\{\s*headerShown:\s*false\s*\}\}\s*\/>/,
  );
  assert.match(rootLayout, /<Stack\.Screen\s+name=["']search["']\s*\/>/);
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
