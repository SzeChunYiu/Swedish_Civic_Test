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

test('study routes keep their expected ad placements and exam stays ad-free', () => {
  const summary = parseValidationSummary();
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const learnSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/learn.tsx'), 'utf8');
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  const mistakesSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');
  const examSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');
  const nativeAdCardSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/NativeAdCard.tsx'),
    'utf8',
  );
  const nativeAdCardNativeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/NativeAdCard.native.tsx'),
    'utf8',
  );

  assert.equal(summary.adPlacementRoutesValidated, 4);
  assert.equal(summary.noAdRoutesValidated, 1);
  assert.equal(summary.adPlacementRouteParityValidated, true);
  assert.match(homeSource, /entitlementsReady: monetizationEntitlementsReady/);
  assert.match(
    homeSource,
    /monetizationEntitlementsReady && !monetizationEntitlements\.adsDisabled/,
  );
  assert.match(homeSource, /\{monetizationEntitlementsReady \? \(\s*<PremiumBanner/);
  assert.match(homeSource, /<AdBanner placement="home_banner" \/>/);
  assert.doesNotMatch(homeSource, /<AdBanner entitlements=\{monetizationEntitlements\}/);
  assert.match(learnSource, /<AdBanner placement="chapter_list_banner" \/>/);
  assert.match(practiceSource, /<AdBanner placement="quiz_completed_interstitial" \/>/);
  assert.match(mistakesSource, /<NativeAdCard \/>/);
  assert.match(nativeAdCardSource, /shouldShowAd\('results_native', resolvedEntitlements\)/);
  assert.doesNotMatch(nativeAdCardSource, /react-native-google-mobile-ads/);
  assert.match(nativeAdCardNativeSource, /NativeAd\.createForAdRequest/);
  assert.match(nativeAdCardNativeSource, /NativeAdView/);
  assert.match(nativeAdCardNativeSource, /<NativeAdView accessible=\{false\}/);
  assert.match(
    nativeAdCardNativeSource,
    /<View\s+accessible\s+accessibilityHint=\{copy\.hint\}\s+accessibilityLabel=\{copy\.accessibilityLabel\}\s+accessibilityRole="summary"[\s\S]*?style=\{styles\.summary\}/,
  );
  assert.match(nativeAdCardNativeSource, /NativeAsset/);
  assert.match(nativeAdCardNativeSource, /NativeMediaView/);
  assert.match(
    nativeAdCardNativeSource,
    /<NativeAsset assetType=\{NativeAssetType\.CALL_TO_ACTION\}>\s*<Text\s+accessible\s+accessibilityHint=\{copy\.ctaHint\}\s+accessibilityLabel=\{copy\.ctaAccessibilityLabel\(nativeAd\.callToAction\)\}\s+accessibilityRole="button"\s+style=\{styles\.cta\}\s*>/,
  );
  assert.match(nativeAdCardNativeSource, /minHeight:\s*space\[6\]/);
  assert.match(nativeAdCardNativeSource, /requestNonPersonalizedAdsOnly/);
  assert.match(nativeAdCardNativeSource, /getPlatformAdUnitId\('results_native', Platform\.OS\)/);
  assert.match(
    nativeAdCardNativeSource,
    /shouldShowAd\(\s*'results_native'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,?\s*\)/,
  );
  assert.match(nativeAdCardNativeSource, /\.destroy\(\)/);
  assert.doesNotMatch(examSource, /AdBanner|NativeAd|Interstitial|LaunchPopupAd/i);
});

test('ad placement route parity rejects a drifted study route placement', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('placement="home_banner"', 'placement="chapter_list_banner"');
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
    /app\/\(tabs\)\/home\.tsx must render AdBanner placement home_banner/,
  );
});

test('ad placement route parity rejects Home pending entitlement bypasses', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('monetizationEntitlementsReady && !monetizationEntitlements.adsDisabled', '!monetizationEntitlements.adsDisabled')
      .replace('<AdBanner placement="home_banner" />', '<AdBanner entitlements={monetizationEntitlements} placement="home_banner" />');
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
    /Home pricing wedge must stay hidden until Remove Ads entitlements resolve|Home ad banner must not receive initial free entitlements before they resolve/,
  );
});

test('ad placement route parity rejects ads on the exam route', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("import { Badge }", "import { AdBanner } from '../../components/monetization/AdBanner';\\nimport { Badge }");
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
    /app\/\(tabs\)\/exam\.tsx must not import or render ad components/,
  );
});

test('ad placement route parity rejects native ad entitlement bypass drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/NativeAdCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "!entitlementsReady || !shouldShowAd('results_native', resolvedEntitlements)",
        "!entitlementsReady",
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
    /NativeAdCard must gate results_native through shouldShowAd/,
  );
});

test('ad placement route parity rejects placeholder-only native results ads', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/NativeAdCard.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('NativeAd.createForAdRequest', 'createPlaceholderNativeAd');
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
    /NativeAdCard native placement must load results_native through NativeAd/,
  );
});

test('ad placement route parity rejects native results ad consent bypass drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/NativeAdCard.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "shouldShowAd('results_native', resolvedEntitlements, mobileAdsConsent.decision.consentDecision)",
        "shouldShowAd('results_native', resolvedEntitlements)",
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
    /NativeAdCard native placement must gate results_native through consent-aware shouldShowAd/,
  );
});

test('ad placement route parity rejects grouped native ad accessibility drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/NativeAdCard.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('<NativeAdView accessible={false}', '<NativeAdView accessible');
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
    /NativeAdCard native placement must not group the whole ad as one accessibility element/,
  );
});

test('ad placement route parity rejects unlabeled native ad call-to-action drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/NativeAdCard.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('accessibilityLabel={copy.ctaAccessibilityLabel(nativeAd.callToAction)}', '');
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
    /NativeAdCard native placement must expose the call-to-action as a labelled native asset button/,
  );
});
