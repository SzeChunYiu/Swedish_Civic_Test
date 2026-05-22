const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-ad-placement-route-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
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
  const webAdBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.tsx'),
    'utf8',
  );
  const nativeAdBannerSource = fs.readFileSync(
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
  const adBannerNativeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.native.tsx'),
    'utf8',
  );
  const practiceInterstitialNativeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PracticeInterstitialAd.native.tsx'),
    'utf8',
  );
  const practiceInterstitialWebSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/PracticeInterstitialAd.tsx'),
    'utf8',
  );
  const adCopySource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/adCopy.ts'), 'utf8');
  const adsSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/ads.ts'), 'utf8');

  assert.equal(summary.adPlacementRoutesValidated, 4);
  assert.equal(summary.noAdRoutesValidated, 1);
  assert.equal(summary.adPlacementRouteParityValidated, true);
  assert.match(
    homeSource,
    /const showRemoveAdsOffer = entitlementsReady && monetizationEntitlements\.adsDisabled !== true;/,
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
  assert.match(webAdBannerSource, /WEB_AD_FALLBACK_CONSENT_DECISION/);
  assert.match(
    webAdBannerSource,
    /shouldShowAd\(\s*placement\s*,\s*resolvedEntitlements\s*,\s*WEB_AD_FALLBACK_CONSENT_DECISION\s*,?\s*\)/,
  );
  assert.doesNotMatch(webAdBannerSource, /react-native-google-mobile-ads/);
  assert.match(nativeAdBannerSource, /getPlatformAdUnitId\(placement, Platform\.OS\)/);
  assert.match(
    nativeAdBannerSource,
    /shouldShowAd\(\s*placement\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );
  assert.match(
    nativeAdBannerSource,
    /requestOptions=\{\{\s*requestNonPersonalizedAdsOnly:\s*mobileAdsConsent\.decision\.requestNonPersonalizedAdsOnly,\s*\}\}/,
  );
  assert.match(nativeAdBannerSource, /size=\{BannerAdSize\.ANCHORED_ADAPTIVE_BANNER\}/);
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
  assert.match(nativeAdCardNativeSource, /getNativeAdSummaryAccessibilityLabel/);
  assert.match(
    nativeAdCardNativeSource,
    /summaryAccessibilityLabel = getNativeAdSummaryAccessibilityLabel\(copy, \{\s*advertiser: nativeAd\.advertiser,\s*body: nativeAd\.body,\s*headline: nativeAd\.headline,\s*\}\)/,
  );
  assert.doesNotMatch(nativeAdCardNativeSource, /accessibilityLabel=\{copy\.accessibilityLabel\}/);
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
  assert.match(
    practiceInterstitialNativeSource,
    /shouldShowAd\(\s*'quiz_completed_interstitial'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );
  assert.match(practiceInterstitialWebSource, /getAdBannerStatusLabel/);
  assert.match(
    practiceInterstitialWebSource,
    /const adStatusLabel = getAdBannerStatusLabel\(copy, unit\);/,
  );
  assert.doesNotMatch(
    practiceInterstitialWebSource,
    /unit\?\.testOnly\s*\?\s*copy\.testStatus\s*:\s*copy\.liveStatus|const adStatusLabel = copy\.liveStatus/,
  );
  assert.match(practiceInterstitialNativeSource, /createPracticeInterstitialAttemptState/);
  assert.match(practiceInterstitialNativeSource, /reducePracticeInterstitialAttemptState/);
  assert.match(practiceInterstitialNativeSource, /PRACTICE_INTERSTITIAL_LOAD_TIMEOUT_MS/);
  assert.match(practiceInterstitialNativeSource, /PRACTICE_INTERSTITIAL_SHOW_TIMEOUT_MS/);
  assert.match(practiceInterstitialNativeSource, /dispatchAttemptEvent\('load_timeout'\)/);
  assert.match(practiceInterstitialNativeSource, /dispatchAttemptEvent\('show_timeout'\)/);
  assert.doesNotMatch(practiceInterstitialNativeSource, /let attemptSettled|let showStarted/);
  assert.match(adBannerNativeSource, /const unit = getAdUnit\(placement\);/);
  assert.match(adBannerNativeSource, /getAdBannerStatusLabel/);
  assert.match(adBannerNativeSource, /const adStatusLabel = getAdBannerStatusLabel\(copy, unit\);/);
  assert.match(
    adBannerNativeSource,
    /const accessibilityLabel = copy\.accessibilityLabel\(placementLabel, adStatusLabel\);/,
  );
  assert.doesNotMatch(
    adBannerNativeSource,
    /accessibilityLabel=\{copy\.accessibilityLabel\(placementLabel, copy\.liveStatus\)\}/,
  );
  assert.match(nativeAdCardNativeSource, /\.destroy\(\)/);
  assert.match(adCopySource, /testStatus:\s*'AdMob-testannons aktiv - förhandsvisning'/);
  assert.match(adCopySource, /testStatus:\s*'AdMob test unit active - preview'/);
  assert.doesNotMatch(
    adCopySource,
    /testStatus:\s*'[^']*(?:web preview|webbförhandsvisning)[^']*'/,
  );
  assert.match(adCopySource, /getNativeAdCardCopy/);
  assert.match(adsSource, /import \{ isStrictEntitlementFlag \} from '\.\/premium';/);
  assert.match(adsSource, /isStrictEntitlementFlag\(entitlements\.adsDisabled\)/);
  assert.doesNotMatch(adsSource, /if \(entitlements\.adsDisabled\) return false;/);
  assert.match(adCopySource, /getNativeAdSummaryAccessibilityLabel/);
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
  assert.doesNotMatch(
    examSource,
    /AdBanner|NativeAd|Interstitial|LaunchPopupAd|RewardedAd|showRewardedExtraExamAd|rewardPreview|sponsor preview|Sponsrad förhandsvisning|Sponsored preview|Complete sponsor preview|Slutför förhandsvisning|Unlock extra exam|Lås upp extra prov/i,
  );
});

test('AdBanner testStatus copy stays platform-neutral for native and web test placements', () => {
  const webBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.tsx'),
    'utf8',
  );
  const nativeBannerSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdBanner.native.tsx'),
    'utf8',
  );
  const adCopySource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/adCopy.ts'), 'utf8');

  assert.match(adCopySource, /testStatus: 'AdMob test unit active - preview'/);
  assert.match(adCopySource, /testStatus: 'AdMob-testannons aktiv - förhandsvisning'/);
  assert.doesNotMatch(adCopySource, /web preview|webbförhandsvisning/);
  assert.match(webBannerSource, /getAdBannerStatusLabel/);
  assert.match(webBannerSource, /const unit = getAdUnit\(placement\);/);
  assert.match(webBannerSource, /const adStatusLabel = getAdBannerStatusLabel\(copy, unit\);/);
  assert.match(nativeBannerSource, /const unit = getAdUnit\(placement\);/);
  assert.match(nativeBannerSource, /getAdBannerStatusLabel/);
  assert.match(nativeBannerSource, /const adStatusLabel = getAdBannerStatusLabel\(copy, unit\);/);
  assert.match(
    nativeBannerSource,
    /const accessibilityLabel = copy\.accessibilityLabel\(placementLabel, adStatusLabel\);/,
  );
  assert.match(nativeBannerSource, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.doesNotMatch(
    nativeBannerSource,
    /accessibilityLabel=\{copy\.accessibilityLabel\(placementLabel, copy\.liveStatus\)\}/,
  );
});

test('ad placement route parity rejects native banner live-only status copy drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/AdBanner.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const adStatusLabel = getAdBannerStatusLabel(copy, unit);', 'const adStatusLabel = copy.liveStatus;')
      .replace('copy.accessibilityLabel(placementLabel, adStatusLabel)', 'copy.accessibilityLabel(placementLabel, copy.liveStatus)');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-ad-placement-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AdBanner native placement must derive status copy from unit\.testOnly/,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AdBanner native placement must not hardcode live status copy/,
  );
});

test('ad placement route parity rejects native banner unit lookup platform drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/AdBanner.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('getPlatformAdUnitId(placement, Platform.OS)', 'getPlatformAdUnitId(placement)');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-ad-placement-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AdBanner native placement must resolve banner units by Platform\.OS/,
  );
});

test('ad placement route parity rejects native banner missing unitId render guard', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/AdBanner.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('if (!unitId) return null;', '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-ad-placement-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AdBanner native placement must return null before rendering BannerAd without a platform unit id/,
  );
});

test('ad placement route parity rejects native banner shouldShowAd platform drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/AdBanner.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        /shouldShowAd\\(\\s*placement\\s*,\\s*resolvedEntitlements\\s*,\\s*mobileAdsConsent\\.decision\\.consentDecision\\s*,\\s*Platform\\.OS\\s*,?\\s*\\)/,
        'shouldShowAd(placement, resolvedEntitlements, mobileAdsConsent.decision.consentDecision)',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-ad-placement-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AdBanner native placement must gate banners through platform-aware shouldShowAd/,
  );
});

test('ad placement route parity rejects native banner request option drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/AdBanner.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        /requestOptions=\\{\\{\\s*requestNonPersonalizedAdsOnly:\\s*mobileAdsConsent\\.decision\\.requestNonPersonalizedAdsOnly,\\s*\\}\\}/,
        'requestOptions={{ requestNonPersonalizedAdsOnly: false }}',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-ad-placement-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AdBanner native placement must pass consent-derived non-personalized request options/,
  );
});

test('ad placement route parity rejects native banner adaptive size drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/AdBanner.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}', 'size="BANNER"');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-ad-placement-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AdBanner native placement must render adaptive banner size/,
  );
});

test('ad placement route parity rejects web banner fallback consent drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/AdBanner.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        /shouldShowAd\\(\\s*placement\\s*,\\s*resolvedEntitlements\\s*,\\s*WEB_AD_FALLBACK_CONSENT_DECISION\\s*,?\\s*\\)/,
        'shouldShowAd(placement, resolvedEntitlements)',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-ad-placement-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AdBanner web fallback must use the shared web fallback consent decision/,
  );
});

test('ad placement route parity rejects native practice interstitial platform bypass drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/PracticeInterstitialAd.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        /shouldShowAd\\(\\s*'quiz_completed_interstitial'\\s*,\\s*resolvedEntitlements\\s*,\\s*mobileAdsConsent\\.decision\\.consentDecision\\s*,\\s*Platform\\.OS\\s*,?\\s*\\)/,
        "shouldShowAd('quiz_completed_interstitial', resolvedEntitlements, mobileAdsConsent.decision.consentDecision)",
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-ad-placement-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /PracticeInterstitialAd native placement must gate quiz_completed_interstitial through consent-aware platform shouldShowAd/,
  );
});

test('ad placement route parity rejects PracticeInterstitialAd fallback status drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/PracticeInterstitialAd.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'const adStatusLabel = getAdBannerStatusLabel(copy, unit);',
        'const adStatusLabel = unit?.testOnly ? copy.testStatus : copy.liveStatus;',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-ad-placement-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /PracticeInterstitialAd web fallback must derive status copy from unit\.testOnly/,
  );
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /PracticeInterstitialAd web fallback must not inline live\/test status copy/,
  );
});

test('Home ad placement waits for Remove Ads entitlements before rendering', () => {
  const homeSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');

  assert.match(
    homeSource,
    /const showRemoveAdsOffer = entitlementsReady && monetizationEntitlements\.adsDisabled !== true;/,
  );
  assert.match(homeSource, /\{showRemoveAdsOffer \? \([\s\S]*<PricingWedge/);
  assert.match(
    homeSource,
    /\{entitlementsReady \? \([\s\S]*<PremiumBanner[\s\S]*<AdBanner entitlements=\{monetizationEntitlements\} placement="home_banner" \/>/,
  );
});

test('ad placement route parity rejects ungated Home banner entitlements', () => {
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
      .replace('{entitlementsReady ? (', '{true ? (');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-ad-placement-route-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /app\/\(tabs\)\/home\.tsx must gate home_banner behind Remove Ads entitlement readiness/,
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
process.argv.push('--focus-ad-placement-route-parity');
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
process.argv.push('--focus-ad-placement-route-parity');
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
process.argv.push('--focus-ad-placement-route-parity');
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
process.argv.push('--focus-ad-placement-route-parity');
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
process.argv.push('--focus-ad-placement-route-parity');
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
process.argv.push('--focus-ad-placement-route-parity');
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
