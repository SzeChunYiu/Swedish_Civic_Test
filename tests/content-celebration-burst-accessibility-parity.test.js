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

  assert.equal(summary.celebrationBurstAccessibilityRulesValidated, 14);
  assert.equal(summary.celebrationBurstAccessibilityParityValidated, true);
  assert.equal(summary.celebrationBurstReachabilityRoutesValidated, 7);
  assert.equal(summary.celebrationBurstReachabilityValidated, true);
  assert.match(source, /active: boolean;/);
  assert.match(source, /if \(!active\) \{\s*progress\.setValue\(0\);\s*return;\s*\}/);
  assert.match(source, /useReducedMotion/);
  assert.match(source, /if \(reducedMotionEnabled\) \{/);
  assert.match(source, /duration:\s*motion\.duration\.slow \* 2,/);
  assert.match(source, /easing:\s*Easing\.out\(Easing\.cubic\),/);
  assert.match(source, /useNativeDriver:\s*true,/);
  assert.match(source, /if \(!active\) return null;/);
  assert.match(source, /aria-hidden/);
  assert.match(source, /accessibilityElementsHidden/);
  assert.match(source, /importantForAccessibility="no-hide-descendants"/);
  assert.match(source, /pointerEvents="none"/);
  assert.match(source, /<View style=\{styles\.pill\}>/);
});

test('CelebrationBurst accessibility parity rejects missing reduced-motion hook usage', () => {
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
      .replace('const reducedMotionEnabled = useReducedMotion();', 'const reducedMotionEnabled = false;');
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
    /CelebrationBurst missing reduced motion hook usage for accessibility parity/,
  );
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
      .split('importantForAccessibility="no-hide-descendants"')
      .join('importantForAccessibility="yes"');
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

test('CelebrationBurst reachability parity rejects missing practice wiring', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/practice.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('          <CelebrationBurst\\n            active={selectedIsCorrect}\\n            languageOverride={language}\\n            streak={celebrationStreak}\\n          />\\n', '');
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
    /Practice route renders burst only for correct feedback with localized copy/,
  );
});
