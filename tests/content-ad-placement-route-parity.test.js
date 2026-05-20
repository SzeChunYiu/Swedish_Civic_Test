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
  const launchPopupNativeSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/LaunchPopupAd.native.tsx'),
    'utf8',
  );
  const nativeInterstitialSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/AdInterstitial.native.tsx'),
    'utf8',
  );
  const webNativeAdCardSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/NativeAdCard.tsx'),
    'utf8',
  );
  const nativeAdCardSource = fs.readFileSync(
    path.join(repoRoot, 'components/monetization/NativeAdCard.native.tsx'),
    'utf8',
  );
  const useMockExamAccessSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useMockExamAccess.ts'),
    'utf8',
  );

  assert.equal(summary.adPlacementRoutesValidated, 4);
  assert.equal(summary.noAdRoutesValidated, 1);
  assert.equal(summary.adPlacementRouteParityValidated, true);
  assert.equal(summary.adPlacementPlatformParityValidated, true);
  assert.match(
    homeSource,
    /<AdBanner entitlements=\{monetizationEntitlements\} placement="home_banner" \/>/,
  );
  assert.match(learnSource, /<AdBanner placement="chapter_list_banner" \/>/);
  assert.match(
    practiceSource,
    /<PracticeInterstitialAd showKey=\{practiceInterstitialShowKey\} \/>/,
  );
  assert.match(
    practiceSource,
    /getPracticeInterstitialShowKey\(\s*question\.id,\s*shuffleSessionId,?\s*\)/,
  );
  assert.doesNotMatch(practiceSource, /<AdBanner placement="quiz_completed_interstitial" \/>/);
  assert.doesNotMatch(
    practiceSource,
    /<PracticeInterstitialAd\s+showKey=\{[^}\n]*selectedOptionId|showKey=\{`\$\{question\.id\}:\$\{selectedOptionId/,
  );
  assert.match(mistakesSource, /<NativeAdCard \/>/);
  assert.doesNotMatch(examSource, /AdBanner|NativeAd|Interstitial|LaunchPopupAd/i);
  assert.match(
    webBannerSource,
    /shouldShowAd\(placement, resolvedEntitlements, WEB_AD_FALLBACK_CONSENT_DECISION\)/,
  );
  assert.doesNotMatch(webBannerSource, /shouldShowAd\(\s*placement[\s\S]*Platform\.OS/);
  assert.match(nativeBannerSource, /getPlatformAdUnitId\(placement, Platform\.OS\)/);
  assert.match(
    nativeBannerSource,
    /shouldShowAd\(\s*placement\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );
  assert.match(launchPopupNativeSource, /getPlatformAdUnitId\('app_open_launch', Platform\.OS\)/);
  assert.match(launchPopupNativeSource, /shouldShowLaunchPopupAd\(\{[\s\S]*platform: Platform\.OS/);
  assert.match(
    nativeInterstitialSource,
    /shouldShowAd\(\s*'quiz_completed_interstitial'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );
  assert.match(
    nativeInterstitialSource,
    /getPlatformAdUnitId\('quiz_completed_interstitial', Platform\.OS\)/,
  );
  assert.match(
    webNativeAdCardSource,
    /shouldShowAd\('results_native', resolvedEntitlements, WEB_AD_FALLBACK_CONSENT_DECISION\)/,
  );
  assert.doesNotMatch(
    webNativeAdCardSource,
    /shouldShowAd\(\s*'results_native'[\s\S]*Platform\.OS/,
  );
  assert.match(nativeAdCardSource, /getPlatformAdUnitId\('results_native', Platform\.OS\)/);
  assert.match(
    nativeAdCardSource,
    /shouldShowAd\(\s*'results_native'\s*,\s*resolvedEntitlements\s*,\s*mobileAdsConsent\.decision\.consentDecision\s*,\s*Platform\.OS\s*,?\s*\)/,
  );
  assert.match(
    useMockExamAccessSource,
    /getMockExamAccessDecision\(\{[\s\S]*platform: Platform\.OS/,
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

test('ad placement route parity rejects drifted practice quiz completion placement', () => {
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
        '<AdBanner placement="quiz_completed_interstitial" />',
        '<AdBanner placement="home_banner" />',
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
    /app\/\(tabs\)\/practice\.tsx must render AdBanner placement quiz_completed_interstitial/,
  );
});

test('ad placement route parity rejects native interstitial banner fallback drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/monetization/AdInterstitial.native.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('InterstitialAd.createForAdRequest', 'BannerAd.createForAdRequest');
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
    /AdInterstitial native placement must use the Google Mobile Ads interstitial API/,
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
      .replace(/,\\s*WEB_AD_FALLBACK_CONSENT_DECISION/g, '');
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
    /NativeAdCard web fallback must pass WEB_AD_FALLBACK_CONSENT_DECISION to shouldShowAd/,
  );
});

test('ad placement route parity rejects web fallback consent drift', () => {
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
      .replace(', WEB_AD_FALLBACK_CONSENT_DECISION', '');
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
    /AdBanner must pass WEB_AD_FALLBACK_CONSENT_DECISION to shouldShowAd/,
  );
});

test('ad placement route parity rejects dropping native platform availability', () => {
  const cases = [
    {
      file: '/components/monetization/LaunchPopupAd.native.tsx',
      message: /LaunchPopupAd\.native must pass Platform\.OS/,
    },
    {
      file: '/components/monetization/AdBanner.native.tsx',
      message: /AdBanner\.native must pass Platform\.OS/,
    },
    {
      file: '/components/monetization/NativeAdCard.native.tsx',
      message: /NativeAdCard\.native must gate results_native through Platform\.OS/,
    },
    {
      file: '/lib/monetization/useMockExamAccess.ts',
      message: /useMockExamAccess must pass Platform\.OS/,
    },
  ];

  for (const driftCase of cases) {
    const result = spawnSync(
      process.execPath,
      [
        '-e',
        `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('${driftCase.file}')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(/Platform\\.OS/g, "'web'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
      ],
      { cwd: repoRoot, encoding: 'utf8' },
    );

    assert.notEqual(result.status, 0, `${driftCase.file} drift should fail`);
    assert.match(`${result.stdout}\n${result.stderr}`, driftCase.message);
  }
});
