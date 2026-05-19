const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('theme token schema validates the exported design-token catalog', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const themeIndex = fs.readFileSync(path.join(repoRoot, 'lib/theme/index.ts'), 'utf8');

  assert.equal(summary.themeColorTokensValidated, 37);
  assert.equal(summary.themeSpaceTokensValidated, 24);
  assert.equal(summary.themeRadiusTokensValidated, 7);
  assert.equal(summary.themeTypographyTokensValidated, 22);
  assert.equal(summary.themeShadowTokensValidated, 2);
  assert.equal(summary.themeMotionTokensValidated, 7);
  assert.equal(summary.themeTokenSchemaValidated, true);
  assert.match(themeIndex, /export \{ colors \} from '\.\/colors';/);
  assert.match(themeIndex, /export \{ space \} from '\.\/spacing';/);
  assert.match(themeIndex, /export \{ typography \} from '\.\/typography';/);
});

test('theme token schema rejects spacing token drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/spacing.ts')) {
    return originalReadFileSync.call(this, filePath, ...args).replace('1: 8,', '1: -8,');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /theme space\.1 expected 8, found -8/);
});
