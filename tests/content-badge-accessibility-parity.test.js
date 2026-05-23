const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const BADGE_ACCESSIBILITY_FOCUS_FLAG = '--focus-badge-accessibility';

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', BADGE_ACCESSIBILITY_FOCUS_FLAG],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('shared Badge keeps visual uppercase text and readable accessibility labels in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/ui/Badge.tsx'), 'utf8');

  assert.equal(summary.badgeAccessibilityRulesValidated, 11);
  assert.equal(summary.badgeAccessibilityParityValidated, true);
  assert.match(source, /const badgeAccessibilityLabel =/);
  assert.match(source, /accessibilityLabel \?\? getPrimitiveBadgeAccessibilityLabel\(children\)/);
  assert.match(source, /function getPrimitiveBadgeAccessibilityLabel/);
  assert.match(source, /Array\.isArray\(children\)/);
  assert.match(source, /aria-label=\{badgeAccessibilityLabel\}/);
  assert.match(source, /accessibilityLabel=\{badgeAccessibilityLabel\}/);
  assert.match(source, /style=\{\[styles\.badge, styles\[tone\], style\]\}/);
  assert.match(source, /textTransform:\s*'uppercase'/);
});

test('Badge accessibility parity rejects web label drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/Badge.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('aria-label={badgeAccessibilityLabel}', 'aria-label={children}');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('${BADGE_ACCESSIBILITY_FOCUS_FLAG}');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Badge missing web aria label/);
});

test('Badge accessibility parity rejects dropped caller style overrides', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/Badge.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('style={[styles.badge, styles[tone], style]}', 'style={[styles.badge, styles[tone]]}');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('${BADGE_ACCESSIBILITY_FOCUS_FLAG}');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Badge missing caller style override/);
});

test('Badge accessibility parity rejects composed call sites without explicit labels', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/profile.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('<Badge tone="blue">\\n            {copy.dailyGoalBadgeLabel}: {dailyGoalAnswers} {copy.answersPerDay}\\n          </Badge>', '<Badge tone="blue"><Text>{copy.dailyGoalBadgeLabel}</Text></Badge>');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('${BADGE_ACCESSIBILITY_FOCUS_FLAG}');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Badge composed child call sites require explicit accessibilityLabel: app\/\(tabs\)\/profile\.tsx:/,
  );
});
