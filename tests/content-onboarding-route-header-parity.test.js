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
  assert.equal(summary.onboardingRouteCopyLabelsValidated, 17);
  assert.equal(summary.onboardingRouteCopyParityValidated, true);
  assert.match(source, /type OnboardingCopy =/);
  assert.match(source, /const onboardingCopy: Record<AppLanguage, OnboardingCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = onboardingCopy\[language\];/);
  assert.match(source, /Förbered dig lugnt för samhällskunskapsprovet/);
  assert.match(source, /Prepare calmly for the civic test/);
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  );
  assert.match(source, /accessibilityLabel=\{copy\.startStudyingAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.adjustSettingsAccessibilityLabel\}/);
  assert.doesNotMatch(source, /<Text style=\{styles\.title\}>/);
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
