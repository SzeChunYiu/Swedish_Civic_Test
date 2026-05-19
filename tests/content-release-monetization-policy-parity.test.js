const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const expectedPolicyFields = [
  'adSupportedByDefault',
  'adMobAppRecordRequired',
  'appAdsTxtReviewRequired',
  'consentPromptsRequired',
  'noAdPlacements',
  'privacyReviewRequiresBinary',
  'realAdsEnvFlag',
  'removeAdsPriceLabel',
  'removeAdsProductId',
  'removeAdsStoreProductIds',
  'storeDisclosureTopics',
];

function loadTs(relativePath, exportName, moduleCache = new Map()) {
  const filePath = path.join(repoRoot, relativePath);
  if (moduleCache.has(filePath)) {
    const cached = moduleCache.get(filePath);
    return exportName ? cached[exportName] : cached;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(specifier) {
    if (specifier.startsWith('.')) {
      const resolvedPath = path.resolve(path.dirname(filePath), specifier);
      const tsPath = fs.existsSync(`${resolvedPath}.ts`) ? `${resolvedPath}.ts` : undefined;
      const tsxPath = fs.existsSync(`${resolvedPath}.tsx`) ? `${resolvedPath}.tsx` : undefined;
      const indexTsPath = fs.existsSync(path.join(resolvedPath, 'index.ts'))
        ? path.join(resolvedPath, 'index.ts')
        : undefined;
      const resolvedTsPath = tsPath ?? tsxPath ?? indexTsPath;

      if (resolvedTsPath?.startsWith(repoRoot)) {
        return loadTs(path.relative(repoRoot, resolvedTsPath), undefined, moduleCache);
      }
    }

    return require(specifier);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return exportName ? mod.exports[exportName] : mod.exports;
}

function runReleasePreflightSourceFixture(mutationBody = '') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'content-release-source-fixture-'));
  const evidencePath = path.join(tmpDir, 'release-gates.json');

  fs.writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        gates: {
          'release-scope-v11': {
            status: 'READY',
            evidence:
              'Operator approved v1.1 foundations before v1.0 Remove Ads closure for this source fixture.',
          },
        },
      },
      null,
      2,
    ),
  );

  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  let source = originalReadFileSync.call(this, filePath, ...args);
  if (typeof source !== 'string') return source;
${mutationBody}
  return source;
};
process.argv = [process.execPath, 'scripts/release-preflight.js', '--json'];
require('./scripts/release-preflight.js');
`,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        RELEASE_PREFLIGHT_EVIDENCE_PATH: evidencePath,
        RELEASE_PREFLIGHT_SKIP_EXTERNAL_CHECKS: '1',
        RELEASE_PREFLIGHT_SKIP_PUBLIC_URL_CHECK: '1',
      },
    },
  );

  assert.ok(result.stdout.trim(), result.stderr);
  return JSON.parse(result.stdout);
}

test('release monetization policy stays aligned with Remove Ads and ad consent runtime', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const {
    REMOVE_ADS_ANDROID_PRODUCT_ID,
    REMOVE_ADS_IOS_PRODUCT_ID,
    REMOVE_ADS_PRICE_LABEL,
    REMOVE_ADS_PRODUCT_ID,
  } = loadTs('lib/monetization/purchases.ts');
  const { isReleaseMonetizationPolicyReady, releaseMonetizationPolicy } = loadTs(
    'lib/monetization/releasePolicy.ts',
  );

  assert.equal(summary.releaseMonetizationPolicyFieldsValidated, expectedPolicyFields.length);
  assert.equal(summary.releaseMonetizationPolicyParityValidated, true);
  assert.equal(isReleaseMonetizationPolicyReady(), true);
  assert.deepEqual(Object.keys(releaseMonetizationPolicy), expectedPolicyFields);
  assert.deepEqual(releaseMonetizationPolicy.consentPromptsRequired, [
    'app_tracking_transparency',
    'ump_consent_form',
  ]);
  assert.deepEqual(releaseMonetizationPolicy.noAdPlacements, ['exam_screen']);
  assert.equal(releaseMonetizationPolicy.realAdsEnvFlag, 'EXPO_PUBLIC_REAL_ADS_ENABLED');
  assert.equal(releaseMonetizationPolicy.removeAdsPriceLabel, REMOVE_ADS_PRICE_LABEL);
  assert.equal(releaseMonetizationPolicy.removeAdsProductId, REMOVE_ADS_PRODUCT_ID);
  assert.deepEqual(releaseMonetizationPolicy.removeAdsStoreProductIds, {
    android: REMOVE_ADS_ANDROID_PRODUCT_ID,
    ios: REMOVE_ADS_IOS_PRODUCT_ID,
  });
  assert.deepEqual(releaseMonetizationPolicy.storeDisclosureTopics, [
    'Google Mobile Ads',
    'Remove Ads in-app purchase',
    'App Tracking Transparency',
    'Google UMP consent',
  ]);
});

test('release preflight Remove Ads source predicate covers current, no-restore, and no-paywall fixtures', () => {
  const preflightSource = fs.readFileSync(
    path.join(repoRoot, 'scripts/release-preflight.js'),
    'utf8',
  );
  assert.match(preflightSource, /removeAdsSourceWiringFindings/);
  assert.doesNotMatch(preflightSource, /grep -rqi "remove\.\?ads"/);

  const currentReport = runReleasePreflightSourceFixture();
  const currentScopeGate = currentReport.gates.find((gate) => gate.id === 'release-scope-v11');
  assert.doesNotMatch(currentScopeGate.evidence, /GOAL step 3/i);

  const noRestoreReport = runReleasePreflightSourceFixture(`
  if (normalizedPath.endsWith('lib/monetization/purchases.ts')) {
    source = source
      .replace('export async function restoreRemoveAdsPurchase', 'export async function restoreRemoveAdsPurchaseDisabled')
      .replace('restorePurchases([REMOVE_ADS_PRODUCT_ID])', 'restorePurchases([])');
  }
`);
  const noRestoreScopeGate = noRestoreReport.gates.find((gate) => gate.id === 'release-scope-v11');
  assert.match(
    noRestoreScopeGate.evidence,
    /restoreRemoveAdsPurchase must restore REMOVE_ADS_PRODUCT_ID/,
  );

  const noPaywallReport = runReleasePreflightSourceFixture(`
  if (
    normalizedPath.endsWith('app/(tabs)/home.tsx') ||
    normalizedPath.endsWith('app/(tabs)/profile.tsx')
  ) {
    source = source.split('<PremiumBanner').join('<RemovedPremiumBanner');
  }
`);
  const noPaywallScopeGate = noPaywallReport.gates.find((gate) => gate.id === 'release-scope-v11');
  assert.match(
    noPaywallScopeGate.evidence,
    /app screen must render the Remove Ads PremiumBanner paywall/,
  );
});

test('release monetization policy rejects Remove Ads price drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/releasePolicy.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("removeAdsPriceLabel: REMOVE_ADS_PRICE_LABEL", "removeAdsPriceLabel: '19 SEK'");
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
    /releaseMonetizationPolicy\.removeAdsPriceLabel/,
  );
});

test('release monetization policy rejects no-ad placement drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/releasePolicy.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("noAdPlacements: ['exam_screen']", "noAdPlacements: ['home_banner']");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /releaseMonetizationPolicy\.noAdPlacements/);
});
