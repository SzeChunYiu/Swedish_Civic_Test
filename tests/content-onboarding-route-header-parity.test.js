const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

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
  assert.match(source, /import \{ formatExamDate, type StudyIntensity \}/);
  assert.match(source, /normalizeStudyPlanTestDateIso/);
  assert.match(source, /supportedDailyGoalAnswerOptions,/);
  assert.match(
    source,
    /type DailyGoalPresetValue = Exclude<\(typeof supportedDailyGoalAnswerOptions\)\[number\], 5>;/,
  );
  assert.match(
    source,
    /supportedDailyGoalAnswerOptions\.filter\(isOnboardingDailyGoalPresetValue\)/,
  );
  assert.doesNotMatch(source, /const\s+onboardingDailyGoalPresetValues[\s\S]{0,120}=\s*\[/);
  assert.match(source, /const onboardingCopy: Record<AppLanguage, OnboardingCopy> = \{/);
  assert.match(
    source,
    /const dailyGoalAnswers = useSettingsStore\(\(state\) => state\.dailyGoalAnswers\);/,
  );
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(
    source,
    /const markOnboardingComplete = useSettingsStore\(\(state\) => state\.markOnboardingComplete\);/,
  );
  assert.match(
    source,
    /const setDailyGoalAnswers = useSettingsStore\(\(state\) => state\.setDailyGoalAnswers\);/,
  );
  assert.match(
    source,
    /const setStudyPlanIntensity = useSettingsStore\(\(state\) => state\.setStudyPlanIntensity\);/,
  );
  assert.match(
    source,
    /const setStudyPlanTestDateIso = useSettingsStore\(\(state\) => state\.setStudyPlanTestDateIso\);/,
  );
  assert.match(
    source,
    /const studyPlanTestDateIso = useSettingsStore\(\(state\) => state\.studyPlanTestDateIso\);/,
  );
  assert.match(source, /const copy = onboardingCopy\[language\];/);
  assert.match(source, /function studyIntensityForDailyGoal\(goal: DailyGoalPresetValue\)/);
  assert.match(source, /if \(goal === 10\) return 'casual';/);
  assert.match(source, /if \(goal === 40\) return 'serious';/);
  assert.match(source, /const handleDailyGoalPress = \(goal: DailyGoalPresetValue\) => \{/);
  assert.match(source, /setStudyPlanIntensity\(studyIntensityForDailyGoal\(goal\)\);/);
  assert.match(source, /const handleTestDateChange = \(value: string\) => \{/);
  assert.match(source, /const normalizedDate = normalizeStudyPlanTestDateIso\(nextValue\);/);
  assert.match(source, /setStudyPlanTestDateIso\(normalizedDate\);/);
  assert.match(source, /const handleSkipTestDate = \(\) => \{/);
  assert.match(source, /setStudyPlanTestDateIso\(null\);/);
  assert.match(source, /Förbered dig lugnt för samhällskunskapsprovet/);
  assert.match(source, /genomgång av frågor du missat/);
  assert.doesNotMatch(source, /repetition av misstag|upprepning av misstag/i);
  assert.match(source, /Prepare calmly for the civic test/);
  assert.match(source, /Välj ett mjukt dagligt mål/);
  assert.match(source, /Choose a gentle daily goal/);
  assert.match(source, /När är ditt prov\?/);
  assert.match(source, /When is your test\?/);
  assert.match(source, /Ange provdatum som ÅÅÅÅ-MM-DD/);
  assert.match(source, /Enter test date as YYYY-MM-DD/);
  assert.match(source, /testDateInvalidStatusLabel: 'Kontrollera datumet:'/);
  assert.match(source, /testDateInvalidStatusLabel: 'Check date:'/);
  assert.match(source, /testDateSavedStatusLabel: 'Sparat:'/);
  assert.match(source, /testDateSavedStatusLabel: 'Saved:'/);
  assert.match(source, /Jag har inte bokat än/);
  assert.match(source, /I haven't booked it yet/);
  assert.doesNotMatch(source, /Get a daily plan|questions\/day|mocks this week|59 kr/);
  assert.match(source, /Lugn/);
  assert.match(source, /Regular/);
  assert.match(source, /40 svar per dag/);
  assert.match(source, /aria-label=\{copy\.dailyGoalTitle\}/);
  assert.match(source, /accessibilityLabel=\{copy\.dailyGoalTitle\}/);
  assert.match(source, /accessibilityRole="radiogroup"/);
  assert.match(source, /accessibilityLabel=\{preset\.accessibilityLabel\}/);
  assert.match(source, /aria-checked=\{selected\}/);
  assert.match(source, /accessibilityRole="radio"/);
  assert.match(source, /accessibilityState=\{\{ checked: selected \}\}/);
  assert.doesNotMatch(source, /aria-selected=\{selected\}/);
  assert.doesNotMatch(source, /accessibilityState=\{\{ selected \}\}/);
  assert.match(source, /onPress=\{\(\) => handleDailyGoalPress\(goal\)\}/);
  assert.match(source, /<TextInput/);
  assert.match(source, /accessibilityLabel=\{copy\.testDateInputAccessibilityLabel\}/);
  assert.match(source, /placeholder=\{copy\.testDateInputPlaceholder\}/);
  assert.match(source, /accessibilityHint=\{copy\.testDateSubtitle\}/);
  assert.match(source, /aria-describedby=\{testDateFeedbackMeta \? testDateFeedbackId : undefined\}/);
  assert.match(source, /aria-invalid=\{testDateFeedback === 'invalid' \? true : undefined\}/);
  assert.match(source, /keyboardType="numbers-and-punctuation"/);
  assert.match(source, /maxLength=\{10\}/);
  assert.match(source, /nativeID=\{testDateFeedbackId\}/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /styles\.testDateInputInvalid/);
  assert.match(source, /styles\.testDateInputSaved/);
  assert.match(source, /styles\.testDateFeedbackInvalid/);
  assert.match(source, /styles\.testDateFeedbackSaved/);
  assert.match(source, /accessibilityLabel=\{copy\.testDateSkipAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.decideLaterAccessibilityLabel\}/);
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  );
  assert.match(source, /accessibilityLabel=\{copy\.startStudyingAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.adjustSettingsAccessibilityLabel\}/);
  assert.match(
    source,
    /const handleCompleteOnboarding = \(\) => \{\s*markOnboardingComplete\(\);\s*\};/,
  );
  assert.equal(source.match(/onPress=\{handleCompleteOnboarding\}/g)?.length, 4);
  assert.doesNotMatch(source, /<Text style=\{styles\.title\}>/);
});

test('root entrypoint sends fresh learners to onboarding and keeps revisit links', () => {
  const indexSource = fs.readFileSync(path.join(repoRoot, 'app/index.tsx'), 'utf8');
  const settingsSource = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/settingsStore.ts'),
    'utf8',
  );
  const modalSource = fs.readFileSync(
    path.join(repoRoot, 'components/onboarding/FirstRunAboutTheTestModal.tsx'),
    'utf8',
  );
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const profileSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');

  assert.match(
    indexSource,
    /const hasCompletedOnboarding = useSettingsStore\(\(state\) => state\.hasCompletedOnboarding\);/,
  );
  assert.match(
    indexSource,
    /<Redirect href=\{hasCompletedOnboarding \? '\/home' : '\/onboarding'\} \/>/,
  );
  assert.match(settingsSource, /const hasCompletedOnboardingKey = 'hasCompletedOnboarding';/);
  assert.match(
    settingsSource,
    /function readHasCompletedOnboarding\(\): boolean \{\s*const storedValue = readStorageBoolean\(hasCompletedOnboardingKey\);\s*return storedValue \?\? readHasSeenAboutTheTest\(\);\s*\}/,
  );
  assert.match(
    settingsSource,
    /settings\.hasCompletedOnboarding === undefined && settings\.hasSeenAboutTheTest === true/,
  );
  assert.match(settingsSource, /markOnboardingComplete: \(\) => void;/);
  assert.match(settingsSource, /set\(\{ hasCompletedOnboarding: true, persistenceWarning \}\);/);
  assert.match(
    modalSource,
    /const hasCompletedOnboarding = useSettingsStore\(\(state\) => state\.hasCompletedOnboarding\);/,
  );
  assert.match(modalSource, /if \(!hasCompletedOnboarding\) return null;/);
  assert.match(homeSource, /revisitSetupAccessibilityLabel/);
  assert.match(homeSource, /href="\/onboarding"/);
  assert.match(profileSource, /studySetupOnboardingAccessibilityLabel/);
  assert.match(profileSource, /href="\/onboarding"/);
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
  const routePolicySource = fs.readFileSync(
    path.join(repoRoot, 'lib/onboarding/firstRunAboutModalRoutes.ts'),
    'utf8',
  );
  const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');

  assert.equal(summary.firstRunAboutModalSuppressedRoutesValidated, 11);
  assert.equal(summary.firstRunAboutModalSuppressionParityValidated, true);
  assert.match(source, /FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES/);
  assert.match(
    source,
    /shouldSuppressFirstRunAboutModalForPath\(pathname, suppressedPathPrefixes\)/,
  );
  assert.doesNotMatch(source, /function pathIsSuppressed|const SUPPRESSED_PATH_PREFIXES/);
  assert.match(routePolicySource, /export const FIRST_RUN_ABOUT_MODAL_SUPPRESSED_PATH_PREFIXES/);
  assert.match(routePolicySource, /export const FIRST_RUN_ABOUT_MODAL_STUDY_PATH_PREFIXES/);
  assert.match(routePolicySource, /export const FIRST_RUN_ABOUT_MODAL_SELF_SEEN_PATH_PREFIXES/);
  assert.match(routePolicySource, /export function shouldSuppressFirstRunAboutModalForPath/);
  assert.match(routePolicySource, /'\/onboarding'/);
  assert.match(routePolicySource, /'\/citizenship-requirements'/);
  assert.match(routePolicySource, /'\/disclaimer'/);
  assert.match(routePolicySource, /'\/privacy'/);
  assert.match(routePolicySource, /'\/sources'/);
  assert.match(routePolicySource, /'\/support'/);
  assert.match(routePolicySource, /'\/terms'/);
  assert.match(adsSource, /'\/onboarding'/);
  assert.match(routePolicySource, /FIRST_RUN_ABOUT_MODAL_STUDY_PATH_PREFIXES = \[[\s\S]*'\/home'/);
  assert.match(routePolicySource, /FIRST_RUN_ABOUT_MODAL_STUDY_PATH_PREFIXES = \[[\s\S]*'\/learn'/);
  assert.match(
    routePolicySource,
    /FIRST_RUN_ABOUT_MODAL_STUDY_PATH_PREFIXES = \[[\s\S]*'\/practice'/,
  );
  assert.match(
    routePolicySource,
    /FIRST_RUN_ABOUT_MODAL_STUDY_PATH_PREFIXES = \[[\s\S]*'\/mistakes'/,
  );
  assert.match(
    routePolicySource,
    /FIRST_RUN_ABOUT_MODAL_STUDY_PATH_PREFIXES = \[[\s\S]*'\/profile'/,
  );
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

test('first-run about modal suppression rejects launch compliance route drift', () => {
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
      .replace("\\n  '/privacy',", '');
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
    /first-run about modal must suppress \/privacy/,
  );
});

test('first-run about modal guide link keeps natural Swedish accessibility copy', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/onboarding/FirstRunAboutTheTestModal.tsx'),
    'utf8',
  );
  const staleGuideLabel = ['Öppna om-', 'provet-', 'guiden'].join('');

  assert.match(source, /const firstRunAboutDialogTitleId = 'first-run-about-dialog-title';/);
  assert.match(source, /const firstRunAboutDialogBodyId = 'first-run-about-dialog-body';/);
  assert.match(source, /aria-labelledby=\{firstRunAboutDialogTitleId\}/);
  assert.match(source, /aria-describedby=\{firstRunAboutDialogBodyId\}/);
  assert.match(source, /accessibilityViewIsModal/);
  assert.match(source, /<Pressable\s+accessible=\{false\}[\s\S]*styles\.backdrop/);
  assert.match(source, /nativeID=\{firstRunAboutDialogTitleId\}/);
  assert.match(source, /nativeID=\{firstRunAboutDialogBodyId\}/);
  assert.match(source, /open: 'Läs guiden'/);
  assert.match(source, /openAccessibilityLabel: 'Öppna guiden om medborgarskapsprovet'/);
  assert.match(source, /openAccessibilityLabel: 'Open the about-the-test guide'/);
  assert.match(source, /accessibilityLabel=\{copy\.openAccessibilityLabel\}/);
  assert.doesNotMatch(source, /\bmock\s*-?\s*prov(?:et)?\b/i);
  assert.doesNotMatch(source, new RegExp(staleGuideLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(source, /Öppna\s+om-[\s\S]*provet-[\s\S]*guiden/);
});

test('first-run about modal resolves styles from active ThemeColors', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/onboarding/FirstRunAboutTheTestModal.tsx'),
    'utf8',
  );

  assert.match(source, /type ThemeColors/);
  assert.match(source, /useResolvedThemeColors/);
  assert.match(source, /themeColors\?: ThemeColors;/);
  assert.match(source, /const resolvedThemeColors = useResolvedThemeColors\(themeColors\);/);
  assert.match(
    source,
    /const styles = useMemo\(\(\) => createStyles\(resolvedThemeColors\), \[resolvedThemeColors\]\);/,
  );
  assert.match(source, /function createStyles\(themeColors: ThemeColors\)/);
  assert.match(source, /testID="first-run-about-modal-card"/);
  assert.match(source, /testID="first-run-about-modal-primary-action"/);
  assert.match(source, /backgroundColor: themeColors\.surfaceMuted/);
  assert.match(source, /backgroundColor: themeColors\.focusSoft/);
  assert.match(source, /backgroundColor: themeColors\.surface/);
  assert.match(source, /borderColor: themeColors\.border/);
  assert.match(source, /color: themeColors\.badgeBlueText/);
  assert.match(source, /color: themeColors\.text/);
  assert.match(source, /color: themeColors\.textSecondary/);
  assert.match(source, /backgroundColor: themeColors\.accent/);
  assert.match(source, /backgroundColor: themeColors\.accentActive/);
  assert.match(source, /backgroundColor: themeColors\.surfaceWarm/);
  assert.match(source, /color: themeColors\.textMuted/);
  assert.doesNotMatch(source, /\bcolors\./);
  assert.doesNotMatch(source, /import \{[^}]*\bcolors\b/);
});

test('onboarding route resolves styles from active ThemeColors', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/onboarding.tsx'), 'utf8');

  assert.match(source, /type ThemeColors/);
  assert.match(source, /useThemeColors/);
  assert.match(source, /const themeColors = useThemeColors\(\);/);
  assert.match(
    source,
    /const styles = useMemo\(\(\) => createStyles\(themeColors\), \[themeColors\]\);/,
  );
  assert.match(source, /function createStyles\(themeColors: ThemeColors\)/);
  assert.match(source, /testID="onboarding-hero"/);
  assert.match(source, /testID="onboarding-goal-section"/);
  assert.match(source, /testID="onboarding-test-date-section"/);
  assert.match(source, /backgroundColor: themeColors\.surface/);
  assert.match(source, /backgroundColor: themeColors\.surfaceWarm/);
  assert.match(source, /backgroundColor: themeColors\.badgeBlueBg/);
  assert.match(source, /borderColor: themeColors\.border/);
  assert.match(source, /borderColor: themeColors\.badgeBlueText/);
  assert.match(source, /borderColor: themeColors\.focus/);
  assert.match(source, /color: themeColors\.badgeBlueText/);
  assert.match(source, /color: themeColors\.text/);
  assert.match(source, /color: themeColors\.textSecondary/);
  assert.match(source, /color: themeColors\.textMuted/);
  assert.match(source, /placeholderTextColor=\{themeColors\.textMuted\}/);
  assert.match(source, /<QuestionDisclaimer themeColors=\{themeColors\}/);
  assert.doesNotMatch(source, /\bcolors\./);
  assert.doesNotMatch(source, /import \{[^}]*\bcolors\b/);
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

test('onboarding route copy parity rejects selected-button daily goal presets', () => {
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
      .replace('aria-checked={selected}', 'aria-selected={selected}')
      .replace('accessibilityRole="radio"', 'accessibilityRole="button"')
      .replace('accessibilityState={{ checked: selected }}', 'accessibilityState={{ selected }}');
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
    /onboarding daily goal presets must use radiogroup\/radio checked semantics/,
  );
});

test('onboarding route copy parity rejects unsupported daily goal presets', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/app/onboarding.tsx')) {
    return String(contents).replaceAll('20: {', '50: {');
  }
  return contents;
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
    /onboarding daily goal preset 50 must be supported by settingsStore/,
  );
});

test('onboarding route copy parity rejects inline daily goal preset tuples', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/app/onboarding.tsx')) {
    return String(contents).replace(
      'const onboardingDailyGoalPresetValues: readonly DailyGoalPresetValue[] =\\n  supportedDailyGoalAnswerOptions.filter(isOnboardingDailyGoalPresetValue);',
      'const onboardingDailyGoalPresetValues = [10, 20, 40] as const;',
    );
  }
  return contents;
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
    /onboarding daily goal preset values must derive from supported settings options|onboarding daily goal preset values must not be an inline numeric tuple/,
  );
});
