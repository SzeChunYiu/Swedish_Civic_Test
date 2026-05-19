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

test('profile route shell copy stays keyed by the settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');

  assert.equal(summary.profileRouteCopyLabelsValidated, 40);
  assert.equal(summary.profileRouteCopyParityValidated, true);
  assert.match(source, /type ProfileCopy =/);
  assert.match(source, /const profileCopy: Record<AppLanguage, ProfileCopy>/);
  assert.match(source, /const localizedBadgeTitles: Record<AppLanguage, Record<string, string>>/);
  assert.match(source, /const copy = profileCopy\[language\]/);
  assert.match(source, /Framsteg utan konto/);
  assert.match(source, /Progress without an account/);
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
  assert.match(source, /formatBadges\(badges, language, copy\.noBadges\)/);
  assert.match(source, /entitlementsReady/);
  assert.match(source, /\{entitlementsReady \? \(\s*<PremiumBanner/);
  assert.match(source, /accessibilityLabel=\{copy\.openSettingsAccessibilityLabel\}/);
  assert.match(source, /Ändra mål, språk och ljud/);
  assert.match(source, /Edit goal, language, and audio/);
});

test('profile premium banner has distinct paid-state copy and recovery action', () => {
  const profileSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
  const bannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PremiumBanner.tsx'),
    'utf8',
  );

  assert.match(profileSource, /\{entitlementsReady \? \(\s*<PremiumBanner/);
  assert.match(profileSource, /entitlements=\{monetizationEntitlements\}/);
  assert.match(bannerSource, /bodyActive:/);
  assert.match(bannerSource, /bodyIdle: \(price\) =>/);
  assert.match(bannerSource, /Purchase confirmed\. Study ads are disabled on this device/);
  assert.match(bannerSource, /Köpet är bekräftat\. Studieannonser är avstängda/);
  assert.match(
    bannerSource,
    /\{adsDisabled \? copy\.bodyActive : copy\.bodyIdle\(REMOVE_ADS_PRICE_LABEL\)\}/,
  );
  assert.match(
    bannerSource,
    /\{!adsDisabled \? \(\s*<Button[\s\S]*copy\.buyAccessibilityLabel\(REMOVE_ADS_PRICE_LABEL\)[\s\S]*\) : null\}/,
  );
  assert.match(bannerSource, /accessibilityLabel=\{copy\.restoreAccessibilityLabel\}/);
  assert.match(bannerSource, /status === 'restored' \? 'restored' : 'purchased'/);
  assert.doesNotMatch(bannerSource, /adsDisabled \? copy\.bodyIdle/);
  assert.doesNotMatch(bannerSource, /activeAction !== null \|\| adsDisabled/);
});

test('profile study setup card owns the localized settings shortcut', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
  const settingsLinks = source.match(/href="\/settings"/g) ?? [];
  const studySetupStart = source.indexOf('<SectionHeader title={copy.studySetupTitle}');
  const badgesStart = source.indexOf('<SectionHeader title={copy.badgesTitle}');
  const studySetupCard = source.slice(studySetupStart, badgesStart);
  const pillRowIndex = studySetupCard.indexOf('<View style={styles.pillRow}>');
  const settingsLinkIndex = studySetupCard.indexOf('href="/settings"');
  const premiumBannerIndex = source.indexOf('<PremiumBanner');

  assert.equal(settingsLinks.length, 1);
  assert.notEqual(studySetupStart, -1);
  assert.notEqual(badgesStart, -1);
  assert.ok(studySetupStart < badgesStart, 'study setup card should render before badges card');
  assert.ok(pillRowIndex >= 0, 'study setup card should render daily-goal/language badges');
  assert.ok(settingsLinkIndex > pillRowIndex, 'settings shortcut should render after setup badges');
  assert.match(studySetupCard, /<Link[\s\S]*asChild[\s\S]*href="\/settings"[\s\S]*>/);
  assert.match(
    studySetupCard,
    /<Button[\s\S]*accessibilityLabel=\{copy\.openSettingsAccessibilityLabel\}[\s\S]*accessibilityRole="link"[\s\S]*style=\{styles\.settingsLink\}[\s\S]*\{copy\.openSettings\}[\s\S]*<\/Button>/,
  );
  assert.doesNotMatch(source.slice(premiumBannerIndex), /href="\/settings"/);
  assert.match(source, /settingsLink: \{[\s\S]*minHeight: space\[6\]/);
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
      .replace('{entitlementsReady ? (\\n        <PremiumBanner', '<PremiumBanner')
      .replace('\\n      ) : null}', '');
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
