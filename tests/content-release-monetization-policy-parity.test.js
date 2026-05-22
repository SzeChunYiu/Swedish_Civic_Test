const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
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
  'proRuntimeScopeDefaultEnabled',
  'proRuntimeScopeEnvFlag',
  'proRuntimeScopeOverrideGate',
  'realAdsEnvFlag',
  'removeAdsPriceLabel',
  'removeAdsProductId',
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

function withProRuntimeScopeState({ env, e2e, e2eOverride } = {}, callback) {
  const previousEnv = process.env.EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE;
  const hadE2E = Object.prototype.hasOwnProperty.call(globalThis, '__SMT_E2E__');
  const hadE2EOverride = Object.prototype.hasOwnProperty.call(
    globalThis,
    '__SMT_ENABLE_PRO_RUNTIME_SCOPE__',
  );
  const previousE2E = globalThis.__SMT_E2E__;
  const previousE2EOverride = globalThis.__SMT_ENABLE_PRO_RUNTIME_SCOPE__;

  if (env === undefined) {
    delete process.env.EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE;
  } else {
    process.env.EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE = env;
  }

  if (e2e === undefined) {
    delete globalThis.__SMT_E2E__;
  } else {
    globalThis.__SMT_E2E__ = e2e;
  }

  if (e2eOverride === undefined) {
    delete globalThis.__SMT_ENABLE_PRO_RUNTIME_SCOPE__;
  } else {
    globalThis.__SMT_ENABLE_PRO_RUNTIME_SCOPE__ = e2eOverride;
  }

  try {
    return callback();
  } finally {
    if (previousEnv === undefined) {
      delete process.env.EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE;
    } else {
      process.env.EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE = previousEnv;
    }

    if (hadE2E) {
      globalThis.__SMT_E2E__ = previousE2E;
    } else {
      delete globalThis.__SMT_E2E__;
    }

    if (hadE2EOverride) {
      globalThis.__SMT_ENABLE_PRO_RUNTIME_SCOPE__ = previousE2EOverride;
    } else {
      delete globalThis.__SMT_ENABLE_PRO_RUNTIME_SCOPE__;
    }
  }
}

test('release monetization policy stays aligned with Remove Ads and ad consent runtime', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const appConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'app.json'), 'utf8')).expo;
  const { REMOVE_ADS_PRICE_LABEL, REMOVE_ADS_PRODUCT_ID } = loadTs('lib/monetization/purchases.ts');
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
  assert.equal(releaseMonetizationPolicy.proRuntimeScopeDefaultEnabled, false);
  assert.equal(
    releaseMonetizationPolicy.proRuntimeScopeEnvFlag,
    'EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE',
  );
  assert.equal(releaseMonetizationPolicy.proRuntimeScopeOverrideGate, 'release-scope-v11');
  assert.equal(releaseMonetizationPolicy.realAdsEnvFlag, 'EXPO_PUBLIC_REAL_ADS_ENABLED');
  assert.equal(REMOVE_ADS_PRODUCT_ID, `${appConfig.ios.bundleIdentifier}.removeads`);
  assert.equal(releaseMonetizationPolicy.removeAdsPriceLabel, REMOVE_ADS_PRICE_LABEL);
  assert.equal(releaseMonetizationPolicy.removeAdsProductId, REMOVE_ADS_PRODUCT_ID);
  assert.deepEqual(releaseMonetizationPolicy.storeDisclosureTopics, [
    'Google Mobile Ads',
    'Remove Ads in-app purchase',
    'App Tracking Transparency',
    'Google UMP consent',
  ]);
});

test('release monetization policy keeps Pro runtime E2E override test-only', () => {
  const releasePolicy = loadTs('lib/monetization/releasePolicy.ts', undefined, new Map());

  assert.equal(
    withProRuntimeScopeState({}, () => releasePolicy.isProRuntimeScopeEnabled()),
    false,
  );
  assert.equal(
    withProRuntimeScopeState({ e2eOverride: true }, () => releasePolicy.isProRuntimeScopeEnabled()),
    false,
  );
  assert.equal(
    withProRuntimeScopeState({ e2e: true, e2eOverride: true }, () =>
      releasePolicy.isProRuntimeScopeEnabled(),
    ),
    true,
  );
  assert.equal(
    withProRuntimeScopeState({ env: 'true' }, () => releasePolicy.isProRuntimeScopeEnabled()),
    true,
  );
  assert.equal(
    withProRuntimeScopeState({ env: 'false' }, () => releasePolicy.isProRuntimeScopeEnabled()),
    false,
  );
});

test('release monetization policy rejects Pro runtime-scope default drift', () => {
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
      .replace('proRuntimeScopeDefaultEnabled: false', 'proRuntimeScopeDefaultEnabled: true');
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
    /releaseMonetizationPolicy\.proRuntimeScopeDefaultEnabled/,
  );
});

test('release monetization policy rejects Pro runtime-scope gate drift', () => {
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
      .replace("proRuntimeScopeOverrideGate: 'release-scope-v11'", "proRuntimeScopeOverrideGate: 'release-scope-live'");
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
    /releaseMonetizationPolicy\.proRuntimeScopeOverrideGate/,
  );
});

test('release monetization policy rejects Pro runtime-scope env flag drift', () => {
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
      .replace("proRuntimeScopeEnvFlag: 'EXPO_PUBLIC_ENABLE_PRO_RUNTIME_SCOPE'", "proRuntimeScopeEnvFlag: 'EXPO_PUBLIC_ENABLE_PRO'");
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
    /releaseMonetizationPolicy\.proRuntimeScopeEnvFlag/,
  );
});

test('release monetization policy rejects Pro E2E override without the E2E gate', () => {
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
      .replace('runtime.__SMT_E2E__ && runtime.__SMT_ENABLE_PRO_RUNTIME_SCOPE__ === true', 'runtime.__SMT_ENABLE_PRO_RUNTIME_SCOPE__ === true');
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
    /Pro runtime E2E override must require __SMT_E2E__/,
  );
});

test('release monetization policy rejects purchase-inflight E2E harness scope drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/tests/e2e/purchase-inflight-guard.spec.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('__SMT_E2E__: true,', '__SMT_E2E__: false,');
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
    /purchase-inflight E2E spec must seed __SMT_E2E__ with the Pro runtime override/,
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
      .replace("removeAdsPriceLabel: '29 SEK'", "removeAdsPriceLabel: '19 SEK'");
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
