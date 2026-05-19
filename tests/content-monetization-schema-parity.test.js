const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const effectiveExpiryFixtureLabels = [
  'invalid time-bounded dates are ignored',
  'mixed ISO offsets are ordered by timestamp',
  'equal expiry timestamps keep the first active source string',
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('monetization TypeScript schema stays in parity with validator expectations', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const monetizationTypes = fs.readFileSync(path.join(repoRoot, 'types/monetization.ts'), 'utf8');

  assert.equal(summary.monetizationTypeUnionsValidated, 1);
  assert.equal(summary.monetizationTypeInterfacesValidated, 3);
  assert.equal(summary.monetizationTypeSchemaParityValidated, true);
  assert.equal(summary.effectiveEntitlementExpiryOrderingCasesValidated, 3);
  assert.equal(summary.effectiveEntitlementExpiryOrderingParityValidated, true);
  assert.match(monetizationTypes, /export type AdPlacement =/);
  assert.match(monetizationTypes, /'rewarded_extra_exam'/);
  assert.match(monetizationTypes, /export interface PremiumEntitlements/);
  assert.match(monetizationTypes, /adsDisabled: boolean;/);
  assert.match(monetizationTypes, /export interface MonetizationState/);
});

test('monetization schema parity rejects lexicographic effective-entitlement expiry comparison', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/monetization/effectiveEntitlements.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('return bTime < aTime ? b : a;', 'return a < b ? a : b;');
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
    /effective entitlement expiry ordering must not use lexicographic ISO comparison/,
  );
});

test('monetization schema parity rejects missing effective-entitlement expiry fixtures', () => {
  for (const fixtureLabel of effectiveExpiryFixtureLabels) {
    const result = spawnSync(
      process.execPath,
      [
        '-e',
        `
const fs = require('node:fs');
const missingLabel = process.env.MUTATED_EXPIRY_FIXTURE_LABEL;
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/tests/v1-1-effective-entitlements.test.js')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(missingLabel, 'removed effective entitlement expiry fixture');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, MUTATED_EXPIRY_FIXTURE_LABEL: fixtureLabel },
      },
    );

    assert.notEqual(result.status, 0, `${fixtureLabel} mutation should fail validation`);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      new RegExp(`effective entitlements tests must cover ${escapeRegExp(fixtureLabel)}`),
    );
  }
});

test('monetization schema parity rejects entitlement optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/monetization.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('adsDisabled: boolean;', 'adsDisabled?: boolean;');
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
    /types\/monetization\.ts PremiumEntitlements\.adsDisabled optional=true, expected false/,
  );
});
