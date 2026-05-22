const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('mobile ads consent TypeScript schema stays in parity with validator expectations', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-mobile-ads-consent'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const mobileConsentSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/mobileAdsConsent.ts'),
    'utf8',
  );

  assert.equal(summary.mobileAdsConsentTypeInterfacesValidated, 5);
  assert.equal(summary.mobileAdsConsentTypeSchemaParityValidated, true);
  assert.equal(summary.mobileAdsConsentRuntimeCasesValidated, 7);
  assert.equal(summary.mobileAdsConsentRuntimeParityValidated, true);
  assert.match(mobileConsentSource, /export interface MobileAdsConsentRuntime/);
  assert.match(mobileConsentSource, /platform: AdConsentPlatform \| string;/);
  assert.match(mobileConsentSource, /gatherUmpConsent\?: \(\) => Promise<UmpConsentResult>;/);
  assert.match(mobileConsentSource, /normalizeAdConsentRegion/);
  assert.match(mobileConsentSource, /regionRequiresUmpConsent/);
  assert.match(mobileConsentSource, /decision: AdSdkInitializationDecision;/);
});

test('mobile ads consent schema parity rejects invalid runtime region drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv = [process.argv[0], 'scripts/validate-content.js', '--focus-mobile-ads-consent'];
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/monetization/mobileAdsConsent.ts')) {
    return String(contents).replace(
      'region: normalizedRegion,',
      'region,',
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
    /Mobile Ads consent runtime must normalize invalid regions before building consent state/,
  );
});

test('mobile ads consent schema parity rejects raw UMP region checks', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv = [process.argv[0], 'scripts/validate-content.js', '--focus-mobile-ads-consent'];
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/monetization/mobileAdsConsent.ts')) {
    return String(contents).replace(
      "if (!shouldCollectConsent || !regionRequiresUmpConsent(region)) return 'not_required';",
      "if (!shouldCollectConsent || (region !== 'eea' && region !== 'uk' && region !== 'unknown')) return 'not_required';",
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
    /Mobile Ads consent runtime must skip UMP gathering for non-UMP regions/,
  );
});

test('mobile ads consent schema parity rejects runtime platform optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv = [process.argv[0], 'scripts/validate-content.js', '--focus-mobile-ads-consent'];
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
process.argv = [process.argv[0], 'scripts/validate-content.js', '--focus-mobile-ads-consent'];
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/monetization/mobileAdsConsent.ts')) {
    return String(contents).replace(
      /const currentTrackingTransparencyStatus = await getCurrentTrackingTransparencyStatus\\([\\s\\S]*?\\);\\n  const trackingTransparencyStatus = await requestTrackingTransparencyStatusIfNeeded\\([\\s\\S]*?\\);\\n  const umpConsentStatus = await resolveUmpConsentStatus\\([\\s\\S]*?\\);/,
      "const currentTrackingTransparencyStatus = 'not_determined';\\n  const [trackingTransparencyStatus, umpConsentStatus] = await Promise.all([\\n    requestTrackingTransparencyStatusIfNeeded(runtime, platform, shouldCollectConsent, currentTrackingTransparencyStatus),\\n    resolveUmpConsentStatus(runtime, shouldCollectConsent, normalizedRegion),\\n  ]);",
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
    /must not collect ATT and UMP through Promise\.all/,
  );
});

test('mobile ads consent schema parity rejects non-UMP region gathering drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
process.argv = [process.argv[0], 'scripts/validate-content.js', '--focus-mobile-ads-consent'];
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/monetization/mobileAdsConsent.ts')) {
    return String(contents).replace(
      "if (!shouldCollectConsent || !regionRequiresUmpConsent(region)) return 'not_required';",
      "if (!shouldCollectConsent) return 'not_required';",
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
    /Mobile Ads consent runtime must skip UMP gathering for non-UMP regions/,
  );
});
