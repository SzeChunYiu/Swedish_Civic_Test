const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('profile route shell copy stays keyed by the settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');

  assert.equal(summary.profileRouteCopyLabelsValidated, 44);
  assert.equal(summary.profileRouteCopyParityValidated, true);
  assert.match(source, /type ProfileCopy =/);
  assert.match(source, /const profileCopy: Record<AppLanguage, ProfileCopy>/);
  assert.match(source, /const localizedBadgeTitles: Record<AppLanguage, Record<string, string>>/);
  assert.match(source, /const copy = profileCopy\[language\]/);
  assert.match(source, /Framsteg utan konto/);
  assert.match(source, /Progress without an account/);
  assert.match(
    source,
    /Dina mål, språkval, sviter och märken sparas bara på den här enheten, så att dina studier förblir privata\./,
  );
  assert.doesNotMatch(source, /för\s+privat\s+studierutin/i);
  assert.match(source, /Första övningen/);
  assert.match(source, /calculateStreakWithFreeze/);
  assert.match(source, /freezeBannerCopy\(streakWithFreeze, language\)/);
  assert.match(source, /Svitskydd/);
  assert.match(source, /Streak freeze/);
  assert.match(source, /<ScreenShell eyebrow=\{copy\.eyebrow\} title=\{copy\.title\}/);
  assert.match(source, /<MetricCard label=\{copy\.levelMetric\}/);
  assert.match(
    source,
    /<MetricCard label=\{copy\.dayStreakMetric\} value=\{currentStreak\} helper=\{dayStreakHelper\}/,
  );
  assert.match(source, /<SectionHeader title=\{copy\.studySetupTitle\}/);
  assert.match(source, /const audioEnabled = useSettingsStore\(\(state\) => state\.audioEnabled\)/);
  assert.match(source, /audioEnabled \? copy\.audioEnabledBadge : copy\.audioDisabledBadge/);
  assert.match(source, /\{copy\.settingsShortcutHelper\}/);
  assert.match(source, /formatBadges\(badges, language, copy\.noBadges\)/);
  assert.match(source, /entitlementsReady/);
  assert.match(source, /useLocalSearchParams<\{ focus\?: string \}>/);
  assert.match(source, /const removeAdsFocused = focus === 'remove-ads';/);
  assert.match(source, /const removeAdsPaywall = entitlementsReady \? \(/);
  assert.match(source, /nativeID="remove-ads-paywall"/);
  assert.match(source, /testID="remove-ads-paywall"/);
  assert.match(source, /\{removeAdsFocused \? removeAdsPaywall : null\}/);
  assert.match(source, /\{!removeAdsFocused \? removeAdsPaywall : null\}/);
  assert.match(source, /import \{ isProRuntimeScopeEnabled \}/);
  assert.match(source, /const proRuntimeScopeEnabled = isProRuntimeScopeEnabled\(\);/);
  assert.match(source, /\{entitlementsReady && proRuntimeScopeEnabled \? \(/);
  assert.match(source, /import \{ ProPaywall \}/);
  assert.match(source, /<ProPaywall/);
  assert.match(source, /alreadyAdFree=\{monetizationEntitlements\.adsDisabled\}/);
  assert.match(source, /onEntitlementsChange=\{\(nextEntitlements\) =>/);
  assert.match(source, /accessibilityLabel=\{copy\.openSettingsAccessibilityLabel\}/);
  assert.match(source, /href="\/settings"/);
});

test('profile route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/profile.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = profileCopy[language];', 'const copy = profileCopy.en;');
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
    /profile route must select copy from settings language/,
  );
});

test('profile route copy parity rejects missing Swedish shell copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/profile.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Framsteg utan konto'", "'Progress without an account'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /profile route is missing sv copy/);
});

test('profile route copy parity rejects literal Swedish study routine copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/profile.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'så att dina studier förblir privata',
        ['för privat', 'studierutin'].join(' '),
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
    /profile route contains literal Swedish monetization\/profile copy/,
  );
});

test('profile route copy parity rejects badge-title localization drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/profile.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("first_practice: 'Första övningen'", "first_practice: 'First practice'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /profile route is missing sv copy/);
});

test('profile route copy parity rejects Remove Ads paywall pending bypass', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/profile.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const removeAdsPaywall = entitlementsReady ? (', 'const removeAdsPaywall = (');
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
    /profile premium banner must fail closed while entitlements load/,
  );
});

test('profile route copy parity rejects default Pro paywall rendering', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/profile.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('{entitlementsReady && proRuntimeScopeEnabled ? (', '{entitlementsReady ? (');
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
    /profile Pro tier comparison must fail closed unless the Pro runtime scope is enabled/,
  );
});
