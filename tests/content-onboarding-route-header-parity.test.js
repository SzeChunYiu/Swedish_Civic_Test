const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { loadTsModule } = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary(...focusFlags) {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js', ...focusFlags], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('onboarding route title stays accessible as a header', () => {
  const summary = parseValidationSummary('--focus-onboarding-route-copy');
  const source = fs.readFileSync(path.join(repoRoot, 'app/onboarding.tsx'), 'utf8');

  assert.equal(summary.onboardingRouteHeadersValidated, 1);
  assert.equal(summary.onboardingRouteHeaderParityValidated, true);
  assert.equal(summary.onboardingRouteCopyLabelsValidated, 17);
  assert.equal(summary.onboardingRouteCopyParityValidated, true);
  assert.match(source, /type OnboardingCopy =/);
  assert.match(source, /const onboardingDailyGoalPresetValues = \[10, 20, 40\] as const;/);
  assert.match(source, /const onboardingCopy: Record<AppLanguage, OnboardingCopy> = \{/);
  assert.match(
    source,
    /const dailyGoalAnswers = useSettingsStore\(\(state\) => state\.dailyGoalAnswers\);/,
  );
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(
    source,
    /const setDailyGoalAnswers = useSettingsStore\(\(state\) => state\.setDailyGoalAnswers\);/,
  );
  assert.match(source, /const copy = onboardingCopy\[language\];/);
  assert.match(source, /Förbered dig lugnt för samhällskunskapsprovet/);
  assert.match(source, /genomgång av frågor du missat/);
  assert.doesNotMatch(source, /repetition av misstag|upprepning av misstag/i);
  assert.match(source, /Prepare calmly for the civic test/);
  assert.match(source, /Välj ett mjukt dagligt mål/);
  assert.match(source, /Choose a gentle daily goal/);
  assert.match(source, /Lugn/);
  assert.match(source, /Regular/);
  assert.match(source, /40 svar per dag/);
  assert.match(source, /accessibilityLabel=\{preset\.accessibilityLabel\}/);
  assert.match(source, /aria-selected=\{selected\}/);
  assert.match(source, /accessibilityState=\{\{ selected \}\}/);
  assert.match(source, /onPress=\{\(\) => setDailyGoalAnswers\(goal\)\}/);
  assert.match(source, /accessibilityLabel=\{copy\.decideLaterAccessibilityLabel\}/);
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  );
  assert.match(source, /accessibilityLabel=\{copy\.startStudyingAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.adjustSettingsAccessibilityLabel\}/);
  assert.doesNotMatch(source, /<Text style=\{styles\.title\}>/);
});

test('about-the-test marks the first-run guide as seen after mount', () => {
  const summary = parseValidationSummary('--focus-about-the-test-route-copy');
  const source = fs.readFileSync(path.join(repoRoot, 'app/about-the-test.tsx'), 'utf8');
  const seenEffectPattern =
    /useEffect\(\(\) => \{\s*if \(!hasSeenAboutTheTest\) \{\s*markAboutTheTestSeen\(\);\s*\}\s*\}, \[hasSeenAboutTheTest, markAboutTheTestSeen\]\);/;

  assert.equal(summary.aboutTheTestSeenEffectRulesValidated, 6);
  assert.equal(summary.aboutTheTestSeenEffectParityValidated, true);
  assert.match(source, /import \{ useEffect \} from 'react';/);
  assert.match(
    source,
    /const hasSeenAboutTheTest = useSettingsStore\(\(state\) => state\.hasSeenAboutTheTest\);/,
  );
  assert.match(
    source,
    /const markAboutTheTestSeen = useSettingsStore\(\(state\) => state\.markAboutTheTestSeen\);/,
  );
  assert.match(source, seenEffectPattern);
  assert.doesNotMatch(source, /useSettingsStore\.getState\(\)\.hasSeenAboutTheTest/);
  assert.doesNotMatch(source.replace(seenEffectPattern, ''), /markAboutTheTestSeen\(\);/);
});

test('first-run about modal suppresses onboarding without blocking study routes', () => {
  const summary = parseValidationSummary('--focus-onboarding-route-copy');
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/onboarding/FirstRunAboutTheTestModal.tsx'),
    'utf8',
  );
  const routeHelperSource = fs.readFileSync(
    path.join(repoRoot, 'lib/onboarding/firstRunAboutModalRoutes.ts'),
    'utf8',
  );
  const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
  const {
    FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES,
    shouldSuppressFirstRunAboutModalForPath,
  } = loadTsModule(repoRoot, 'lib/onboarding/firstRunAboutModalRoutes.ts');

  assert.equal(summary.firstRunAboutModalSuppressedRoutesValidated, 5);
  assert.equal(summary.firstRunAboutModalSuppressionParityValidated, true);
  assert.match(source, /shouldSuppressFirstRunAboutModalForPath\(pathname,/);
  assert.match(source, /FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES/);
  assert.doesNotMatch(source, /const SUPPRESSED_PATH_PREFIXES =/);
  assert.match(routeHelperSource, /export function shouldSuppressFirstRunAboutModalForPath/);
  assert.deepEqual(FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES, [
    '/exam',
    '/quiz',
    '/(auth)',
    '/about-the-test',
    '/onboarding',
  ]);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/onboarding'), true);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/onboarding/welcome'), true);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/exam'), true);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/quiz/session-1'), true);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/(auth)/sign-in'), true);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/about-the-test'), true);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/home'), false);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/practice'), false);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/learn'), false);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/mistakes'), false);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/profile'), false);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/quizmaster'), false);
  assert.equal(shouldSuppressFirstRunAboutModalForPath('/about-the-tested'), false);
  assert.match(adsSource, /'\/onboarding'/);
  assert.doesNotMatch(source, /'\/home'/);
  assert.doesNotMatch(source, /'\/learn'/);
  assert.doesNotMatch(source, /'\/practice'/);
  assert.doesNotMatch(source, /'\/mistakes'/);
  assert.doesNotMatch(source, /'\/profile'/);
});

test('first-run about modal suppression rejects dropping onboarding', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/onboarding/firstRunAboutModalRoutes.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("\\n  '/onboarding',", '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-onboarding-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /first-run about modal must suppress \/onboarding/,
  );
});

test('first-run about modal guide link keeps natural Swedish accessibility copy', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/onboarding/FirstRunAboutTheTestModal.tsx'),
    'utf8',
  );
  const staleGuideLabel = ['Öppna om-', 'provet-', 'guiden'].join('');

  assert.match(source, /open: 'Läs guiden'/);
  assert.match(source, /openAccessibilityLabel: 'Öppna guiden om medborgarskapsprovet'/);
  assert.match(source, /openAccessibilityLabel: 'Open the about-the-test guide'/);
  assert.match(source, /accessibilityLabel=\{copy\.openAccessibilityLabel\}/);
  assert.doesNotMatch(source, /\bmock\s*-?\s*prov(?:et)?\b/i);
  assert.doesNotMatch(source, new RegExp(staleGuideLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(source, /Öppna\s+om-[\s\S]*provet-[\s\S]*guiden/);
});

test('about-the-test first-run guide copy rejects mockprov wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/onboarding/FirstRunAboutTheTestModal.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'vad provet är, vem som ska göra det',
        'vad mock-prov är, vem som ska göra det',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-about-the-test-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /first-run about guide Swedish copy must use övningsprov wording, not mockprov\/mock-provet/,
  );
});

test('about-the-test seen-effect parity rejects removing the mount effect', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
const seenEffect = 'useEffect(() => {\\n    if (!hasSeenAboutTheTest) {\\n      markAboutTheTestSeen();\\n    }\\n  }, [hasSeenAboutTheTest, markAboutTheTestSeen]);';
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(seenEffect, 'const seenEffectWasRemovedForTest = true;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-about-the-test-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route missing effect-scoped seen marker for first-run seen effect/,
  );
});

test('about-the-test seen-effect parity rejects render-time settings writes', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
const seenEffect = 'useEffect(() => {\\n    if (!hasSeenAboutTheTest) {\\n      markAboutTheTestSeen();\\n    }\\n  }, [hasSeenAboutTheTest, markAboutTheTestSeen]);';
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/about-the-test.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        seenEffect,
        'if (!useSettingsStore.getState().hasSeenAboutTheTest) {\\n    markAboutTheTestSeen();\\n  }',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-about-the-test-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route must subscribe to hasSeenAboutTheTest instead of reading useSettingsStore\.getState\(\) during render/,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /about-the-test route must call markAboutTheTestSeen\(\) only inside useEffect/,
  );
});

test('onboarding route header parity rejects a dropped title header role', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/onboarding.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.title}>',
        '<Text style={styles.title}>'
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-onboarding-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /onboarding route title text must expose accessibilityRole="header"/,
  );
});

test('onboarding route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/onboarding.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = onboardingCopy[language];', 'const copy = onboardingCopy.en;');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-onboarding-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /onboarding route must select copy from settings language/,
  );
});

test('onboarding route copy parity rejects missing Swedish shell copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/onboarding.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "'Förbered dig lugnt för samhällskunskapsprovet'",
        "'Prepare calmly for the civic test'",
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-onboarding-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /onboarding route is missing sv copy/);
});

test('onboarding route copy parity rejects Swedish mistake-repetition wording', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/onboarding.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'genomgång av frågor du missat',
        'repetition av misstag',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-onboarding-route-copy');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /onboarding route Swedish mistake-review copy must describe reviewing missed questions/,
  );
});
