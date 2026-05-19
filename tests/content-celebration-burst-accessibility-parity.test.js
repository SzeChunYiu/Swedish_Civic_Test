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

test('quiz CelebrationBurst keeps success motion decorative and non-interactive', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/quiz/CelebrationBurst.tsx'),
    'utf8',
  );

  assert.equal(summary.celebrationBurstAccessibilityRulesValidated, 11);
  assert.equal(summary.celebrationBurstAccessibilityParityValidated, true);
  assert.match(source, /active: boolean;/);
  assert.match(source, /if \(!active\) \{\s*progress\.setValue\(0\);\s*return;\s*\}/);
  assert.match(source, /duration:\s*motion\.duration\.slow \* 2,/);
  assert.match(source, /easing:\s*Easing\.out\(Easing\.cubic\),/);
  assert.match(source, /useNativeDriver:\s*true,/);
  assert.match(source, /if \(!active\) return null;/);
  assert.match(source, /accessibilityElementsHidden/);
  assert.match(source, /importantForAccessibility="no-hide-descendants"/);
  assert.match(source, /pointerEvents="none"/);
  assert.match(source, /<View style=\{styles\.pill\}>/);
});

test('CelebrationBurst accessibility parity rejects descendant exposure drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/CelebrationBurst.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('importantForAccessibility="no-hide-descendants"', 'importantForAccessibility="yes"');
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
    /CelebrationBurst missing descendant accessibility hidden for accessibility parity/,
  );
});
