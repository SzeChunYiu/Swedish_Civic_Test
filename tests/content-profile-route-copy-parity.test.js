const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const PROFILE_ROUTE_FOCUS_FLAG = '--focus-profile-route-copy';

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', PROFILE_ROUTE_FOCUS_FLAG],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('profile route shell copy stays keyed by the settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');

  assert.equal(summary.profileRouteCopyLabelsValidated, 46);
  assert.equal(summary.profileRouteCopyParityValidated, true);
  assert.equal(summary.badgesValidated, 4);
  assert.equal(summary.badgeMilestoneParityValidated, true);
  assert.match(source, /type ProfileCopy =/);
  assert.match(source, /const profileCopy: Record<AppLanguage, ProfileCopy>/);
  assert.match(source, /getAllBadges,/);
  assert.match(source, /getBadgeTitle,/);
  assert.match(source, /getBadgeDescription,/);
  assert.match(source, /getBadgeLockedHint,/);
  assert.match(source, /getBadgeProgressHint,/);
  assert.match(source, /type BadgeInput,/);
  assert.match(source, /const copy = profileCopy\[language\]/);
  assert.match(source, /Framsteg utan konto/);
  assert.match(source, /Progress without an account/);
  assert.match(source, /calculateStreakWithFreeze/);
  assert.match(source, /freezeBannerCopy\(streakWithFreeze, language\)/);
  assert.match(source, /Svitskydd/);
  assert.match(source, /Streak freeze/);
  assert.match(source, /badgeLocked: 'Låst'/);
  assert.match(source, /badgeUnlocked: 'Upplåst'/);
  assert.match(source, /badgeLocked: 'Locked'/);
  assert.match(source, /badgeUnlocked: 'Unlocked'/);
  assert.match(source, /<ScreenShell eyebrow=\{copy\.eyebrow\} title=\{copy\.title\}/);
  assert.match(source, /<MetricCard label=\{copy\.levelMetric\}/);
  assert.match(
    source,
    /<MetricCard label=\{copy\.dayStreakMetric\} value=\{currentStreak\} helper=\{dayStreakHelper\}/,
  );
  assert.match(source, /<SectionHeader title=\{copy\.studySetupTitle\}/);
  assert.match(source, /const dailyGoalAnswers = useSettingsStore/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(
    source,
    /openSettingsAccessibilityLabel: 'Öppna inställningar för dagligt mål, språk och ljud'/,
  );
  assert.match(
    source,
    /openSettingsAccessibilityLabel: 'Open settings for daily goal, language, and audio'/,
  );
  assert.match(source, /studySetupCta: 'Ändra mål, språk och ljud'/);
  assert.match(source, /studySetupCta: 'Adjust goal, language, and audio'/);
  assert.doesNotMatch(source, /openSettings: '/);
  assert.match(source, /const badgeInput: BadgeInput = \{/);
  assert.match(source, /const unlockedBadgeIds = new Set\(deriveBadges\(badgeInput\)/);
  assert.match(source, /<BadgeRow/);
  assert.match(source, /statusLabel=\{statusLabel\}/);
  assert.match(source, /title=\{getBadgeTitle\(badge, language\)\}/);
  assert.match(source, /progressHint=\{getBadgeProgressHint\(badge, badgeInput, language\)\}/);
  assert.match(source, /accessibilityLabel=\{copy\.openSettingsAccessibilityLabel\}/);
  assert.match(source, /<SectionHeader title=\{copy\.dashboardTitle\}/);
  assert.match(source, /accessibilityLabel=\{copy\.dashboardAccessibilityLabel\}/);
  assert.match(source, /href="\/dashboard"/);
  assert.match(source, /label=\{copy\.dashboardCta\}/);
  assert.match(source, /<SectionHeader title=\{copy\.weeklyRecapTitle\}/);
  assert.match(source, /accessibilityLabel=\{copy\.weeklyRecapAccessibilityLabel\}/);
  assert.match(source, /href="\/recap"/);
  assert.match(source, /label=\{copy\.weeklyRecapCta\}/);
  assert.match(source, /weeklyRecapTitle: 'Veckans översikt'/);
  assert.match(source, /weeklyRecapTitle: 'Weekly recap'/);
  assert.match(source, /copy\.removeAdsFocusCue/);
  assert.doesNotMatch(source, new RegExp(['Misstags', 'repetition'].join('')));
  assert.match(source, /Ta bort annonser är markerat/);
  assert.match(source, /Remove Ads is highlighted/);
});

test('profile route keeps Pro comparison separate from the Remove Ads purchase flow', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
  const proPaywallSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/ProPaywall.tsx'),
    'utf8',
  );
  const premiumBannerIndex = source.indexOf('<PremiumBanner');
  const proScopeGateIndex = source.indexOf('entitlementsReady && proRuntimeScopeEnabled');
  const proPaywallIndex = source.indexOf('<ProPaywall');

  assert.ok(premiumBannerIndex >= 0, 'Profile should still render the Remove Ads banner');
  assert.ok(
    proScopeGateIndex > premiumBannerIndex,
    'Pro comparison should stay behind runtime scope',
  );
  assert.ok(
    proPaywallIndex > proScopeGateIndex,
    'Pro comparison should render only inside the gate',
  );
  assert.ok(proPaywallIndex > premiumBannerIndex, 'Pro comparison should follow Remove Ads');
  assert.match(source, /runtimeOptions=\{purchaseRuntime\}/);
  assert.match(source, /const proRuntimeScopeEnabled = isProRuntimeScopeEnabled\(\);/);
  assert.doesNotMatch(source, /\{entitlementsReady \? \(\s*<ProPaywall/);
  assert.match(proPaywallSource, /buyProLifetime/);
  assert.match(proPaywallSource, /restoreProLifetime/);
  assert.doesNotMatch(proPaywallSource, /buyRemoveAds|restoreRemoveAdsPurchase/);
  assert.match(proPaywallSource, /PRO_LIFETIME_PRICE_LABEL/);
  assert.match(proPaywallSource, /Pro is a separate one-time purchase with ad-free study/);
  assert.match(
    proPaywallSource,
    /Remove Ads for \$\{REMOVE_ADS_PRICE_LABEL\} stays available as its own simpler ad-free path/,
  );
  assert.match(proPaywallSource, /Pro är ett separat engångsköp med annonsfri studie/);
  assert.match(
    proPaywallSource,
    /Ta bort annonser för \$\{REMOVE_ADS_PRICE_LABEL\} finns kvar som en egen enklare annonsfri väg/,
  );
  assert.match(proPaywallSource, /Buys Pro Lifetime with ad-free study/);
  assert.match(proPaywallSource, /Köper Pro Lifetime med annonsfri studie/);
  assert.match(proPaywallSource, /Pro also includes ad-free study/);
  assert.match(proPaywallSource, /Pro innehåller också annonsfri studie/);
  assert.match(proPaywallSource, /<View style=\{styles\.table\}>/);
  assert.match(proPaywallSource, /<View style=\{styles\.actions\}>/);
  assert.match(proPaywallSource, /aria-live="polite"/);
  assert.doesNotMatch(proPaywallSource, /comparisonVisible|setComparisonVisible/);
  assert.doesNotMatch(proPaywallSource, /Compare Pro features|Jämför Pro-funktioner/);
  assert.doesNotMatch(proPaywallSource, /accessibilityState=\{\{ expanded:/);
  assert.doesNotMatch(proPaywallSource, /\{comparisonVisible \? \(/);
});

test('profile premium banner keeps current Remove Ads purchase and recovery contract', () => {
  const profileSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
  const bannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PremiumBanner.tsx'),
    'utf8',
  );

  assert.match(profileSource, /const removeAdsPaywall = entitlementsReady \? \(/);
  assert.match(profileSource, /entitlements=\{monetizationEntitlements\}/);
  assert.match(profileSource, /nativeID="remove-ads-paywall"/);
  assert.match(bannerSource, /body: \(price: string\) => string/);
  assert.match(bannerSource, /body: \(price\) =>/);
  assert.match(bannerSource, /titleActive: string/);
  assert.match(bannerSource, /titleIdle: string/);
  assert.match(bannerSource, /eyebrowActive: string/);
  assert.match(bannerSource, /statusMessages: Record<PurchaseUiStatus, string>/);
  assert.match(bannerSource, /purchased: 'Ads are disabled on this device\.'/);
  assert.match(bannerSource, /purchased: 'Annonser är avstängda på den här enheten\.'/);
  assert.match(
    bannerSource,
    /purchaseUnavailable[\s\S]*copy\.webUnavailableBody\(resolvedPriceLabel\)[\s\S]*copy\.body\(resolvedPriceLabel\)/,
  );
  assert.match(
    bannerSource,
    /accessibilityState=\{\{[\s\S]*busy: activeAction === 'buy'[\s\S]*disabled: actionsDisabled[\s\S]*\}\}[\s\S]*disabled=\{actionsDisabled\}[\s\S]*copy\.buyIdle\(resolvedPriceLabel\)/,
  );
  assert.match(bannerSource, /accessibilityLabel=\{copy\.restoreAccessibilityLabel\}/);
  assert.match(
    bannerSource,
    /accessibilityState=\{\{ busy: activeAction === 'restore', disabled: actionsDisabled \}\}[\s\S]*disabled=\{actionsDisabled\}[\s\S]*copy\.restoreIdle/,
  );
  assert.match(
    bannerSource,
    /const visibleStatus =[\s\S]*status === 'finish_failed'[\s\S]*adsDisabled[\s\S]*\? 'purchased'[\s\S]*purchaseUnavailable[\s\S]*\? 'unavailable'[\s\S]*: status;[\s\S]*const statusMessage =[\s\S]*nativePurchaseUnavailable && visibleStatus === 'unavailable'[\s\S]*\? copy\.nativeUnavailableStatus[\s\S]*: getStatusMessage\(visibleStatus, copy\)/,
  );
  assert.match(bannerSource, /aria-live="polite"/);
  assert.doesNotMatch(bannerSource, /bodyActive:/);
  assert.doesNotMatch(bannerSource, /bodyIdle:/);
  assert.doesNotMatch(bannerSource, /Purchase confirmed\. Study ads are disabled on this device/);
  assert.doesNotMatch(bannerSource, /Köpet är bekräftat\. Studieannonser är avstängda/);
  assert.doesNotMatch(bannerSource, /!\s*adsDisabled \? \(/);
  assert.doesNotMatch(bannerSource, /adsDisabled \? copy\.bodyIdle/);
});

test('profile study setup card owns the localized settings shortcut', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
  const settingsLinks = source.match(/pathname: '\/settings'/g) ?? [];
  const studySetupStart = source.indexOf('<SectionHeader title={copy.studySetupTitle}');
  const badgesStart = source.indexOf('<SectionHeader title={copy.badgesTitle}');
  const studySetupCard = source.slice(studySetupStart, badgesStart);
  const pillRowIndex = studySetupCard.indexOf('<View style={styles.pillRow}>');
  const settingsLinkIndex = studySetupCard.indexOf("pathname: '/settings'");

  assert.equal(settingsLinks.length, 1);
  assert.notEqual(studySetupStart, -1);
  assert.notEqual(badgesStart, -1);
  assert.ok(studySetupStart < badgesStart, 'study setup card should render before badges card');
  assert.ok(pillRowIndex >= 0, 'study setup card should render daily-goal/language badges');
  assert.ok(settingsLinkIndex > pillRowIndex, 'settings shortcut should render after setup badges');
  assert.match(source, /const dailyGoalAnswers = useSettingsStore/);
  assert.match(
    studySetupCard,
    /\{copy\.dailyGoalBadgeLabel\}: \{dailyGoalAnswers\} \{copy\.answersPerDay\}/,
  );
  assert.match(studySetupCard, /\{copy\.languageBadgeLabel\}: \{copy\.languageBadge\}/);
  assert.match(
    studySetupCard,
    /<Link[\s\S]*asChild[\s\S]*href=\{\{[\s\S]*pathname: '\/settings'[\s\S]*params: \{ focus: 'study' \}[\s\S]*\}\}[\s\S]*>/,
  );
  assert.match(
    studySetupCard,
    /<Button[\s\S]*accessibilityLabel=\{copy\.openSettingsAccessibilityLabel\}[\s\S]*accessibilityRole="link"[\s\S]*style=\{styles\.settingsLink\}[\s\S]*\{copy\.studySetupCta\}[\s\S]*<\/Button>/,
  );
  assert.match(
    studySetupCard,
    /audioEnabled \? copy\.audioEnabledBadge : copy\.audioDisabledBadge/,
  );
  assert.doesNotMatch(studySetupCard, /\{copy\.openSettings\}/);
  assert.doesNotMatch(source.slice(badgesStart), /pathname: '\/settings'/);
  assert.match(source, /settingsLink: \{[\s\S]*minHeight: space\[6\]/);
});

test('profile weekly recap card owns the localized recap shortcut', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
  const dashboardStart = source.indexOf('<SectionHeader title={copy.dashboardTitle}');
  const weeklyRecapStart = source.indexOf('<SectionHeader title={copy.weeklyRecapTitle}');
  const badgesStart = source.indexOf('<SectionHeader title={copy.badgesTitle}');
  const weeklyRecapCard = source.slice(weeklyRecapStart, badgesStart);
  const recapLinks = source.match(/href="\/recap"/g) ?? [];

  assert.equal(recapLinks.length, 1);
  assert.notEqual(dashboardStart, -1);
  assert.notEqual(weeklyRecapStart, -1);
  assert.notEqual(badgesStart, -1);
  assert.ok(
    dashboardStart < weeklyRecapStart,
    'weekly recap card should follow the progress dashboard card',
  );
  assert.ok(weeklyRecapStart < badgesStart, 'weekly recap card should render before badges');
  assert.match(
    weeklyRecapCard,
    /<SectionHeader title=\{copy\.weeklyRecapTitle\} subtitle=\{copy\.weeklyRecapSubtitle\}/,
  );
  assert.match(
    weeklyRecapCard,
    /<ComplianceActionLink[\s\S]*accessibilityLabel=\{copy\.weeklyRecapAccessibilityLabel\}[\s\S]*href="\/recap"[\s\S]*label=\{copy\.weeklyRecapCta\}[\s\S]*\/>/,
  );
  assert.doesNotMatch(source.slice(badgesStart), /href="\/recap"/);
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
process.argv.push('${PROFILE_ROUTE_FOCUS_FLAG}');
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
process.argv.push('${PROFILE_ROUTE_FOCUS_FLAG}');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /profile route is missing sv copy/);
});

test('profile route copy parity rejects badge-title localization drift', () => {
  const badgeSource = fs.readFileSync(path.join(repoRoot, 'lib/learning/badges.ts'), 'utf8');
  assert.match(badgeSource, /titleSv: 'Första övningen'/);

  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/learning/badges.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("titleSv: 'Första övningen'", "titleSv: 'First practice'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('${PROFILE_ROUTE_FOCUS_FLAG}');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /first_practice titleSv must be localized separately from titleEn/,
  );
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
process.argv.push('${PROFILE_ROUTE_FOCUS_FLAG}');
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
process.argv.push('${PROFILE_ROUTE_FOCUS_FLAG}');
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
