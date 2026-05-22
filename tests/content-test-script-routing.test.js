const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { FOCUSED_VALIDATION_REGISTRY_BY_ID } = require('../scripts/validate-content-focus-registry');
const {
  MALFORMED_ADAPTIVE_PRACTICE_DIFFICULTY_CASES,
  MALFORMED_ADAPTIVE_PRACTICE_SIZE_CASES,
} = require('./helpers/adaptivePracticeRuntimeFixtures.cjs');

const repoRoot = path.resolve(__dirname, '..');

function readPackageJson() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
}

function createFakeNpm(tmpDir) {
  const fakeNpm = path.join(tmpDir, 'npm');
  fs.writeFileSync(
    fakeNpm,
    ['#!/bin/sh', 'printf "%s\\n" "$*" >> "$TEST_DISPATCH_LOG"', 'exit 0', ''].join('\n'),
    { mode: 0o755 },
  );
  return fakeNpm;
}

function createFakeNode(tmpDir) {
  const fakeNode = path.join(tmpDir, 'node');
  fs.writeFileSync(
    fakeNode,
    ['#!/bin/sh', 'printf "%s\\n" "$@" >> "$TEST_DISPATCH_LOG"', 'exit 0', ''].join('\n'),
    { mode: 0o755 },
  );
  return fakeNode;
}

function runDispatcher(args, env) {
  return spawnSync(process.execPath, ['scripts/test-dispatch.js', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
}

function runPackageScript(script, args, env) {
  return spawnSync('npm', ['run', script, '--', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
}

function runPackageTest(args, env) {
  return spawnSync('npm', ['test', '--', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env,
  });
}

function countSourceOccurrences(source, token) {
  return source.match(new RegExp(`\\b${token}\\b`, 'g'))?.length ?? 0;
}

test('Playwright dist-web server reuse is explicit and worktree-bound', () => {
  const playwrightConfigSource = fs.readFileSync(
    path.join(repoRoot, 'playwright.config.ts'),
    'utf8',
  );
  const serveDistWebSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/serve-dist-web.cjs'),
    'utf8',
  );

  assert.match(
    playwrightConfigSource,
    /const e2ePort = Number\(process\.env\.E2E_PORT \?\? DEFAULT_E2E_PORT\);/,
    'Playwright must keep the E2E_PORT override for unique local ports',
  );
  assert.match(
    playwrightConfigSource,
    /PORT=\$\{e2ePort\} node tests\/e2e\/serve-dist-web\.cjs/,
    'Playwright must pass the selected E2E_PORT to the dist-web server',
  );
  assert.match(
    playwrightConfigSource,
    /process\.env\.E2E_REUSE_EXISTING_SERVER === '1' && !process\.env\.CI/,
    'local server reuse must require E2E_REUSE_EXISTING_SERVER=1 while CI keeps reuse disabled',
  );
  assert.match(
    playwrightConfigSource,
    /reuseExistingServer,\s*\n\s*timeout:/,
    'Playwright webServer must use the guarded reuseExistingServer value',
  );
  assert.doesNotMatch(
    playwrightConfigSource,
    /reuseExistingServer:\s*!process\.env\.CI|reuseExistingServer:\s*true/,
    'local Playwright must not silently reuse any server already listening on the default port',
  );
  assert.doesNotMatch(
    playwrightConfigSource,
    /DIST_WEB_ROOT=/,
    'Playwright must serve this worktree default dist-web path instead of pointing at another root',
  );
  assert.match(
    serveDistWebSource,
    /path\.join\(__dirname, '\.\.\/\.\.\/dist-web'\)/,
    'serve-dist-web must default to the invoking worktree dist-web directory',
  );
});

test('npm test keeps selector routing in the project dispatcher', () => {
  const pkg = readPackageJson();
  const testContentScript = pkg.scripts['test:content'];
  const studyReminderParitySource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-study-reminder-runtime-parity.test.js'),
    'utf8',
  );
  const weeklyRecapParitySource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-weekly-recap-runtime-parity.test.js'),
    'utf8',
  );

  assert.equal(pkg.scripts.test, 'node scripts/test-dispatch.js');
  assert.doesNotMatch(pkg.scripts.test, /&&/);
  assert.match(testContentScript, /tests\/content-test-script-routing\.test\.js/);
  assert.equal(
    (testContentScript.match(/tests\/content-study-reminder-runtime-parity\.test\.js/g) ?? [])
      .length,
    1,
    'test:content must include the study reminder runtime parity guard exactly once',
  );
  assert.equal(
    (testContentScript.match(/tests\/content-weekly-recap-runtime-parity\.test\.js/g) ?? []).length,
    1,
    'test:content must include the weekly recap runtime parity guard exactly once',
  );
  assert.equal(
    (testContentScript.match(/tests\/content-route-link-accessibility-parity\.test\.js/g) ?? [])
      .length,
    1,
    'test:content must include the RouteLink accessibility parity guard exactly once',
  );
  assert.equal(
    (testContentScript.match(/tests\/content-topbar-actions-accessibility-parity\.test\.js/g) ?? [])
      .length,
    1,
    'test:content must include the TopBarActions accessibility parity guard exactly once',
  );
  assert.equal(
    pkg.scripts['test:content-focused'],
    'node scripts/test-dispatch.js content-focused',
  );
  assert.equal(
    pkg.scripts['test:correct-display-position'],
    [
      'npm run test:answer-shuffle',
      'npm run test:static-site-answer-shuffle',
      'node scripts/validate-content.js --focus-answer-shuffle-parity',
    ].join(' && '),
  );
  assert.doesNotMatch(
    pkg.scripts['test:correct-display-position'],
    /test:content|test:all|validate:content(?!\.js --focus-answer-shuffle-parity)/,
    'correct-display-position must stay limited to the P0 answer-shuffle acceptance bundle',
  );
  assert.match(
    studyReminderParitySource,
    /lib\/notifications\/studyReminderRouting\.ts/,
    'study reminder content parity must cover notification tap routing helpers',
  );
  assert.match(
    weeklyRecapParitySource,
    /--focus-weekly-recap-runtime/,
    'weekly recap content parity must execute the focused weekly recap runtime validator',
  );
  assert.doesNotMatch(
    weeklyRecapParitySource,
    /\['scripts\/validate-content\.js'\]/,
    'weekly recap content parity must not route through full content validation',
  );
});

test('QuestionCard accessibility parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const questionCardTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-question-card-accessibility-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-question-card-accessibility/);
  assert.match(
    validatorSource,
    /validateQuestionCardAccessibilityParity\(\);[\s\S]*questionCardAccessibilityRulesValidated[\s\S]*questionCardAccessibilityParityValidated/,
  );
  assert.match(questionCardTestSource, /--focus-question-card-accessibility/);
  assert.doesNotMatch(
    questionCardTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'QuestionCard accessibility tests must not route through full content validation',
  );
});

test('app config schema parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const appConfigTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-app-config-schema.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-app-config-schema/);
  assert.match(
    validatorSource,
    /validateAppConfigSchema\(\);[\s\S]*validateWebDocumentMetadataUsageParity\(\);[\s\S]*validateStaticHeadMetadataParity\(\);[\s\S]*appConfigSchemaValidated[\s\S]*webDocumentMetadataUsageParityValidated[\s\S]*staticHeadMetadataParityValidated/,
  );
  assert.match(appConfigTestSource, /--focus-app-config-schema/);
  assert.doesNotMatch(
    appConfigTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'app config schema tests must not route through full content validation',
  );
});

test('ChapterCard accessibility parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const chapterCardTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-chapter-card-accessibility-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-chapter-card-accessibility/);
  assert.match(
    validatorSource,
    /validateChapterCardAccessibilityParity\(\);[\s\S]*chapterCardAccessibilityRulesValidated[\s\S]*chapterCardAccessibilityParityValidated/,
  );
  assert.match(chapterCardTestSource, /--focus-chapter-card-accessibility/);
  assert.doesNotMatch(
    chapterCardTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'ChapterCard accessibility tests must not route through full content validation',
  );
});

test('LegalSection rendering focus registry lists granular summary keys', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('legalSectionRendering');

  assert.ok(registryEntry, 'LegalSection rendering focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-legal-section-rendering']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'legalSectionRenderingTestsRoutedValidated',
    'legalSectionRenderingCasesValidated',
    'legalSectionWhitespaceTextValidated',
    'legalSectionFragmentChildrenValidated',
    'legalSectionRawTextUnderViewValidated',
    'legalSectionRenderingParityValidated',
  ]);
  assert.match(validatorSource, /--focus-legal-section-rendering/);
  assert.match(
    validatorSource,
    /legalSectionRenderingTestsRoutedValidated[\s\S]*legalSectionWhitespaceTextValidated[\s\S]*legalSectionFragmentChildrenValidated[\s\S]*legalSectionRawTextUnderViewValidated[\s\S]*legalSectionRenderingParityValidated/,
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-legal-section-rendering'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused LegalSection validation should print a JSON summary');
  const summary = JSON.parse(match[0]);

  for (const key of registryEntry.summaryKeys) {
    assert.ok(Object.prototype.hasOwnProperty.call(summary, key), `${key} is present`);
  }
  assert.equal(summary.legalSectionRenderingTestsRoutedValidated, true);
  assert.equal(summary.legalSectionRenderingCasesValidated, 3);
  assert.equal(summary.legalSectionWhitespaceTextValidated, true);
  assert.equal(summary.legalSectionFragmentChildrenValidated, true);
  assert.equal(summary.legalSectionRawTextUnderViewValidated, true);
  assert.equal(summary.legalSectionRenderingParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});

test('mock exam copy parity focus registry executes a narrow summary', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const mockExamRuntimeTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-mock-exam-runtime-parity.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('mockExamCopyParity');

  assert.ok(registryEntry, 'mock exam copy focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-mock-exam-copy-parity']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'nativeMockExamComponentCopyLabelsValidated',
    'nativeMockExamComponentLegalCopyValidated',
    'nativeMockExamLibraryLabelsValidated',
    'nativeMockExamScoreSourceCopyValidated',
    'nativeMockExamSwedishCopyNaturalnessValidated',
    'nativeMockExamTierCopyValidated',
  ]);
  assert.match(validatorSource, /--focus-mock-exam-copy-parity/);
  assert.match(
    validatorSource,
    /validateNativeMockExamComponentLegalCopy\(\);[\s\S]*validateNativeMockExamLibraryAndTierCopy\(\);[\s\S]*nativeMockExamLibraryLabelsValidated[\s\S]*nativeMockExamTierCopyValidated/,
  );
  assert.match(mockExamRuntimeTestSource, /--focus-mock-exam-copy-parity/);
  assert.match(mockExamRuntimeTestSource, /provexamen and provexamina regressions/);
  assert.match(mockExamRuntimeTestSource, /weakened English Mock Exam labels/);

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-mock-exam-copy-parity'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused mock exam copy validation should print a JSON summary');
  const summary = JSON.parse(match[0]);

  for (const key of registryEntry.summaryKeys) {
    assert.ok(Object.prototype.hasOwnProperty.call(summary, key), `${key} is present`);
  }
  assert.equal(summary.nativeMockExamComponentCopyLabelsValidated, 6);
  assert.equal(summary.nativeMockExamComponentLegalCopyValidated, true);
  assert.equal(summary.nativeMockExamLibraryLabelsValidated, 7);
  assert.equal(summary.nativeMockExamScoreSourceCopyValidated, true);
  assert.equal(summary.nativeMockExamSwedishCopyNaturalnessValidated, true);
  assert.equal(summary.nativeMockExamTierCopyValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});

test('ProgressBar accessibility parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const progressBarTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-progress-bar-accessibility-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-progress-bar-accessibility/);
  assert.match(
    validatorSource,
    /validateProgressBarAccessibilityParity\(\);[\s\S]*progressBarAccessibilityRulesExpected[\s\S]*progressBarAccessibilityRulesValidated[\s\S]*progressBarAccessibilityParityValidated/,
  );
  assert.match(progressBarTestSource, /--focus-progress-bar-accessibility/);
  assert.doesNotMatch(
    progressBarTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'ProgressBar accessibility tests must not route through full content validation',
  );
});

test('CelebrationBurst accessibility parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const celebrationBurstTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-celebration-burst-accessibility-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-celebration-burst-accessibility/);
  assert.match(
    validatorSource,
    /validateCelebrationBurstAccessibilityParity\(\);[\s\S]*celebrationBurstAccessibilityRulesValidated[\s\S]*celebrationBurstAccessibilityParityValidated/,
  );
  assert.match(celebrationBurstTestSource, /--focus-celebration-burst-accessibility/);
  assert.doesNotMatch(
    celebrationBurstTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'CelebrationBurst accessibility tests must not route through full content validation',
  );
});

test('UHRReferenceCard accessibility parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const uhrReferenceCardTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-uhr-reference-card-accessibility-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-uhr-reference-card-accessibility/);
  assert.match(
    validatorSource,
    /validateUhrReferenceCardAccessibilityParity\(\);[\s\S]*uhrReferenceCardAccessibilityRulesValidated[\s\S]*uhrReferenceCardAccessibilityParityValidated/,
  );
  assert.match(uhrReferenceCardTestSource, /--focus-uhr-reference-card-accessibility/);
  assert.doesNotMatch(
    uhrReferenceCardTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'UHRReferenceCard accessibility tests must not route through full content validation',
  );
});

test('SourceCitation accessibility parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const sourceCitationTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-source-citation-accessibility-parity.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('sourceCitationAccessibility');

  assert.ok(registryEntry, 'SourceCitation accessibility focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-source-citation-accessibility']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'sourceCitationAccessibilityRulesValidated',
    'sourceCitationAccessibilityParityValidated',
  ]);
  assert.match(validatorSource, /--focus-source-citation-accessibility/);
  assert.match(
    validatorSource,
    /validateSourceCitationAccessibilityParity\(\);[\s\S]*sourceCitationAccessibilityRulesValidated[\s\S]*sourceCitationAccessibilityParityValidated/,
  );
  assert.match(sourceCitationTestSource, /--focus-source-citation-accessibility/);
  assert.doesNotMatch(
    sourceCitationTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'SourceCitation accessibility tests must not route through full content validation',
  );
});

test('theme token schema uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const contentThemeTokenTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-theme-token-schema.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('themeTokenSchema');

  assert.ok(registryEntry, 'theme token schema focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-theme-token-schema']);
  assert.match(validatorSource, /--focus-theme-token-schema/);
  assert.match(
    validatorSource,
    /validateThemeTokenSchema\(\);[\s\S]*themeBorderWidthTokenFilesValidated[\s\S]*themeTokenSchemaValidated/,
  );
  assert.match(contentThemeTokenTestSource, /--focus-theme-token-schema/);
  assert.doesNotMatch(
    contentThemeTokenTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'theme token schema tests must not route through full content validation',
  );
});

test('Onboarding route scroll parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const onboardingScrollTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-onboarding-route-scroll-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-onboarding-route-scroll/);
  assert.match(
    validatorSource,
    /validateOnboardingRouteScrollParity\(\);[\s\S]*onboardingRouteScrollRulesValidated[\s\S]*onboardingRouteScrollParityValidated/,
  );
  assert.match(onboardingScrollTestSource, /--focus-onboarding-route-scroll/);
  assert.doesNotMatch(
    onboardingScrollTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'Onboarding route scroll tests must not route through full content validation',
  );
  assert.doesNotMatch(
    onboardingScrollTestSource,
    /import \\{ Pressable, ScrollView, StyleSheet, Text, View \\}/,
    'Onboarding route scroll tests must not require one exact react-native import list',
  );
});

test('Settings route scroll parity uses focused structural content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const settingsRouteTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-settings-route-copy-parity.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('settingsRouteScroll');

  assert.ok(registryEntry, 'Settings route scroll focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-settings-route-scroll']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'settingsRouteScrollRulesValidated',
    'settingsRouteScrollParityValidated',
  ]);
  assert.match(validatorSource, /--focus-settings-route-scroll/);
  assert.match(
    validatorSource,
    /validateSettingsRouteScrollParity\(\);[\s\S]*settingsRouteScrollRulesValidated[\s\S]*settingsRouteScrollParityValidated/,
  );
  assert.match(settingsRouteTestSource, /--focus-settings-route-scroll/);
  assert.doesNotMatch(
    settingsRouteTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'Settings route scroll tests must not route through full content validation',
  );
  assert.match(settingsRouteTestSource, /accepts compact or reordered react-native imports/);
  assert.doesNotMatch(
    validatorSource,
    /Pressable,\[\\s\\S\]\*ScrollView,\[\\s\\S\]\*StyleSheet/,
    'Settings route scroll validator must not require one exact react-native import order',
  );
});

test('Badge accessibility parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const badgeTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-badge-accessibility-parity.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('badgeAccessibility');

  assert.ok(registryEntry, 'Badge accessibility focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-badge-accessibility']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'badgeAccessibilityRulesValidated',
    'badgeAccessibilityParityValidated',
  ]);
  assert.match(validatorSource, /--focus-badge-accessibility/);
  assert.match(
    validatorSource,
    /validateBadgeAccessibilityParity\(\);[\s\S]*badgeAccessibilityRulesValidated[\s\S]*badgeAccessibilityParityValidated/,
  );
  assert.match(badgeTestSource, /--focus-badge-accessibility/);
  assert.doesNotMatch(
    badgeTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'Badge accessibility tests must not route through full content validation',
  );
  const mutationFocusPushes =
    badgeTestSource.match(/process\.argv\.push\('\$\{BADGE_ACCESSIBILITY_FOCUS_FLAG\}'\)/g) ?? [];
  assert.equal(
    mutationFocusPushes.length,
    2,
    'Badge accessibility mutation fixtures must both route through the focused validator',
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-badge-accessibility'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused Badge validation should print a JSON summary');
  const summary = JSON.parse(match[0]);

  for (const key of registryEntry.summaryKeys) {
    assert.ok(Object.prototype.hasOwnProperty.call(summary, key), `${key} is present`);
  }
  assert.equal(summary.badgeAccessibilityRulesValidated, 9);
  assert.equal(summary.badgeAccessibilityParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});
test('Flashcard accessibility parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const flashcardTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-flashcard-accessibility-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-flashcard-accessibility/);
  assert.match(
    validatorSource,
    /validateFlashcardAccessibilityParity\(\);[\s\S]*flashcardAccessibilityRulesValidated[\s\S]*flashcardAccessibilityParityValidated[\s\S]*swedishFlashcardCopyNaturalnessValidated/,
  );
  assert.match(flashcardTestSource, /--focus-flashcard-accessibility/);
  assert.doesNotMatch(
    flashcardTestSource,
    /--focus-learn-flashcard-source/,
    'Flashcard accessibility tests must not use the stale unsupported focus flag',
  );
  assert.doesNotMatch(
    flashcardTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'Flashcard accessibility tests must not route through full content validation',
  );
});
test('question disclaimer parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const disclaimerTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-question-disclaimer-parity.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('questionDisclaimerParity');

  assert.ok(registryEntry, 'QuestionDisclaimer parity focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-question-disclaimer-parity']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'questionDisclaimerRoutesValidated',
    'questionDisclaimerCopyValidated',
  ]);
  assert.match(validatorSource, /--focus-question-disclaimer-parity/);
  assert.match(
    validatorSource,
    /validateQuestionDisclaimerParity\(\);[\s\S]*questionDisclaimerRoutesValidated[\s\S]*questionDisclaimerCopyValidated/,
  );
  assert.match(disclaimerTestSource, /--focus-question-disclaimer-parity/);
  assert.doesNotMatch(
    disclaimerTestSource,
    /--focus-learn-flashcard-source/,
    'QuestionDisclaimer parity tests must not use the broader Learn flashcard focus flag',
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-question-disclaimer-parity'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused QuestionDisclaimer validation should print a JSON summary');
  const summary = JSON.parse(match[0]);

  for (const key of registryEntry.summaryKeys) {
    assert.ok(Object.prototype.hasOwnProperty.call(summary, key), `${key} is present`);
  }
  assert.equal(summary.questionDisclaimerRoutesValidated, 6);
  assert.equal(summary.questionDisclaimerCopyValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});
test('answer feedback parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const answerFeedbackTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-answer-feedback-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-answer-feedback-parity/);
  assert.match(
    validatorSource,
    /validateAnswerValidationTypeSchemaParity\(\);[\s\S]*validateAnswerFeedbackParity\(\);[\s\S]*answerFeedbackRuntimeParityValidated/,
  );
  assert.match(answerFeedbackTestSource, /--focus-answer-feedback-parity/);
  assert.doesNotMatch(
    answerFeedbackTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'answer feedback tests must not route through full content validation',
  );
});

test('question speech text parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const speechTextTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-question-speech-text-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-question-speech-text-parity/);
  assert.match(
    validatorSource,
    /validateQuestionSpeechTextParity\(\);[\s\S]*questionSpeechTextQuestionsValidated[\s\S]*questionSpeechTextOptionsValidated[\s\S]*questionSpeechTextParityValidated[\s\S]*publishedQuestions/,
  );
  assert.match(speechTextTestSource, /--focus-question-speech-text-parity/);
  assert.doesNotMatch(
    speechTextTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'question speech text tests must not route through full content validation',
  );
});

test('generated localization overlay parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get(
    'generatedLocalizationTemplateParity',
  );

  assert.ok(registryEntry, 'generated localization focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-generated-localization-template-parity']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'generatedLocalizationTemplateParityValidated',
    'generatedPromptTemplateParityValidated',
    'generatedAnswerTemplateParityValidated',
    'generatedPublishedQuestions',
  ]);
  assert.match(validatorSource, /--focus-generated-localization-template-parity/);
  assert.match(
    validatorSource,
    /validateGeneratedLocalizationTemplateParity\(\);[\s\S]*generatedLocalizationTemplateParityValidated[\s\S]*generatedPromptTemplateParityValidated[\s\S]*generatedAnswerTemplateParityValidated/,
  );
});

test('Search route query hydration parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const searchRouteTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-search-route-copy-parity.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('searchRouteQueryHydration');

  assert.ok(registryEntry, 'Search route query hydration focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-search-route-query-hydration']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'searchRouteQueryHydrationRulesValidated',
    'searchRouteQueryHydrationParityValidated',
    'searchQuestionPunctuationRulesValidated',
    'searchQuestionPunctuationParityValidated',
  ]);
  assert.match(validatorSource, /--focus-search-route-query-hydration/);
  assert.match(
    validatorSource,
    /validateSearchRouteQueryHydrationParity\(\);[\s\S]*validateSearchQuestionPunctuationParity\(\);[\s\S]*searchRouteQueryHydrationRulesValidated[\s\S]*searchRouteQueryHydrationParityValidated[\s\S]*searchQuestionPunctuationRulesValidated[\s\S]*searchQuestionPunctuationParityValidated/,
  );
  assert.equal(
    (validatorSource.match(/validateSearchRouteQueryHydrationParity\(\);/g) ?? []).length,
    2,
    'Search route query hydration validation should run once in focus mode and once in full validation',
  );
  assert.match(searchRouteTestSource, /--focus-search-route-query-hydration/);
  assert.doesNotMatch(
    searchRouteTestSource,
    /searchRouteQueryHydrationRulesValidated":\\s\*\d+/,
    'Search route focused test must derive the rule count instead of hardcoding it',
  );
});

test('Somali geography naturalness uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const questionI18nTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-question-i18n-v8-pilot.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('somaliGeographyNaturalness');

  assert.ok(registryEntry, 'Somali geography focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-somali-geography-naturalness']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'somaliGeographyNaturalnessCasesValidated',
    'somaliGeographyNaturalnessStaticRowsValidated',
    'somaliGeographyNaturalnessParityValidated',
  ]);
  assert.match(validatorSource, /--focus-somali-geography-naturalness/);
  assert.match(
    validatorSource,
    /validateSomaliGeographyNaturalnessParity\(\);[\s\S]*somaliGeographyNaturalnessCasesValidated[\s\S]*somaliGeographyNaturalnessStaticRowsValidated[\s\S]*somaliGeographyNaturalnessParityValidated/,
  );
  assert.match(questionI18nTestSource, /summarizeSomaliGeographyNaturalness/);
});

test('Somali holiday-food naturalness uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const questionI18nTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-question-i18n-v8-pilot.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('somaliHolidayFoodNaturalness');

  assert.ok(registryEntry, 'Somali holiday-food focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-somali-holiday-food-naturalness']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'somaliHolidayFoodNaturalnessCasesValidated',
    'somaliHolidayFoodNaturalnessStaticRowsValidated',
    'somaliHolidayFoodNaturalnessParityValidated',
  ]);
  assert.match(validatorSource, /--focus-somali-holiday-food-naturalness/);
  assert.match(
    validatorSource,
    /validateSomaliHolidayFoodNaturalnessParity\(\);[\s\S]*somaliHolidayFoodNaturalnessCasesValidated[\s\S]*somaliHolidayFoodNaturalnessStaticRowsValidated[\s\S]*somaliHolidayFoodNaturalnessParityValidated/,
  );
  assert.match(questionI18nTestSource, /summarizeSomaliHolidayFoodNaturalness/);

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-somali-holiday-food-naturalness'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused Somali holiday-food validation should print a JSON summary');
  const summary = JSON.parse(match[0]);

  for (const key of registryEntry.summaryKeys) {
    assert.ok(Object.prototype.hasOwnProperty.call(summary, key), `${key} is present`);
  }
  assert.equal(summary.somaliHolidayFoodNaturalnessCasesValidated, 6);
  assert.equal(summary.somaliHolidayFoodNaturalnessStaticRowsValidated, 6);
  assert.equal(summary.somaliHolidayFoodNaturalnessParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});

test('generated localization overlay parity rejects typoed focus flags', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-generated-localization-template-parit'],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsupported validate-content focus flag/);
  assert.match(result.stderr, /--focus-generated-localization-template-parity/);
});
test('question report link parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const reportLinkTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-question-report-link-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-question-report-link-parity/);
  assert.match(
    validatorSource,
    /validateQuestionReportLinkParity\(\);[\s\S]*questionReportLinkRulesValidated[\s\S]*questionReportLinkParityValidated/,
  );
  assert.match(reportLinkTestSource, /--focus-question-report-link-parity/);
  assert.doesNotMatch(
    reportLinkTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'QuestionReportLink parity tests must not route through full content validation',
  );
});

test('generated true/false naturalness guards share one pattern source', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const derivedContentTestSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/derived-content.test.js'),
    'utf8',
  );
  const patternSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/generated-true-false-naturalness-patterns.js'),
    'utf8',
  );

  assert.match(validatorSource, /generated-true-false-naturalness-patterns/);
  assert.match(derivedContentTestSource, /generated-true-false-naturalness-patterns/);
  assert.doesNotMatch(
    validatorSource,
    /const QUESTION_GENERATED_TRUE_FALSE_NATURALNESS_PATTERNS = \[/,
    'validate-content must use the shared generated true/false naturalness pattern module',
  );
  assert.match(patternSource, /GENERATED_TRUE_FALSE_NATURALNESS_PATTERN_RULES/);
  assert.match(patternSource, /policy-goal/);
  assert.match(patternSource, /definition-cleft/);
  assert.match(patternSource, /answer-fragment/);
  assert.match(patternSource, /answer-scaffold/);
  assert.match(patternSource, /stablePatternRuleId/);
  assert.doesNotMatch(
    patternSource,
    /map\(\(pattern,\s*index\)/,
    'generated true/false naturalness rule ids must not be derived from array position',
  );
});

test('generated civic statement parity uses the production generator only', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const derivedQuestionSource = fs.readFileSync(
    path.join(repoRoot, 'lib/content/derivedQuestions.ts'),
    'utf8',
  );

  assert.match(
    validatorSource,
    /const derivedQuestionModule = loadTs\('lib\/content\/derivedQuestions\.ts'\);/,
  );
  assert.match(
    validatorSource,
    /derivePublishedQuestions\(sourceQuestions,\s*sourceQuestions\.length \+ 1\)/,
  );
  assert.match(derivedQuestionSource, /export function deriveCivicStatementSv\(/);
  assert.match(derivedQuestionSource, /export function deriveCivicStatementEn\(/);
  assert.doesNotMatch(
    validatorSource,
    /function civicStatementSv\(/,
    'validate-content must not keep a Swedish civic-statement shadow generator',
  );
  assert.doesNotMatch(
    validatorSource,
    /function civicStatementEn\(/,
    'validate-content must not keep an English civic-statement shadow generator',
  );
  assert.doesNotMatch(
    validatorSource,
    /Människor kan påverka samhället och delta i demokratin genom att/,
  );
  assert.doesNotMatch(validatorSource, /folkomröstningar i Sverige är rådgivande/);
  assert.doesNotMatch(validatorSource, /Some people who are not Swedish citizens may vote/);
});

test('dead generated helper mirror code stays out of validate-content', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );

  for (const helperName of [
    'firstSentence',
    'normalizeStatementForComparison',
    'isTrueFalseSource',
  ]) {
    assert.equal(
      countSourceOccurrences(validatorSource, helperName),
      0,
      `${helperName} must not remain as dead generated-statement mirror code`,
    );
  }

  assert.match(validatorSource, /function stripTrueFalsePromptSv\(/);
  assert.match(validatorSource, /function stripTrueFalsePromptEn\(/);
  assert.ok(
    countSourceOccurrences(validatorSource, 'stripTrueFalsePromptSv') > 1,
    'stripTrueFalsePromptSv should remain used by source-citation cleanup',
  );
  assert.ok(
    countSourceOccurrences(validatorSource, 'stripTrueFalsePromptEn') > 1,
    'stripTrueFalsePromptEn should remain used by source-citation cleanup',
  );
});

test('religious-freedom option parallelism uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const publishedQuestionTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-published-question-types.test.js'),
    'utf8',
  );

  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('religiousFreedomParallelism');

  assert.ok(registryEntry, 'religious-freedom option parallelism focus mode must be registered');
  assert.deepEqual(registryEntry.flags, [
    '--focus-religious-freedom-option-parallelism',
    '--focus-religious-freedom-parallelism',
  ]);
  assert.deepEqual(registryEntry.summaryKeys, [
    'publishedQuestions',
    'questionReligiousFreedomParallelismValidated',
    'questionReligiousFreedomParallelismTargetRowsValidated',
  ]);
  assert.match(validatorSource, /--focus-religious-freedom-option-parallelism/);
  assert.match(
    validatorSource,
    /validateQuestionReligiousFreedomParallelism\(\);[\s\S]*questionReligiousFreedomParallelismValidated[\s\S]*questionReligiousFreedomParallelismTargetRowsValidated/,
  );
  assert.match(
    publishedQuestionTestSource,
    /religious-freedom option parallelism guard rejects the old wording[\s\S]*--focus-religious-freedom-option-parallelism/,
  );
});

test('religious-freedom 1951 naturalness uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const publishedQuestionTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-published-question-types.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('religiousFreedom1951Naturalness');

  assert.ok(registryEntry, 'religious-freedom 1951 focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-religious-freedom-1951-naturalness']);
  assert.deepEqual(registryEntry.summaryKeys, ['questionReligiousFreedom1951NaturalnessValidated']);
  assert.match(validatorSource, /--focus-religious-freedom-1951-naturalness/);
  assert.match(
    validatorSource,
    /validateQuestionReligiousFreedom1951Naturalness\(\);[\s\S]*questionReligiousFreedom1951NaturalnessValidated/,
  );
  assert.match(
    publishedQuestionTestSource,
    /religious-freedom 1951 English naturalness guard rejects stale CSV wording[\s\S]*--focus-religious-freedom-1951-naturalness/,
  );
  assert.match(
    publishedQuestionTestSource,
    /religious-freedom 1951 English naturalness guard rejects stale static wording[\s\S]*--focus-religious-freedom-1951-naturalness/,
  );
});

test('Mistakes route copy parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const mistakesRouteTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-mistakes-route-copy-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-mistakes-route-copy/);
  assert.match(
    validatorSource,
    /validateMistakesRouteCopyParity\(\);[\s\S]*mistakesRouteCopyLabelsValidated[\s\S]*mistakesRouteCopyParityValidated/,
  );
  assert.match(mistakesRouteTestSource, /--focus-mistakes-route-copy/);
  assert.doesNotMatch(
    mistakesRouteTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'Mistakes route copy tests must not route through full content validation',
  );
});

test('persistence warning scope parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const storageWarningTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-storage-write-fail-soft.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-persistence-warning-scope/);
  assert.match(
    validatorSource,
    /validatePersistenceWarningScopeParity\(\);[\s\S]*persistenceWarningScopeCasesValidated[\s\S]*persistenceWarningScopeParityValidated/,
  );
  assert.match(storageWarningTestSource, /getPersistenceWarningNoticeCopy/);
});

test('local study corrupt JSON warnings use focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const storageWarningTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-storage-write-fail-soft.test.js'),
    'utf8',
  );
  const reviewStoreTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/v1-1-review-store.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('localStudyCorruptJsonWarnings');

  assert.ok(registryEntry, 'local study corrupt JSON focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-local-study-corrupt-json-warnings']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'localStudyCorruptJsonStoresValidated',
    'localStudyCorruptJsonRecoverableReadWarningTestsValidated',
    'localStudyCorruptJsonWarningParityValidated',
  ]);
  assert.match(validatorSource, /--focus-local-study-corrupt-json-warnings/);
  assert.match(
    validatorSource,
    /validateLocalStudyCorruptJsonWarnings\(\);[\s\S]*localStudyCorruptJsonStoresValidated[\s\S]*localStudyCorruptJsonRecoverableReadWarningTestsValidated[\s\S]*localStudyCorruptJsonWarningParityValidated/,
  );
  assert.match(storageWarningTestSource, /--focus-local-study-corrupt-json-warnings/);
  assert.match(storageWarningTestSource, /progress corrupt JSON reads/);
  assert.match(storageWarningTestSource, /mistake-review corrupt JSON reads/);
  assert.match(storageWarningTestSource, /highlight corrupt JSON reads/);
  assert.match(
    reviewStoreTestSource,
    /review store: successful writes persist JSON and corrupt reads still fall back/,
  );
});

test('Profile route copy parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const profileRouteTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-profile-route-copy-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-profile-route-copy/);
  assert.match(
    validatorSource,
    /validateProfileRouteCopyParity\(\);[\s\S]*validateBadgeCatalog\(\);[\s\S]*profileRouteCopyLabelsValidated[\s\S]*profileRouteCopyParityValidated[\s\S]*badgeMilestoneParityValidated/,
  );
  assert.match(profileRouteTestSource, /--focus-profile-route-copy/);
  assert.doesNotMatch(
    profileRouteTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'Profile route copy tests must not route through full content validation',
  );
});

test('countdown banner parity uses focused countdown and study-plan validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const countdownTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-countdown-banner-parity.test.js'),
    'utf8',
  );
  const registrySource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content-focus-registry.js'),
    'utf8',
  );

  assert.match(registrySource, /--focus-countdown-banner-parity/);
  assert.match(validatorSource, /--focus-countdown-banner-parity/);
  assert.match(validatorSource, /validateCountdownBannerFocusedParity\(\);/);
  assert.match(validatorSource, /studyPlanRuntimeCasesValidated/);
  assert.match(countdownTestSource, /--focus-countdown-banner-parity/);
  assert.doesNotMatch(
    countdownTestSource,
    /--focus-countdown-banner['"]/,
    'countdown banner parity tests must use the explicit parity focus flag',
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-countdown-banner-parity'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused countdown validation should print a JSON summary');
  const summary = JSON.parse(match[0]);
  assert.equal(summary.countdownBannerTimelineCopyParityValidated, true);
  assert.equal(summary.studyPlanRuntimeCasesValidated, 6);
  assert.equal(summary.studyPlanRuntimeParityValidated, true);
  assert.equal(Object.hasOwn(summary, 'homeRouteCopyParityValidated'), false);
  assert.equal(Object.hasOwn(summary, 'chapters'), false);
});

test('spaced repetition schema parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const spacedRepetitionTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-spaced-repetition-schema.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-spaced-repetition-schema/);
  assert.match(
    validatorSource,
    /validateSpacedRepetitionSchedule\(\);[\s\S]*spacedRepetitionIntervalsValidated[\s\S]*spacedRepetitionRuntimeInputParityValidated/,
  );
  assert.match(spacedRepetitionTestSource, /--focus-spaced-repetition-schema/);
  assert.doesNotMatch(
    spacedRepetitionTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'spaced repetition tests must not route through full content validation',
  );
});

test('review-store due limit uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const reviewStoreTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/v1-1-review-store.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('reviewStoreDueLimit');

  assert.ok(registryEntry, 'review-store due-limit focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-review-store-due-limit']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'reviewStoreDueLimitCasesValidated',
    'reviewStoreDueLimitParityValidated',
  ]);
  assert.match(validatorSource, /--focus-review-store-due-limit/);
  assert.match(
    validatorSource,
    /validateReviewStoreDueLimitRuntime\(\);[\s\S]*reviewStoreDueLimitCasesValidated[\s\S]*reviewStoreDueLimitParityValidated/,
  );
  assert.match(
    validatorSource,
    /validateSpacedRepetitionSchedule\(\);[\s\S]*validateReviewStoreDueLimitRuntime\(\);[\s\S]*validateFlashcardDeckStrictDateRuntimeGuard\(\);/,
    'full content validation must still invoke the review-store due-limit guard',
  );
  assert.match(reviewStoreTestSource, /--focus-review-store-due-limit/);

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-review-store-due-limit'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused review-store due-limit validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.reviewStoreDueLimitCasesValidated, 12);
  assert.equal(summary.reviewStoreDueLimitParityValidated, true);
  assert.deepEqual(Object.keys(summary).sort(), registryEntry.summaryKeys.slice().sort());
});

test('XP rules parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const xpRulesTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-xp-rules-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-xp-rules/);
  assert.match(
    validatorSource,
    /validateXpRules\(\);[\s\S]*xpRulesValidated[\s\S]*xpRulesParityValidated/,
  );
  assert.match(xpRulesTestSource, /--focus-xp-rules/);
  assert.doesNotMatch(
    xpRulesTestSource,
    /--focus-badge-xp-runtime/,
    'XP rules tests must not route through the broader badge XP runtime focus',
  );
});

test('adaptive size focused content validation runs only its runtime summary', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('adaptivePracticeSize');

  assert.ok(registryEntry, 'adaptive practice size focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-adaptive-practice-size']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'adaptivePracticeSizeRuntimeCasesValidated',
    'adaptivePracticeSizeRuntimeParityValidated',
  ]);
  assert.match(validatorSource, /--focus-adaptive-practice-size/);
  assert.match(
    validatorSource,
    /validateAdaptivePracticeSizeRuntimeGuards\(\);[\s\S]*adaptivePracticeSizeRuntimeCasesValidated[\s\S]*adaptivePracticeSizeRuntimeParityValidated/,
  );
  assert.match(
    validatorSource,
    /validateSpacedRepetitionSchedule\(\);[\s\S]*validateAdaptivePracticeSizeRuntimeGuards\(\);[\s\S]*validateStreakRules\(\);/,
    'full content validation must still invoke the adaptive practice size runtime guard',
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-adaptive-practice-size'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused adaptive size validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(
    summary.adaptivePracticeSizeRuntimeCasesValidated,
    MALFORMED_ADAPTIVE_PRACTICE_SIZE_CASES.length,
  );
  assert.equal(summary.adaptivePracticeSizeRuntimeParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});

test('adaptive difficulty focused content validation runs only its runtime summary', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const adaptiveResumeTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/v1-1-adaptive-resume.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('adaptivePracticeDifficulty');

  assert.ok(registryEntry, 'adaptive practice difficulty focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-adaptive-practice-difficulty']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'adaptivePracticeDifficultyRuntimeCasesValidated',
    'adaptivePracticeDifficultyRuntimeParityValidated',
  ]);
  assert.match(validatorSource, /--focus-adaptive-practice-difficulty/);
  assert.match(
    validatorSource,
    /MALFORMED_ADAPTIVE_PRACTICE_DIFFICULTY_CASES,[\s\S]*MALFORMED_ADAPTIVE_PRACTICE_SIZE_CASES/,
    'validator must import adaptive practice malformed runtime fixtures from the shared helper',
  );
  assert.match(
    adaptiveResumeTestSource,
    /MALFORMED_ADAPTIVE_PRACTICE_DIFFICULTY_CASES,[\s\S]*MALFORMED_ADAPTIVE_PRACTICE_SIZE_CASES/,
    'direct adaptive selector tests must import the same malformed runtime fixtures',
  );
  assert.doesNotMatch(
    validatorSource,
    /const\s+MALFORMED_ADAPTIVE_PRACTICE_DIFFICULTY_CASES\s*=\s*(?:Object\.freeze\()?\[/,
    'validator must not define its own malformed adaptive difficulty fixture array',
  );
  assert.doesNotMatch(
    adaptiveResumeTestSource,
    /const\s+MALFORMED_ADAPTIVE_PRACTICE_DIFFICULTY_CASES\s*=\s*(?:Object\.freeze\()?\[/,
    'direct adaptive selector tests must not define their own malformed adaptive difficulty fixture array',
  );
  assert.match(
    validatorSource,
    /validateAdaptivePracticeDifficultyRuntimeGuards\(\);[\s\S]*adaptivePracticeDifficultyRuntimeCasesValidated[\s\S]*adaptivePracticeDifficultyRuntimeParityValidated/,
  );
  assert.match(
    validatorSource,
    /validateAdaptivePracticeSizeRuntimeGuards\(\);[\s\S]*validateAdaptivePracticeDifficultyRuntimeGuards\(\);[\s\S]*validateStreakRules\(\);/,
    'full content validation must still invoke the adaptive practice difficulty runtime guard',
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-adaptive-practice-difficulty'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused adaptive difficulty validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(
    summary.adaptivePracticeDifficultyRuntimeCasesValidated,
    MALFORMED_ADAPTIVE_PRACTICE_DIFFICULTY_CASES.length,
  );
  assert.equal(summary.adaptivePracticeDifficultyRuntimeParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});

test('daily challenge runtime focused content validation runs only its runtime summary', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('dailyChallengeRuntime');

  assert.ok(registryEntry, 'daily challenge runtime focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-daily-challenge-runtime']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'dailyChallengeRuntimeCasesValidated',
    'dailyChallengeRuntimeParityValidated',
  ]);
  assert.match(validatorSource, /--focus-daily-challenge-runtime/);
  assert.match(
    validatorSource,
    /validateDailyChallengeRuntimeGuards\(\);[\s\S]*dailyChallengeRuntimeCasesValidated[\s\S]*dailyChallengeRuntimeParityValidated/,
  );
  assert.match(
    validatorSource,
    /validateAdaptivePracticeDifficultyRuntimeGuards\(\);[\s\S]*validateDailyChallengeRuntimeGuards\(\);[\s\S]*validateStreakRules\(\);/,
    'full content validation must still invoke the daily challenge runtime guard',
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-daily-challenge-runtime'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused daily challenge validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.dailyChallengeRuntimeCasesValidated, 9);
  assert.equal(summary.dailyChallengeRuntimeParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});

test('monetization schema parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('monetizationSchema');

  assert.ok(registryEntry, 'monetization schema focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-monetization-schema-parity']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'monetizationTypeUnionsValidated',
    'monetizationTypeInterfacesValidated',
    'monetizationTypeSchemaParityValidated',
    'effectiveEntitlementExpiryCasesValidated',
    'effectiveEntitlementExpiryParityValidated',
  ]);
  assert.match(validatorSource, /--focus-monetization-schema-parity/);
  assert.match(
    validatorSource,
    /validateMonetizationTypeSchemaParity\(\);[\s\S]*validateEffectiveEntitlementExpiryParity\(\);[\s\S]*effectiveEntitlementExpiryParityValidated/,
  );
  assert.match(
    validatorSource,
    /validateMonetizationTypeSchemaParity\(\);[\s\S]*validateEffectiveEntitlementExpiryParity\(\);[\s\S]*validatePurchaseTypeSchemaParity\(\);/,
    'full content validation must still invoke monetization schema and effective-expiry guards',
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-monetization-schema-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused monetization schema validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.equal(summary.monetizationTypeSchemaParityValidated, true);
  assert.equal(summary.effectiveEntitlementExpiryCasesValidated, 5);
  assert.equal(summary.effectiveEntitlementExpiryParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});

test('Pro Lifetime relaunch parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const proIapTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/v1-1-pro-iap.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-pro-lifetime-relaunch-parity/);
  assert.match(
    validatorSource,
    /validateProLifetimeRelaunchParity\(\);[\s\S]*proLifetimeBareTrueRejectionValidated[\s\S]*proLifetimeStructuredRecordParsingValidated[\s\S]*proLifetimeProviderReceiptRevalidationValidated[\s\S]*proLifetimeFailClosedClearingValidated[\s\S]*proLifetimeNativeHookProviderWiringValidated[\s\S]*proLifetimeRelaunchParityValidated/,
  );
  assert.match(proIapTestSource, /--focus-pro-lifetime-relaunch-parity/);
});

test('Remove Ads hook parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const removeAdsHookTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-remove-ads-hook-parity.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('removeAdsHookParity');

  assert.ok(registryEntry, 'Remove Ads hook focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-remove-ads-hook-parity']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'removeAdsEntitlementHookCasesValidated',
    'removeAdsEntitlementHookParityValidated',
  ]);
  assert.match(validatorSource, /--focus-remove-ads-hook-parity/);
  assert.equal(
    (validatorSource.match(/validateRemoveAdsEntitlementHookParity\(\);/g) ?? []).length,
    2,
    'Remove Ads hook validation should run once in focus mode and once in full validation',
  );
  assert.match(removeAdsHookTestSource, /--focus-remove-ads-hook-parity/);
  assert.doesNotMatch(
    removeAdsHookTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'Remove Ads hook tests must not route through full content validation',
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-remove-ads-hook-parity'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused Remove Ads hook validation should print a JSON summary');
  const summary = JSON.parse(match[0]);

  assert.deepEqual(Object.keys(summary).sort(), registryEntry.summaryKeys.slice().sort());
  assert.ok(summary.removeAdsEntitlementHookCasesValidated > 0);
  assert.equal(summary.removeAdsEntitlementHookParityValidated, true);
});

test('streak rules parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const streakRulesTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-streak-rules-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-streak-rules/);
  assert.match(
    validatorSource,
    /validateStreakRules\(\);[\s\S]*streakRulesValidated[\s\S]*streakRulesParityValidated/,
  );
  assert.match(streakRulesTestSource, /--focus-streak-rules/);
  assert.doesNotMatch(
    streakRulesTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'streak rules tests must not route through full content validation',
  );
});

test('streak freeze counter runtime input focus reports isolated summary', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('streakFreezeCounterRuntimeInput');

  assert.ok(registryEntry, 'streak-freeze counter runtime focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-streak-freeze-counter-runtime-input']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'streakFreezeCounterRuntimeCasesValidated',
    'streakFreezeCounterRuntimeParityValidated',
  ]);
  assert.match(validatorSource, /--focus-streak-freeze-counter-runtime-input/);
  assert.match(
    validatorSource,
    /validateStreakFreezeCounterRuntimeInputs\(\);[\s\S]*streakFreezeCounterRuntimeCasesValidated[\s\S]*streakFreezeCounterRuntimeParityValidated/,
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-streak-freeze-counter-runtime-input'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused streak-freeze counter validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.deepEqual(Object.keys(summary).sort(), registryEntry.summaryKeys.slice().sort());
  assert.equal(summary.streakFreezeCounterRuntimeCasesValidated, 4);
  assert.equal(summary.streakFreezeCounterRuntimeParityValidated, true);
});

test('streak freeze normalizer parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const progressSchemaTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-progress-schema-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-streak-freeze-normalizer-parity/);
  assert.match(
    validatorSource,
    /validateStreakFreezeNormalizerParity\(\);[\s\S]*streakFreezeNormalizerCasesValidated[\s\S]*streakFreezeNormalizerParityValidated/,
  );
  assert.match(progressSchemaTestSource, /--focus-streak-freeze-normalizer-parity/);
});

test('exam submission finality parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const progressSchemaTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-progress-schema-parity.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('examSubmissionFinalityParity');

  assert.ok(registryEntry, 'exam submission finality focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-exam-submission-finality-parity']);
  assert.deepEqual(registryEntry.summaryKeys, ['examSubmissionFinalityParityValidated']);
  assert.match(progressSchemaTestSource, /--focus-exam-submission-finality-parity/);
  assert.match(
    progressSchemaTestSource,
    /Object\.keys\(summary\)[\s\S]*\['examSubmissionFinalityParityValidated'\]/,
    'progress schema parity must assert the focused summary stays isolated',
  );

  const focusBlockMatch = validatorSource.match(
    /if \(process\.argv\.includes\('--focus-exam-submission-finality-parity'\)\) \{([\s\S]*?)\n\}/,
  );
  assert.ok(focusBlockMatch, 'exam submission focus block must exist');
  const focusBlock = focusBlockMatch[1];
  const focusedValidatorCalls = Array.from(focusBlock.matchAll(/\bvalidate[A-Z]\w+\(/g)).map(
    ([call]) => call,
  );

  assert.deepEqual(focusedValidatorCalls, ['validateExamSubmissionFinalityParity(']);
  assert.match(
    focusBlock,
    /printValidationSummary\(\{\s*examSubmissionFinalityParityValidated,\s*\}\);/,
  );
  assert.match(
    validatorSource,
    /validateExamSubmissionFinalityParity\(\);[\s\S]*validateExamRouteHeaderParity\(\);/,
    'full content validation must still invoke the exam submission finality guard',
  );
});

test('static ebook footnote hash parity uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const staticEbookTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-static-site-ebook-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-static-ebook-footnote-hash-parity/);
  assert.match(
    validatorSource,
    /validateStaticEbookFootnoteHashParity\(\);[\s\S]*staticEbookFootnoteHashChaptersValidated[\s\S]*staticEbookFootnoteHashLanguagesValidated[\s\S]*staticEbookFootnoteHashParityValidated/,
  );
  assert.match(staticEbookTestSource, /--focus-static-ebook-footnote-hash-parity/);
  assert.match(
    staticEbookTestSource,
    /staticEbookFootnoteHashChaptersValidated[\s\S]*staticEbookFootnoteHashLanguagesValidated[\s\S]*staticEbookFootnoteHashParityValidated/,
  );
});

test('static ebook provenance umbrella focus routes only static ebook provenance guards', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('staticEbookProvenance');

  assert.ok(registryEntry, 'static ebook provenance focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-static-ebook-provenance']);
  assert.match(validatorSource, /--focus-static-ebook-provenance/);
  assert.match(
    validatorSource,
    /validateStaticEbookOutcomeClaimPatterns\(\);[\s\S]*validateStaticEbookPracticalTestClaims\(\);[\s\S]*validateStaticEbookFactboxProvenance\(\);[\s\S]*validateStaticEbookFootnoteHashParity\(\);[\s\S]*staticEbookProvenanceParityValidated/,
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-static-ebook-provenance'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused static ebook provenance validation should print a JSON summary');
  const summary = JSON.parse(match[0]);

  for (const key of registryEntry.summaryKeys) {
    assert.ok(Object.prototype.hasOwnProperty.call(summary, key), `${key} is present`);
  }
  assert.equal(summary.staticEbookOutcomeClaimParityValidated, true);
  assert.equal(summary.staticEbookPracticalTestCurrentnessValidated, true);
  assert.equal(summary.staticEbookFactboxProvenanceValidated, true);
  assert.equal(summary.staticEbookFootnoteHashParityValidated, true);
  assert.equal(summary.staticEbookProvenanceParityValidated, true);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'staticFaqFallbackParityValidated'),
    false,
  );
});

test('weekly recap runtime guard uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-weekly-recap-runtime/);
  assert.match(
    validatorSource,
    /validateWeeklyRecapRuntimeGuard\(\);[\s\S]*weeklyRecapRuntimeCasesValidated[\s\S]*weeklyRecapRuntimeParityValidated/,
  );
  assert.match(
    validatorSource,
    /validateDashboardProgressSnapshotParity\(\);[\s\S]*validateWeeklyRecapRuntimeGuard\(\);[\s\S]*validateBadgeCatalog\(\);/,
    'full content validation must still invoke the weekly recap runtime guard',
  );
});

test('readiness adapter runtime guard uses focused content validation routing', () => {
  const pkg = readPackageJson();
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const learningTestSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/learning.test.js'),
    'utf8',
  );
  const readinessAdapterTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-readiness-adapter-runtime-parity.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-readiness-adapter-rules/);
  assert.match(
    validatorSource,
    /validateReadinessAdapterRules\(\);[\s\S]*readinessAdapterRulesValidated[\s\S]*readinessAdapterRuntimeParityValidated/,
  );
  assert.equal(
    (
      pkg.scripts['test:content'].match(
        /tests\/content-readiness-adapter-runtime-parity\.test\.js/g,
      ) ?? []
    ).length,
    1,
    'test:content must include the readiness adapter runtime parity test exactly once',
  );
  assert.match(readinessAdapterTestSource, /--focus-readiness-adapter-rules/);
  assert.match(readinessAdapterTestSource, /readinessAdapterRulesValidated/);
  assert.match(readinessAdapterTestSource, /readinessAdapterRuntimeParityValidated/);
  assert.match(learningTestSource, /readiness adapter ignores malformed counters/);
  assert.match(learningTestSource, /correctCount:\s*999/);
  assert.match(learningTestSource, /totalCount:\s*999/);
});

test('monetization selector runs only the focused monetization suite', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-routing-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const env = {
    ...process.env,
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: npmLog,
    TEST_DISPATCH_NPM: createFakeNpm(tmpDir),
  };

  try {
    const selectedResult = runDispatcher(['--', 'monetization'], env);
    assert.equal(selectedResult.status, 0, selectedResult.stderr || selectedResult.stdout);
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:monetization\n');

    fs.writeFileSync(npmLog, '');
    const fullResult = runDispatcher([], env);
    assert.equal(fullResult.status, 0, fullResult.stderr || fullResult.stdout);
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:all\n');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('correct-display-position selector runs the P0 answer shuffle acceptance script', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-shuffle-routing-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const env = {
    ...process.env,
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: npmLog,
    TEST_DISPATCH_NPM: createFakeNpm(tmpDir),
  };

  try {
    const selectedResult = runDispatcher(['--', 'correct-display-position'], env);
    assert.equal(selectedResult.status, 0, selectedResult.stderr || selectedResult.stdout);
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:correct-display-position\n');

    const pkg = readPackageJson();
    const script = pkg.scripts['test:correct-display-position'];
    assert.match(script, /npm run test:answer-shuffle/);
    assert.match(script, /npm run test:static-site-answer-shuffle/);
    assert.match(script, /node scripts\/validate-content\.js --focus-answer-shuffle-parity/);
    assert.doesNotMatch(script, /npm run test:content|npm run test:all|npm test/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('xp selector runs only the focused XP rules parity script', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-xp-routing-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const env = {
    ...process.env,
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: npmLog,
    TEST_DISPATCH_NPM: createFakeNpm(tmpDir),
  };

  try {
    const selectedResult = runDispatcher(['--', 'xp'], env);
    assert.equal(selectedResult.status, 0, selectedResult.stderr || selectedResult.stdout);
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:xp-rules\n');

    const pkg = readPackageJson();
    const script = pkg.scripts['test:xp-rules'];
    assert.match(script, /tests\/content-xp-rules-parity\.test\.js/);
    assert.match(script, /tests\/content-test-script-routing\.test\.js/);
    assert.match(script, /scripts\/learning\.test\.js/);
    assert.match(script, /XP\|xp\|calculateAnswerXp\|calculateQuizCompletionXp\|calculateLevel/);
    assert.doesNotMatch(script, /npm run test:content|npm run test:all|npm test/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('architecture selector runs only architecture scaffold and router-shell gates', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-architecture-routing-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const env = {
    ...process.env,
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: npmLog,
    TEST_DISPATCH_NPM: createFakeNpm(tmpDir),
  };

  try {
    const selectedResult = runDispatcher(['--', 'architecture'], env);
    assert.equal(selectedResult.status, 0, selectedResult.stderr || selectedResult.stdout);
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:architecture\nrun test:router-shell\n');

    const pkg = readPackageJson();
    assert.equal(
      pkg.scripts['test:architecture'],
      'node --test scripts/architecture-scaffold.test.js',
    );
    assert.equal(pkg.scripts['test:router-shell'], 'node --test scripts/router-shell.test.js');
    assert.doesNotMatch(
      fs.readFileSync(path.join(repoRoot, 'scripts/test-dispatch.js'), 'utf8'),
      /architecture[\s\S]{0,220}test:all/,
      'architecture selector must not route through the full suite',
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('package npm test selector enters the dispatcher before running suites', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-package-routing-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const env = {
    ...process.env,
    npm_config_loglevel: 'silent',
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: npmLog,
    TEST_DISPATCH_NPM: createFakeNpm(tmpDir),
  };

  try {
    const selectedResult = runPackageTest(['monetization'], env);
    assert.equal(selectedResult.status, 0, selectedResult.stderr || selectedResult.stdout);
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:monetization\n');

    fs.writeFileSync(npmLog, '');
    const shuffleResult = runPackageTest(['correct-display-position'], env);
    assert.equal(shuffleResult.status, 0, shuffleResult.stderr || shuffleResult.stdout);
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:correct-display-position\n');

    fs.writeFileSync(npmLog, '');
    const architectureResult = runPackageTest(['architecture'], env);
    assert.equal(
      architectureResult.status,
      0,
      architectureResult.stderr || architectureResult.stdout,
    );
    assert.equal(fs.readFileSync(npmLog, 'utf8'), 'run test:architecture\nrun test:router-shell\n');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('religious-freedom option parallelism uses focused content validation routing', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const publishedQuestionTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-published-question-types.test.js'),
    'utf8',
  );

  assert.match(validatorSource, /--focus-religious-freedom-option-parallelism/);
  assert.match(
    validatorSource,
    /validateQuestionReligiousFreedomParallelism\(\);[\s\S]*questionReligiousFreedomParallelismValidated[\s\S]*questionReligiousFreedomParallelismTargetRowsValidated/,
  );
  assert.match(publishedQuestionTestSource, /--focus-religious-freedom-option-parallelism/);
});

test('question-bank CSV focus registry matches focused validator output', () => {
  const validatorSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/validate-content.js'),
    'utf8',
  );
  const csvContractTestSource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-question-bank-csv-contract.test.js'),
    'utf8',
  );
  const registryEntry = FOCUSED_VALIDATION_REGISTRY_BY_ID.get('questionBankCsv');

  assert.ok(registryEntry, 'question-bank CSV focus mode must be registered');
  assert.deepEqual(registryEntry.flags, ['--focus-question-bank-csv']);
  assert.deepEqual(registryEntry.summaryKeys, [
    'questions',
    'publishedQuestions',
    'questionBankCsvHeaderColumnsValidated',
    'questionBankCsvUniqueHeaderNamesValidated',
    'questionBankCsvRowsValidated',
    'questionBankCsvProvenanceCounts',
    'questionBankCsvUhrSourcePublisherRowsValidated',
    'questionBankCsvUhrSourcePublisherParityValidated',
  ]);
  assert.match(validatorSource, /--focus-question-bank-csv/);
  assert.match(
    validatorSource,
    /validateQuestionBankCsvContract\(\);[\s\S]*questionBankCsvHeaderColumnsValidated[\s\S]*questionBankCsvUhrSourcePublisherParityValidated[\s\S]*questionBankCsvProvenanceCounts/,
  );
  assert.match(csvContractTestSource, /--focus-question-bank-csv/);
  assert.doesNotMatch(
    csvContractTestSource,
    /\['scripts\/validate-content\.js'\]/,
    'question-bank CSV contract tests must not route through full content validation',
  );

  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-question-bank-csv'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused question-bank CSV validation should print JSON summary');
  const summary = JSON.parse(match[0]);

  for (const key of registryEntry.summaryKeys) {
    assert.ok(Object.prototype.hasOwnProperty.call(summary, key), `${key} is present`);
  }
  const csvHeaderColumns = fs
    .readFileSync(path.join(repoRoot, 'content/question-bank.csv'), 'utf8')
    .split(/\r?\n/, 1)[0]
    .split(',');

  assert.ok(summary.questions >= summary.publishedQuestions);
  assert.equal(summary.questionBankCsvHeaderColumnsValidated, csvHeaderColumns.length);
  assert.equal(summary.questionBankCsvUniqueHeaderNamesValidated, true);
  assert.equal(summary.questionBankCsvRowsValidated, summary.publishedQuestions);
  assert.equal(summary.questionBankCsvUhrSourcePublisherRowsValidated, summary.publishedQuestions);
  assert.equal(summary.questionBankCsvUhrSourcePublisherParityValidated, true);
  assert.deepEqual(Object.keys(summary.questionBankCsvProvenanceCounts).sort(), [
    'derived',
    'editorial',
    'uhr',
  ]);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
});

test('content-focused npm script forwards test-name pattern before file list', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-content-focused-'));
  const nodeLog = path.join(tmpDir, 'node.log');
  const env = {
    ...process.env,
    npm_config_loglevel: 'silent',
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: nodeLog,
    TEST_DISPATCH_NODE: createFakeNode(tmpDir),
  };

  try {
    const result = runPackageScript(
      'test:content-focused',
      [
        '--test-name-pattern',
        'religious-freedom option parallelism|focus-religious-freedom',
        'tests/content-test-script-routing.test.js',
        'tests/content-published-question-types.test.js',
      ],
      env,
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.deepEqual(fs.readFileSync(nodeLog, 'utf8').trim().split('\n'), [
      '--test',
      '--test-name-pattern',
      'religious-freedom option parallelism|focus-religious-freedom',
      'tests/content-test-script-routing.test.js',
      'tests/content-published-question-types.test.js',
    ]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('unsupported npm test selectors fail before running any suite', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-dispatch-unsupported-'));
  const npmLog = path.join(tmpDir, 'npm.log');
  const env = {
    ...process.env,
    TEST_DISPATCH_CAPTURE: '1',
    TEST_DISPATCH_LOG: npmLog,
    TEST_DISPATCH_NPM: createFakeNpm(tmpDir),
  };

  try {
    const result = runDispatcher(['bogus'], env);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Unsupported npm test selector: bogus/);
    assert.match(
      result.stderr,
      /correct-display-position -> npm run test:correct-display-position/,
    );
    assert.match(
      result.stderr,
      /architecture -> npm run test:architecture && npm run test:router-shell/,
    );
    assert.match(result.stderr, /monetization -> npm run test:monetization/);
    assert.match(result.stderr, /xp -> npm run test:xp-rules/);
    assert.equal(fs.existsSync(npmLog), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
