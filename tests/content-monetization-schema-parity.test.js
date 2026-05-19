const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

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
  assert.match(monetizationTypes, /export type AdPlacement =/);
  assert.match(monetizationTypes, /'rewarded_extra_exam'/);
  assert.match(monetizationTypes, /export interface PremiumEntitlements/);
  assert.match(monetizationTypes, /adsDisabled: boolean;/);
  assert.match(monetizationTypes, /export interface MonetizationState/);
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
