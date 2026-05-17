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
  const match = source.match(new RegExp(`export const ${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]`));

  assert.notEqual(match, null, `${constName} should be declared as an exported array`);

  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((arrayMatch) => arrayMatch[1]);
}

function valuesForFieldInSource(source, fieldName) {
  return [...source.matchAll(new RegExp(`${fieldName}:\\s*['"]([^'"]+)['"]`, 'g'))].map(
    (match) => match[1],
  );
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

  assert.deepEqual(manifestFiles, architectureTargetFiles);
  assert.deepEqual(manifestDirectories, ['app', 'components', 'data', 'lib', 'types']);
  assert.deepEqual(manifestTabRoutes, architectureTabRouteFiles);
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
        `<Tabs\\.Screen\\s+name="${routeName}"\\s+options=\\{\\{ title: copy\\.${routeName} \\}\\}`,
      ),
    );
  }
});

test('Expo Router root scaffold redirects into the tab shell', () => {
  const rootLayout = readText('app/_layout.tsx');
  const indexRoute = readText('app/index.tsx');

  assert.match(rootLayout, /import\s+\{\s*Stack\s*,\s*usePathname\s*\}\s+from ['"]expo-router['"]/);
  assert.deepEqual(extractStackScreenNames(rootLayout).sort(), ['(tabs)', '+not-found', 'index']);
  assert.match(
    rootLayout,
    /<Stack\.Screen\s+name=["']index["']\s+options=\{\{\s*headerShown:\s*false\s*\}\}\s*\/>/,
  );
  assert.match(
    rootLayout,
    /<Stack\.Screen\s+name=["']\(tabs\)["']\s+options=\{\{\s*headerShown:\s*false\s*\}\}\s*\/>/,
  );
  assert.match(
    rootLayout,
    /<Stack\.Screen\s+name=["']\+not-found["']\s+options=\{\{\s*headerShown:\s*false\s*\}\}\s*\/>/,
  );
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
