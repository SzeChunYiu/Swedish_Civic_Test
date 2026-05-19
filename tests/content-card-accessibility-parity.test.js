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

test('shared Card mirrors labelled grouped surfaces to native and web accessibility', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/ui/Card.tsx'), 'utf8');

  assert.equal(summary.cardAccessibilityRulesValidated, 16);
  assert.equal(summary.cardAccessibilityParityValidated, true);
  assert.match(source, /const groupedForAccessibility =/);
  assert.match(source, /accessible \?\? Boolean\(accessibilityLabel \|\| accessibilityRole\)/);
  assert.match(source, /const resolvedAccessibilityRole =/);
  assert.match(
    source,
    /accessibilityRole \?\? \(groupedForAccessibility \? 'summary' : undefined\)/,
  );
  assert.match(source, /aria-describedby=\{cardAccessibilityHintId\}/);
  assert.match(source, /aria-label=\{accessibilityLabel\}/);
  assert.match(source, /accessible=\{groupedForAccessibility\}/);
  assert.match(source, /accessibilityHint=\{accessibilityHint\}/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityRole=\{resolvedAccessibilityRole\}/);
  assert.match(source, /nativeID=\{cardAccessibilityHintId\}/);
  assert.match(source, /accessibilityHintText/);
});

test('Card accessibility parity rejects web hint-description drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/Card.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('aria-describedby={cardAccessibilityHintId}', 'aria-describedby={accessibilityHint}');
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
    /Card missing hint mirrored to web aria-describedby for accessibility parity/,
  );
});

test('Card accessibility parity rejects dropped grouped summary role', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/Card.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("accessibilityRole ?? (groupedForAccessibility ? 'summary' : undefined)", 'accessibilityRole ?? undefined');
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
    /Card missing grouped default summary role for accessibility parity/,
  );
});
