const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseFocusedValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-celebration-burst-accessibility'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused CelebrationBurst validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('quiz CelebrationBurst keeps success motion decorative and non-interactive', () => {
  const summary = parseFocusedValidationSummary();
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/quiz/CelebrationBurst.tsx'),
    'utf8',
  );

  assert.equal(summary.celebrationBurstAccessibilityRulesValidated, 13);
  assert.equal(summary.celebrationBurstAccessibilityParityValidated, true);
  assert.match(source, /active: boolean;/);
  assert.match(source, /if \(!active\) \{\s*progress\.setValue\(0\);\s*return;\s*\}/);
  assert.match(source, /duration:\s*motion\.duration\.slow \* 2,/);
  assert.match(source, /easing:\s*Easing\.out\(Easing\.cubic\),/);
  assert.match(source, /useNativeDriver:\s*true,/);
  assert.match(source, /if \(!active\) return null;/);
  assert.match(source, /aria-hidden=\{true\}/);
  assert.match(source, /accessibilityElementsHidden/);
  assert.match(
    source,
    /if \(reducedMotionEnabled\) \{\s*return \(\s*<View(?=[^>]*aria-hidden=\{true\})(?=[^>]*accessibilityElementsHidden)(?=[^>]*importantForAccessibility="no-hide-descendants")(?=[^>]*pointerEvents="none")[^>]*>/,
  );
  assert.match(
    source,
    /<Animated\.View(?=[^>]*aria-hidden=\{true\})(?=[^>]*accessibilityElementsHidden)(?=[^>]*importantForAccessibility="no-hide-descendants")(?=[^>]*pointerEvents="none")[^>]*>/,
  );
  assert.match(source, /importantForAccessibility="no-hide-descendants"/);
  assert.match(source, /pointerEvents="none"/);
  assert.match(source, /<View style=\{styles\.pill\}>/);
});

test('CelebrationBurst is reachable from practice and routed quiz feedback', () => {
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  const quizSource = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');

  for (const source of [practiceSource, quizSource]) {
    assert.match(source, /import \{ CelebrationBurst \}/);
    assert.match(source, /active=\{selectedIsCorrect\}/);
    assert.match(source, /languageOverride=\{language\}/);
    assert.match(source, /streak=\{celebrationStreak\}/);
    assert.match(source, /questionProgress\[question\.id\]\?\.correctStreak \?\? 1/);
  }
});

test('CelebrationBurst accessibility parity rejects active animation restart drift', () => {
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
      .replace('progress.setValue(0);\\n    Animated.timing(progress, {', 'Animated.timing(progress, {');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-celebration-burst-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /CelebrationBurst missing active animation restarts from zero for accessibility parity/,
  );
});

test('CelebrationBurst accessibility parity rejects native hidden tree exposure drift', () => {
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
      .replaceAll('accessibilityElementsHidden', '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-celebration-burst-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /CelebrationBurst missing decorative animation hidden from accessibility tree for accessibility parity/,
  );
});

test('CelebrationBurst accessibility parity rejects reduced-motion web aria-hidden drift', () => {
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
      .replace('aria-hidden={true}', '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-celebration-burst-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /CelebrationBurst missing reduced-motion branch hidden from (?:web )?accessibility tree for accessibility parity/,
  );
});

test('CelebrationBurst accessibility parity rejects animated web aria-hidden drift', () => {
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
      .replace('aria-hidden={true}', '')
      .replace('aria-hidden={true}', '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-celebration-burst-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /CelebrationBurst missing animated branch hidden from (?:web )?accessibility tree for accessibility parity/,
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
      .replaceAll('importantForAccessibility="no-hide-descendants"', 'importantForAccessibility="yes"');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-celebration-burst-accessibility');
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
