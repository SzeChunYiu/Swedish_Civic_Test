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

test('shared Button mirrors native accessibility state to web aria attributes', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/ui/Button.tsx'), 'utf8');

  assert.equal(summary.buttonAccessibilityRulesValidated, 20);
  assert.equal(summary.buttonAccessibilityParityValidated, true);
  assert.match(
    source,
    /export type ButtonVariant = 'primary' \| 'secondary' \| 'option' \| 'success' \| 'danger';/,
  );
  assert.match(source, /export interface ButtonProps extends PropsWithChildren/);
  assert.match(source, /Defaults: `variant="primary"`, `accessibilityRole="button"`/);
  assert.match(source, /accessibilityRole = 'button'/);
  assert.match(source, /const mergedAccessibilityState =/);
  assert.match(source, /\.\.\.\(disabled == null \? \{\} : \{ disabled \}\),/);
  assert.match(source, /aria-busy=\{mergedAccessibilityState\.busy === true\}/);
  assert.match(source, /aria-checked=\{mergedAccessibilityState\.checked\}/);
  assert.match(source, /aria-disabled=\{mergedAccessibilityState\.disabled === true\}/);
  assert.match(source, /aria-expanded=\{mergedAccessibilityState\.expanded\}/);
  assert.match(source, /aria-selected=\{mergedAccessibilityState\.selected\}/);
  assert.match(source, /accessibilityState=\{mergedAccessibilityState\}/);
  assert.match(source, /borderWidth: space\.hairline/);
  assert.match(source, /minHeight: space\[6\]/);
  assert.match(source, /transform: \[\{ scale: motion\.pressedScale \}\]/);
});

test('shared Buttons use tokenized disabled styles instead of wrapper opacity', () => {
  const buttonSources = [
    [
      'components/ui/Button.tsx',
      fs.readFileSync(path.join(repoRoot, 'components/ui/Button.tsx'), 'utf8'),
    ],
    [
      'components/Button.tsx',
      fs.readFileSync(path.join(repoRoot, 'components/Button.tsx'), 'utf8'),
    ],
  ];

  for (const [filePath, source] of buttonSources) {
    assert.doesNotMatch(
      source,
      /disabled:\s*\{\s*opacity\s*:/,
      `${filePath} should not use disabled wrapper opacity`,
    );
    assert.match(
      source,
      /disabled:\s*\{[\s\S]*backgroundColor:\s*colors\.surfaceWarm[\s\S]*borderColor:\s*colors\.border[\s\S]*\}/,
      `${filePath} should use tokenized disabled background and border`,
    );
    assert.match(
      source,
      /disabledLabel:\s*\{[\s\S]*color:\s*colors\.textMuted[\s\S]*\}/,
      `${filePath} should use readable muted disabled label text`,
    );
  }
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
  if (normalizedPath.endsWith('/components/ui/Button.tsx')) {
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

test('Button accessibility parity rejects hardcoded touch target drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/Button.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('minHeight: space[6]', 'minHeight: 44');
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
    /Button missing token minimum touch target for accessibility parity/,
  );
});
