const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const architectureTargetFiles = [
  'app/_layout.tsx',
  'app/index.tsx',
  'app/onboarding.tsx',
  'app/(tabs)/home.tsx',
  'app/(tabs)/learn.tsx',
  'app/(tabs)/practice.tsx',
  'app/(tabs)/exam.tsx',
  'app/(tabs)/mistakes.tsx',
  'app/(tabs)/profile.tsx',
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

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

test('architecture target scaffold files exist', () => {
  assert.deepEqual(
    architectureTargetFiles.filter((relativePath) => !exists(relativePath)),
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
