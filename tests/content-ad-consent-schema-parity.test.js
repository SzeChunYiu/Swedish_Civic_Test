const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

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
      const resolvedTsPath = tsPath;

      if (resolvedTsPath?.startsWith(repoRoot)) {
        return loadTs(path.relative(repoRoot, resolvedTsPath), undefined, moduleCache);
      }
    }

    return require(specifier);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return exportName ? mod.exports[exportName] : mod.exports;
}

test('ad consent TypeScript schema stays in parity with validator expectations', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const consentSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/consent.ts'), 'utf8');

  assert.equal(summary.adConsentTypeUnionsValidated, 6);
  assert.equal(summary.adConsentTypeInterfacesValidated, 3);
  assert.equal(summary.adConsentTypeSchemaParityValidated, true);
  assert.match(consentSource, /export type AdConsentPlatform =/);
  assert.match(consentSource, /export interface AdConsentState/);
  assert.match(consentSource, /pendingPrompts: AdConsentPrompt\[\];/);
  assert.match(consentSource, /blockReason\?: AdSdkInitializationBlockReason;/);
});

test('ad consent decision blocks real ads before prompts and downgrades denied ATT', () => {
  const { getAdConsentDecision, getAdSdkInitializationDecision } = loadTs(
    'lib/monetization/consent.ts',
  );
  const pendingState = {
    entitlements: { adsDisabled: false },
    googleMobileAdsEnabled: true,
    platform: 'ios',
    realAdsEnabled: true,
    region: 'eea',
    trackingTransparencyStatus: 'not_determined',
    umpConsentStatus: 'required',
  };
  const deniedAttState = {
    ...pendingState,
    trackingTransparencyStatus: 'denied',
    umpConsentStatus: 'obtained',
  };

  assert.deepEqual(getAdConsentDecision(pendingState), {
    adServingAllowed: false,
    canRequestNonPersonalizedAds: false,
    canRequestPersonalizedAds: false,
    pendingPrompts: ['app_tracking_transparency', 'ump_consent_form'],
  });
  assert.deepEqual(getAdSdkInitializationDecision(pendingState), {
    blockReason: 'pending_consent_prompts',
    canInitializeGoogleMobileAds: false,
    consentDecision: getAdConsentDecision(pendingState),
    requestNonPersonalizedAdsOnly: false,
  });
  assert.deepEqual(getAdConsentDecision(deniedAttState), {
    adServingAllowed: true,
    canRequestNonPersonalizedAds: true,
    canRequestPersonalizedAds: false,
    pendingPrompts: [],
  });
  assert.equal(getAdSdkInitializationDecision(deniedAttState).canInitializeGoogleMobileAds, true);
  assert.equal(getAdSdkInitializationDecision(deniedAttState).requestNonPersonalizedAdsOnly, true);
});

test('ad consent schema parity rejects SDK init optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/consent.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('blockReason?: AdSdkInitializationBlockReason;', 'blockReason: AdSdkInitializationBlockReason;');
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
    /lib\/monetization\/consent\.ts AdSdkInitializationDecision\.blockReason optional=false, expected true/,
  );
});
