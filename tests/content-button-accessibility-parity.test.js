const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const canonicalButtonPath = path.join(repoRoot, 'components/Button.tsx');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function walkProductSources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkProductSources(fullPath);
    if (/\.(ts|tsx)$/.test(entry.name)) return [fullPath];
    return [];
  });
}

test('shared Button mirrors native accessibility state to web aria attributes', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(canonicalButtonPath, 'utf8');

  assert.equal(summary.buttonAccessibilityRulesValidated, 23);
  assert.equal(summary.buttonAccessibilityParityValidated, true);
  assert.equal(
    fs.existsSync(path.join(repoRoot, 'components/ui/Button.tsx')),
    false,
    'components/ui/Button.tsx should stay retired; product code should import components/Button.tsx',
  );
  assert.match(source, /accessibilityRole = 'button'/);
  assert.match(source, /const mergedAccessibilityState =/);
  assert.match(source, /disabled:\s*isPressDisabled \|\| accessibilityState\?\.disabled,/);
  assert.match(source, /busy:\s*loading \|\| accessibilityState\?\.busy,/);
  assert.match(source, /disabled=\{isPressDisabled\}/);
  assert.match(source, /aria-busy=\{mergedAccessibilityState\.busy === true\}/);
  assert.match(source, /aria-checked=\{mergedAccessibilityState\.checked\}/);
  assert.match(source, /aria-disabled=\{mergedAccessibilityState\.disabled === true\}/);
  assert.match(source, /aria-expanded=\{mergedAccessibilityState\.expanded\}/);
  assert.match(source, /aria-selected=\{mergedAccessibilityState\.selected\}/);
  assert.match(source, /accessibilityState=\{mergedAccessibilityState\}/);
  assert.match(source, /borderWidth:\s*space\.hairline/);
  assert.match(source, /minHeight:\s*space\[6\]/);
  assert.match(source, /const reduceMotion = useReducedMotion\(\);/);
  assert.match(
    source,
    /pressed && !isPressDisabled && !reduceMotion \? styles\.pressedMotion : null/,
  );
  assert.match(source, /transform:\s*\[\{ scale: motion\.pressedScale \}\]/);
  assert.match(source, /isExplicitlyDisabled \? styles\.disabled : null,[\s\S]*style,/);

  const splitImportOffenders = ['app', 'components'].flatMap((sourceDir) =>
    walkProductSources(path.join(repoRoot, sourceDir)).filter((filePath) => {
      const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
      const fileSource = fs.readFileSync(filePath, 'utf8');
      return /from\s+['"][^'"]*(?:components\/ui\/Button|\/ui\/Button)['"]/.test(fileSource);
    }),
  );
  assert.deepEqual(splitImportOffenders, []);
});

test('Button accessibility parity rejects web aria state drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/Button.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('aria-disabled={mergedAccessibilityState.disabled === true}', 'aria-disabled={disabled}');
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
    /Button missing disabled state mirrored to web aria for accessibility parity/,
  );
});

test('Button accessibility parity rejects dropped caller style overrides', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/Button.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('        style,\\n', '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Button missing caller style override/);
});
