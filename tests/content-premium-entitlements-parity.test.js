const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('premium entitlement parity keeps Remove Ads decoupled from full premium', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const premiumSource = fs.readFileSync(path.join(repoRoot, 'lib/monetization/premium.ts'), 'utf8');

  assert.equal(summary.premiumEntitlementStatesValidated, 3);
  assert.equal(summary.premiumEntitlementParityValidated, true);
  assert.match(premiumSource, /export const REMOVE_ADS_ENTITLEMENTS/);
  assert.match(premiumSource, /adsDisabled: true/);
  assert.match(premiumSource, /unlimitedMockExams: false/);
  assert.match(
    premiumSource,
    /isStrictEntitlementFlag\(entitlements\.unlimitedMockExams\)[\s\S]*isStrictEntitlementFlag\(entitlements\.fullMistakeReview\)/,
  );
  assert.match(premiumSource, /return isStrictEntitlementFlag\(entitlements\.adsDisabled\);/);
});

test('premium entitlement parity rejects Remove Ads granting unlimited exams', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/premium.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "export const REMOVE_ADS_ENTITLEMENTS: PremiumEntitlements = {\\n  adsDisabled: true,\\n  unlimitedMockExams: false,\\n  fullMistakeReview: false,\\n};",
        "export const REMOVE_ADS_ENTITLEMENTS: PremiumEntitlements = {\\n  adsDisabled: true,\\n  unlimitedMockExams: true,\\n  fullMistakeReview: false,\\n};",
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
    /REMOVE_ADS_ENTITLEMENTS\.unlimitedMockExams is true, expected false/,
  );
});

test('premium entitlement parity rejects premium status coupled to adsDisabled', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/premium.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'return (\\n    isStrictEntitlementFlag(entitlements.unlimitedMockExams) &&\\n    isStrictEntitlementFlag(entitlements.fullMistakeReview)\\n  );',
        'return (\\n    isStrictEntitlementFlag(entitlements.adsDisabled) &&\\n    isStrictEntitlementFlag(entitlements.unlimitedMockExams) &&\\n    isStrictEntitlementFlag(entitlements.fullMistakeReview)\\n  );',
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
    /isPremiumUser must stay decoupled from adsDisabled/,
  );
});

test('premium entitlement parity rejects malformed truthy entitlement gates', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/premium.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'return isStrictEntitlementFlag(entitlements.adsDisabled);',
        'return Boolean(entitlements.adsDisabled);',
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
    /hasAdsDisabled must reject malformed truthy adsDisabled values|hasAdsDisabled must require adsDisabled === true/,
  );
});
