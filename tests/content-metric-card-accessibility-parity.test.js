const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('shared MetricCard keeps visible metric text and accessibility summary in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/ui/MetricCard.tsx'), 'utf8');

  assert.equal(summary.metricCardAccessibilityRulesValidated, 16);
  assert.equal(summary.metricCardAccessibilityParityValidated, true);
  assert.match(source, /export interface MetricCardProps extends Omit<ComponentProps<typeof View>/);
  assert.match(source, /Defaults: `tone="warm"`, `accessible=true`, `accessibilityRole="summary"`/);
  assert.match(source, /const metricAccessibilityLabel =/);
  assert.match(source, /accessibilityLabel \?\? `\$\{label\}: \$\{value\}/);
  assert.match(source, /aria-label=\{metricAccessibilityLabel\}/);
  assert.match(source, /accessible=\{accessible\}/);
  assert.match(source, /accessibilityLabel=\{metricAccessibilityLabel\}/);
  assert.match(source, /accessibilityRole=\{accessibilityRole\}/);
  assert.match(
    source,
    /style=\{\[styles\.card, tone === 'blue' \? styles\.blueCard : null, style\]\}/,
  );
  assert.match(source, /borderWidth:\s*space\.hairline/);
  assert.match(source, /<Text style=\{styles\.value\}>\{value\}<\/Text>/);
  assert.match(source, /<Text style=\{styles\.label\}>\{label\}<\/Text>/);
  assert.match(source, /\{helper \? <Text style=\{styles\.helper\}>\{helper\}<\/Text> : null\}/);
});

test('MetricCard accessibility parity rejects web label drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/MetricCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('aria-label={metricAccessibilityLabel}', 'aria-label={label}');
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
    /MetricCard missing web aria label for accessibility parity/,
  );
});

test('MetricCard accessibility parity rejects dropped caller style passthrough', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/MetricCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("style={[styles.card, tone === 'blue' ? styles.blueCard : null, style]}", "style={[styles.card, tone === 'blue' ? styles.blueCard : null]}");
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
    /MetricCard missing blue tone style path for accessibility parity/,
  );
});
