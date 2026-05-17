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

test('shared ProgressBar keeps visual progress and accessibility values in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/ui/ProgressBar.tsx'), 'utf8');

  assert.equal(summary.progressBarAccessibilityRulesValidated, 12);
  assert.equal(summary.progressBarAccessibilityParityValidated, true);
  assert.match(source, /const clampedProgress = Math\.max\(0, Math\.min\(1, progress\)\);/);
  assert.match(source, /const progressPercent = Math\.round\(clampedProgress \* 100\);/);
  assert.match(source, /aria-valuenow=\{progressPercent\}/);
  assert.match(source, /accessibilityRole="progressbar"/);
  assert.match(source, /accessibilityValue=\{\{ min: 0, max: 100, now: progressPercent \}\}/);
  assert.match(source, /new Animated\.Value\(clampedProgress\)/);
});

test('ProgressBar accessibility parity rejects unclamped native value drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/ProgressBar.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('accessibilityValue={{ min: 0, max: 100, now: progressPercent }}', 'accessibilityValue={{ min: 0, max: 100, now: progress }}');
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
    /ProgressBar missing native clamped accessibility value for accessibility parity/,
  );
});
