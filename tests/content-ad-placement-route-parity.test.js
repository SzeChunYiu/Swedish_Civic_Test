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
  const webBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.tsx'),
    'utf8',
  );
  const nativeBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.native.tsx'),
    'utf8',
  );
  const nativeAdCardSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/NativeAdCard.tsx'),
    'utf8',
  );
  const nativeAdCardNativeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/NativeAdCard.native.tsx'),
    'utf8',
  );
  const practiceInterstitialSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PracticeInterstitialAd.tsx'),
    'utf8',
  );
  const practiceInterstitialNativeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PracticeInterstitialAd.native.tsx'),
    'utf8',
  );

  assert.equal(summary.bannerAdPlacementTypeCasesValidated, 3);
  assert.equal(summary.adPlacementRoutesValidated, 4);
  assert.equal(summary.noAdRoutesValidated, 1);
  assert.equal(summary.nativeAdAssetDirectChildrenValidated, 5);
  assert.equal(summary.adPlacementRouteParityValidated, true);
  assert.equal(summary.adCopySvRewardedPracticeExamCasesValidated, 7);
  assert.equal(summary.adCopySvRewardedPracticeExamNaturalnessValidated, true);
  assert.match(webBannerSource, /placement\?: BannerAdPlacement;/);
  assert.doesNotMatch(webBannerSource, /\bAdPlacement\b/);
  assert.match(nativeBannerSource, /placement\?: BannerAdPlacement;/);
  assert.doesNotMatch(nativeBannerSource, /\bAdPlacement\b/);
  assert.match(homeSource, /entitlementsReady: monetizationEntitlementsReady/);
  assert.match(
    homeSource,
    /monetizationEntitlementsReady && !monetizationEntitlements\.adsDisabled/,
  );
  assert.match(homeSource, /\{monetizationEntitlementsReady \? \(\s*<PremiumBanner/);
  assert.match(homeSource, /<AdBanner placement="home_banner" \/>/);
  assert.doesNotMatch(homeSource, /<AdBanner entitlements=\{monetizationEntitlements\}/);
  assert.match(learnSource, /<AdBanner placement="chapter_list_banner" \/>/);
  assert.match(practiceSource, /PracticeInterstitialAd/);
  assert.match(
    practiceSource,
    /<PracticeInterstitialAd showKey=\{`\$\{question\.id\}:\$\{selectedOptionId \?\? ''\}`\} \/>/,
  );
  assert.doesNotMatch(practiceSource, /<AdBanner placement="quiz_completed_interstitial" \/>/);
  assert.match(mistakesSource, /<NativeAdCard \/>/);
  assert.match(
    practiceInterstitialSource,
    /shouldShowAd\('quiz_completed_interstitial', resolvedEntitlements\)/,
  );
  assert.doesNotMatch(practiceInterstitialSource, /react-native-google-mobile-ads/);
  assert.match(practiceInterstitialNativeSource, /InterstitialAd\.createForAdRequest/);
  assert.match(practiceInterstitialNativeSource, /AdEventType\.LOADED/);
  assert.match(practiceInterstitialNativeSource, /AdEventType\.ERROR/);
  assert.match(practiceInterstitialNativeSource, /interstitialAd\.show\(\)/);
  assert.match(
    practiceInterstitialNativeSource,
    /getPlatformAdUnitId\('quiz_completed_interstitial', Platform\.OS\)/,
  );
  assert.match(
    practiceInterstitialNativeSource,
    /shouldShowAd\(\s*'quiz_completed_interstitial'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,?\s*\)/,
  );
  assert.match(practiceInterstitialNativeSource, /useMobileAdsConsent/);
  assert.match(practiceInterstitialNativeSource, /requestNonPersonalizedAdsOnly/);
  assert.match(practiceInterstitialNativeSource, /lastInterstitialShowKey === showKey/);
  assert.match(nativeAdCardSource, /shouldShowAd\('results_native', resolvedEntitlements\)/);
  assert.match(nativeAdCardSource, /getAdUnit\('results_native'\)/);
  assert.match(nativeAdCardSource, /getNativeAdCardCopy\(language, unit\)/);
  assert.doesNotMatch(nativeAdCardSource, /react-native-google-mobile-ads/);
  assert.match(nativeAdCardNativeSource, /NativeAd\.createForAdRequest/);
  assert.match(nativeAdCardNativeSource, /NativeAdView/);
  assert.match(nativeAdCardNativeSource, /<NativeAdView accessible=\{false\}/);
  assert.match(
    nativeAdCardNativeSource,
    /<View\s+accessible\s+accessibilityHint=\{copy\.hint\}\s+accessibilityLabel=\{copy\.accessibilityLabel\}\s+accessibilityRole="summary"[\s\S]*?style=\{styles\.summary\}/,
  );
  assert.match(nativeAdCardNativeSource, /NativeAsset/);
  for (const [assetType, directChild] of [
    ['ICON', 'Image'],
    ['HEADLINE', 'Text'],
    ['BODY', 'Text'],
    ['ADVERTISER', 'Text'],
    ['CALL_TO_ACTION', 'Text'],
  ]) {
    assert.match(
      nativeAdCardNativeSource,
      new RegExp(
        `<NativeAsset assetType=\\{NativeAssetType\\.${assetType}\\}>\\s*<${directChild}\\b`,
      ),
    );
  }
  assert.match(nativeAdCardNativeSource, /NativeMediaView/);
  assert.match(
    nativeAdCardNativeSource,
    /<NativeAsset assetType=\{NativeAssetType\.CALL_TO_ACTION\}>\s*<Text\s+accessible\s+accessibilityHint=\{copy\.ctaHint\}\s+accessibilityLabel=\{copy\.ctaAccessibilityLabel\(nativeAd\.callToAction\)\}\s+accessibilityRole="button"\s+style=\{styles\.cta\}\s*>/,
  );
  assert.match(nativeAdCardNativeSource, /minHeight:\s*space\[6\]/);
  assert.match(nativeAdCardNativeSource, /requestNonPersonalizedAdsOnly/);
  assert.match(nativeAdCardNativeSource, /getAdUnit\('results_native'\)/);
  assert.match(nativeAdCardNativeSource, /getNativeAdCardCopy\(language, unit\)/);
  assert.match(nativeAdCardNativeSource, /getPlatformAdUnitId\('results_native', Platform\.OS\)/);
  assert.match(
    nativeAdCardNativeSource,
    /shouldShowAd\(\s*'results_native'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,?\s*\)/,
  );
  assert.match(nativeAdCardNativeSource, /\.destroy\(\)/);
  assert.doesNotMatch(examSource, /AdBanner|NativeAd|Interstitial|LaunchPopupAd/i);
});

test('ad placement route parity rejects non-banner placements routed through AdBanner', () => {
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
      .replace(
        '<AdBanner placement="home_banner" />',
        '<AdBanner placement="quiz_completed_interstitial" />\\n<AdBanner placement="results_native" />\\n<AdBanner placement="rewarded_extra_exam" />',
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
    /app\/\(tabs\)\/home\.tsx must not pass non-banner placement quiz_completed_interstitial to AdBanner/,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /app\/\(tabs\)\/home\.tsx must not pass non-banner placement results_native to AdBanner/,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /app\/\(tabs\)\/home\.tsx must not pass non-banner placement rewarded_extra_exam to AdBanner/,
  );
});

test('ad placement route parity rejects AdBanner widening back to all ad placements', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (
    normalizedPath.endsWith('/components/monetization/AdBanner.tsx') ||
    normalizedPath.endsWith('/components/monetization/AdBanner.native.tsx')
  ) {
    return originalReadFileSync.call(this, filePath, ...args).replace(/BannerAdPlacement/g, 'AdPlacement');
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
    /web AdBanner props must use BannerAdPlacement|web AdBanner must not accept the full AdPlacement union/,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /native AdBanner props must use BannerAdPlacement|native AdBanner must not accept the full AdPlacement union/,
  );
});

test('ad placement route parity rejects practice interstitials routed through BannerAd', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/practice.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<PracticeInterstitialAd showKey={\`\${question.id}:\${selectedOptionId ?? \\'\\'}\`} />',
        '<AdBanner placement="quiz_completed_interstitial" />',
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
    /app\/\(tabs\)\/practice\.tsx must render PracticeInterstitialAd placement quiz_completed_interstitial|Practice completion interstitial must not flow through AdBanner/,
  );
});

test('ad placement route parity rejects bare Swedish rewarded extra-exam ad copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/adCopy.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('Annons för extra övningsprov', 'Annons för extra prov');
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
    /rewarded_extra_exam Swedish ad placement label must say "Annons för extra övningsprov"|rewarded ad copy sources must not contain bare Swedish "extra prov" wording/,
  );
});

test('ad placement parity keeps real ad unit env reads literal for web export', () => {
  const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');
  const realAdEnvKeys = [...adsSource.matchAll(/['"](EXPO_PUBLIC_ADMOB_[A-Z_]+_UNIT_ID)['"]/g)].map(
    (match) => match[1],
  );

  assert.match(adsSource, /REAL_AD_UNIT_ENV_VALUES/);
  assert.doesNotMatch(
    adsSource,
    /process\.env\s*\[[^\]]+\]/,
    'web export needs literal process.env.EXPO_PUBLIC_ADMOB_* reads for real ad IDs',
  );
  assert.ok(realAdEnvKeys.length >= 12, 'expected platform-specific real ad unit env keys');

  for (const envKey of new Set(realAdEnvKeys)) {
    assert.match(
      adsSource,
      new RegExp(`process\\.env\\.${envKey}\\b`),
      `${envKey} must have a matching literal process.env.${envKey} read`,
    );
  }
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

test('ad placement route parity rejects wrapped native ad asset children', () => {
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
        '<NativeAsset assetType={NativeAssetType.HEADLINE}>\\n              <Text',
        '<NativeAsset assetType={NativeAssetType.HEADLINE}>\\n              <Pressable>\\n                <Text',
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
    /NativeAdCard native HEADLINE asset must not wrap its registered child/,
  );
});
