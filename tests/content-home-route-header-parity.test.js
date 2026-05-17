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

test('home route title and dashboard card headings stay accessible as headers', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/home.tsx'), 'utf8');
  const screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');

  assert.equal(summary.homeRouteHeadersValidated, 4);
  assert.equal(summary.homeRouteHeaderParityValidated, true);
  assert.match(source, /<ScreenShell[\s\S]*title="Prepare calmly, one civic concept at a time"/);
  assert.match(source, /<SectionHeader[\s\S]*title="Optimized study loop"/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.goalLabel\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.feedbackTitle\}>/);
  assert.doesNotMatch(source, /<Text style=\{styles\.(?:goalLabel|feedbackTitle)\}>/);
  assert.match(screenShell, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(screenShell, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
});

test('home route header parity rejects unheadered dashboard card titles', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/home.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.feedbackTitle}>',
        '<Text style={styles.feedbackTitle}>',
      );
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
    /home route card headings must expose accessibilityRole="header"/,
  );
});
