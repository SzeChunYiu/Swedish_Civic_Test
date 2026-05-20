const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

const repoRoot = require('node:path').resolve(__dirname, '..');

function validateSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function runValidateWithReadPatch(patchBody) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
${patchBody}
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

test('validate:content reports public support/privacy brand parity', () => {
  const summary = validateSummary();

  assert.equal(summary.publicSupportPrivacyBrandParityValidated, true);
  assert.ok(summary.publicSupportPrivacyBrandFilesValidated >= 4);
});

test('public support/privacy brand parity rejects stale public page title copy', () => {
  const result = runValidateWithReadPatch(`
  if (normalizedPath.endsWith('/publishing/public-site/support/index.html')) {
    return originalReadFileSync.call(this, filePath, ...args).replaceAll(
      'Almost Swedish support',
      'Sweden Citizenship Test Prep support',
    );
  }
`);

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /uses stale public brand copy/);
});

test('public support/privacy brand parity rejects artifacts missing the canonical app name', () => {
  const result = runValidateWithReadPatch(`
  if (normalizedPath.endsWith('/publishing/public-site/privacy/index.html')) {
    return originalReadFileSync.call(this, filePath, ...args).replaceAll(
      'Almost Swedish',
      'Study App',
    );
  }
`);

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /publishing\/public-site\/privacy\/index\.html missing canonical app brand "Almost Swedish"/,
  );
});
