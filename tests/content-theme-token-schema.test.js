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
  assert.equal(summary.themeContrastPairsValidated, 20);
  assert.equal(summary.themeContrastPairsAAValidated, true);
  assert.equal(summary.themeTokenSchemaValidated, true);
  assert.match(themeIndex, /export \{ colors \} from '\.\/colors';/);
  assert.match(
    themeIndex,
    /export \{ flagColors, SWEDISH_FLAG_BLUE, SWEDISH_FLAG_GOLD \} from '\.\/flag';/,
  );
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

test('theme token schema rejects low contrast semantic text pairs', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/colors.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("const warning = '#9a5c00'", "const warning = '#c77700'");
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
    /theme contrast warning on warningSoft ratio [0-9.]+:1 below 4\.5:1/,
  );
});

test('theme token schema rejects nonzero letter spacing', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/theme/typography.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('letterSpacing: 0,', 'letterSpacing: -0.4,');
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
    /theme typography\.displayHero\.letterSpacing must be 0 when defined/,
  );
});
