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

test('Remove Ads entitlement hook fails closed until purchase state resolves', () => {
  const summary = parseValidationSummary();
  const hookSource = fs.readFileSync(
    path.join(repoRoot, 'lib/monetization/useRemoveAdsEntitlements.ts'),
    'utf8',
  );

  assert.equal(summary.removeAdsEntitlementHookCasesValidated, 5);
  assert.equal(summary.removeAdsEntitlementHookParityValidated, true);
  assert.match(hookSource, /AD_BLOCKED_PENDING_ENTITLEMENTS/);
  assert.match(hookSource, /adsDisabled: true/);
  assert.match(hookSource, /getPurchaseEntitlements\(purchaseRuntime\)/);
  assert.match(hookSource, /publishRemoveAdsEntitlements\(storedEntitlements\)/);
  assert.match(hookSource, /entitlements: explicitEntitlements/);
  assert.match(hookSource, /entitlements: AD_BLOCKED_PENDING_ENTITLEMENTS/);
});

test('Remove Ads entitlement hook parity rejects pending ad enablement', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useRemoveAdsEntitlements.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('adsDisabled: true,', 'adsDisabled: false,');
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
    /Remove Ads entitlement hook must fail closed while purchase state loads/,
  );
});

test('Remove Ads entitlement hook parity rejects explicit entitlement bypass drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/useRemoveAdsEntitlements.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('entitlements: explicitEntitlements,', 'entitlements: AD_BLOCKED_PENDING_ENTITLEMENTS,');
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
    /explicit ad entitlements must bypass async purchase loading as ready/,
  );
});
