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

test('learn route title and chapter-list heading stay on shared header components', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/learn.tsx'), 'utf8');
  const screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');

  assert.equal(summary.learnRouteHeadersValidated, 2);
  assert.equal(summary.learnRouteHeaderParityValidated, true);
  assert.match(source, /<ScreenShell[\s\S]*title=\{routeCopy\.title\}/);
  assert.match(source, /<SectionHeader[\s\S]*title=\{routeCopy\.sectionTitle\}/);
  assert.match(source, /const routeCopy = learnRouteCopy\[language\]/);
  assert.doesNotMatch(source, /<Text style=\{styles\.(?:title|sectionTitle)\}>/);
  assert.match(screenShell, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(screenShell, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
});

test('learn route header parity rejects missing section header title', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/learn.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('title={routeCopy.sectionTitle}', 'subtitle={routeCopy.sectionTitle}');
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
    /learn route missing chapter-list section title on the shared header path/,
  );
});
