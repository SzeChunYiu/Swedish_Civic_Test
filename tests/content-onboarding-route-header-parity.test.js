const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('onboarding route title stays accessible as a header', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/onboarding.tsx'), 'utf8');

  assert.equal(summary.onboardingRouteHeadersValidated, 1);
  assert.equal(summary.onboardingRouteHeaderParityValidated, true);
  assert.equal(summary.onboardingRouteCopyLabelsValidated, 19);
  assert.equal(summary.onboardingRouteCopyParityValidated, true);
  assert.match(source, /type OnboardingCopy =/);
  assert.match(source, /const onboardingCopy: Record<AppLanguage, OnboardingCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = onboardingCopy\[language\];/);
  assert.match(source, /Förbered dig lugnt för samhällskunskapsprovet/);
  assert.match(
    source,
    /Hela frågebanken är gratis; Ta bort annonser påverkar bara annonser, inte tillgången till frågor\./,
  );
  assert.match(source, /Prepare calmly for the civic test/);
  assert.match(source, /Alla 13 ämnen och hela frågebanken ingår gratis/);
  assert.match(source, /All 13 topics and the full question bank are included for free/);
  assert.match(
    source,
    /The full question bank stays free; Remove Ads only changes ads, not question access\./,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  );
  assert.match(source, /accessibilityLabel=\{copy\.startStudyingAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.adjustSettingsAccessibilityLabel\}/);
  assert.doesNotMatch(source, /<Text style=\{styles\.title\}>/);
});

test('about-the-test marks the first-run guide as seen after mount', () => {
  const summary = parseValidationSummary();
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
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /onboarding route is missing sv copy/);
});
