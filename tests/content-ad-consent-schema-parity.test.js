const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

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
