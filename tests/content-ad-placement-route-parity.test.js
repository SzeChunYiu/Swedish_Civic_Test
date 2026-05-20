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
  const adCopySource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/adCopy.ts'), 'utf8');

  assert.equal(summary.adPlacementRoutesValidated, 4);
  assert.equal(summary.noAdRoutesValidated, 1);
  assert.equal(summary.adPlacementRouteParityValidated, true);
  assert.equal(summary.practiceInterstitialQuestionCapValidated, true);
  assert.match(
    homeSource,
    /const showRemoveAdsOffer = entitlementsReady && !monetizationEntitlements\.adsDisabled;/,
  );
  assert.match(homeSource, /\{showRemoveAdsOffer \? \([\s\S]*<PricingWedge/);
  assert.match(
    homeSource,
    /\{entitlementsReady \? \([\s\S]*<PremiumBanner[\s\S]*<AdBanner entitlements=\{monetizationEntitlements\} placement="home_banner" \/>/,
  );
  assert.match(learnSource, /<AdBanner placement="chapter_list_banner" \/>/);
  assert.match(practiceSource, /PracticeInterstitialAd/);
  assert.match(practiceSource, /getPracticeInterstitialShowKey\(question\.id, shuffleSessionId\)/);
  assert.doesNotMatch(practiceSource, /showKey=\{[\s\S]{0,160}selectedOptionId/);
  assert.match(mistakesSource, /<NativeAdCard \/>/);
  assert.match(
    nativeAdCardSource,
    /shouldShowAd\('results_native', resolvedEntitlements, WEB_AD_FALLBACK_CONSENT_DECISION\)/,
  );
  assert.match(nativeAdCardSource, /const resultsNativeUnit = getAdUnit\('results_native'\);/);
  assert.match(
    nativeAdCardSource,
    /const copy = getNativeAdCardCopy\(language, \{ testOnly: resultsNativeUnit\?\.testOnly \}\);/,
  );
  assert.match(nativeAdCardSource, /WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.doesNotMatch(nativeAdCardSource, /react-native-google-mobile-ads/);
  assert.match(nativeAdCardNativeSource, /NativeAd\.createForAdRequest/);
  assert.match(nativeAdCardNativeSource, /NativeAdView/);
  assert.match(nativeAdCardNativeSource, /NativeAsset/);
  assert.match(nativeAdCardNativeSource, /NativeMediaView/);
  assert.match(nativeAdCardNativeSource, /requestNonPersonalizedAdsOnly/);
  assert.match(nativeAdCardNativeSource, /getPlatformAdUnitId\('results_native', Platform\.OS\)/);
  assert.match(
    nativeAdCardNativeSource,
    /const resultsNativeUnit = getAdUnit\('results_native'\);/,
  );
  assert.match(
    nativeAdCardNativeSource,
    /const copy = getNativeAdCardCopy\(language, \{ testOnly: resultsNativeUnit\?\.testOnly \}\);/,
  );
  assert.match(
    nativeAdCardNativeSource,
    /shouldShowAd\(\s*'results_native'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );
  assert.match(nativeAdCardNativeSource, /\.destroy\(\)/);
  assert.match(adCopySource, /getNativeAdCardCopy/);
  assert.match(adCopySource, /live:\s*\{[\s\S]*?accessibilityLabel:\s*'Ad:/);
  assert.match(adCopySource, /test:\s*\{[\s\S]*?accessibilityLabel:\s*'Test native ad:/);
  const liveCopyBlocks = Array.from(
    adCopySource.matchAll(/live:\s*\{([\s\S]*?)\n    \},\n    test:/g),
    (match) => match[1],
  );
  assert.equal(liveCopyBlocks.length, 2);
  for (const liveCopyBlock of liveCopyBlocks) {
    assert.doesNotMatch(
      liveCopyBlock,
      /Test native ad|Inbyggd testannons|AdMob test placement preview|AdMob-testplacering/,
    );
  }
  assert.doesNotMatch(examSource, /AdBanner|NativeAd|Interstitial|LaunchPopupAd/i);
});

test('Home ad placement waits for Remove Ads entitlements before rendering', () => {
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');

  assert.match(
    homeSource,
    /const showRemoveAdsOffer = entitlementsReady && !monetizationEntitlements\.adsDisabled;/,
  );
  assert.match(homeSource, /\{showRemoveAdsOffer \? \([\s\S]*<PricingWedge/);
  assert.match(
    homeSource,
    /\{entitlementsReady \? \([\s\S]*<PremiumBanner[\s\S]*<AdBanner entitlements=\{monetizationEntitlements\} placement="home_banner" \/>/,
  );
});

test('ad placement route parity rejects practice interstitial keys scoped to selected answers', () => {
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
        'getPracticeInterstitialShowKey(question.id, shuffleSessionId)',
        "\`\${question.id}:\${selectedOptionId ?? ''}\`",
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
    /Practice route must key quiz_completed_interstitial by question and shuffle session/,
  );
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
        /!entitlementsReady\\s*\\|\\|\\s*!shouldShowAd\\(\\s*'results_native'\\s*,\\s*resolvedEntitlements\\s*,\\s*WEB_AD_FALLBACK_CONSENT_DECISION\\s*,?\\s*\\)/,
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
        /shouldShowAd\\(\\s*'results_native'\\s*,\\s*resolvedEntitlements\\s*,\\s*mobileAdsConsent\\.decision\\.consentDecision\\s*,\\s*Platform\\.OS\\s*,?\\s*\\)/,
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
