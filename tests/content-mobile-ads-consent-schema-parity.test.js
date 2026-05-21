const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('mobile ads consent TypeScript schema stays in parity with validator expectations', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const mobileConsentSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/mobileAdsConsent.ts'),
    'utf8',
  );

  assert.equal(summary.mobileAdsConsentTypeInterfacesValidated, 5);
  assert.equal(summary.mobileAdsConsentTypeSchemaParityValidated, true);
  assert.match(mobileConsentSource, /export interface MobileAdsConsentRuntime/);
  assert.match(mobileConsentSource, /platform: AdConsentPlatform \| string;/);
  assert.match(mobileConsentSource, /gatherUmpConsent\?: \(\) => Promise<UmpConsentResult>;/);
  assert.match(mobileConsentSource, /decision: AdSdkInitializationDecision;/);
});

test('mobile ads consent focus validates runtime region normalization', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-mobile-ads-consent'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.equal(summary.mobileAdsConsentRegionRuntimeCasesValidated, 11);
  assert.equal(summary.mobileAdsConsentRegionRuntimeParityValidated, true);
});

test('mobile ads consent focus rejects unnormalized runtime region state construction', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
process.argv = [process.argv[0], 'scripts/validate-content.js', '--focus-mobile-ads-consent'];
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/monetization/mobileAdsConsent.ts')) {
    return String(contents).replaceAll('region: normalizeAdConsentRegion(region),', 'region,');
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Mobile Ads consent state construction must normalize runtime region values/,
  );
});

test('mobile ads consent schema parity rejects runtime platform optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/mobileAdsConsent.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('platform: AdConsentPlatform | string;', 'platform?: AdConsentPlatform | string;');
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
    /lib\/monetization\/mobileAdsConsent\.ts MobileAdsConsentRuntime\.platform optional=true, expected false/,
  );
});

test('mobile ads consent schema parity rejects parallel ATT and UMP prompt collection', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/monetization/mobileAdsConsent.ts')) {
    return String(contents).replace(
      /const currentTrackingTransparencyStatus = await getCurrentTrackingTransparencyStatus\\([\\s\\S]*?\\);\\n  const trackingTransparencyStatus = await requestTrackingTransparencyStatusIfNeeded\\([\\s\\S]*?\\);\\n  const umpConsentStatus = await resolveUmpConsentStatus\\(runtime, shouldCollectConsent\\);/,
      "const [trackingTransparencyStatus, umpConsentStatus] = await Promise.all([\\n    requestTrackingTransparencyStatusIfNeeded(runtime, platform, shouldCollectConsent, 'not_determined'),\\n    resolveUmpConsentStatus(runtime, shouldCollectConsent),\\n  ]);",
    );
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /must sequence ATT before UMP consent collection instead of Promise\.all/,
  );
});
