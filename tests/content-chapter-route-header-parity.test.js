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

test('chapter route title, missing state, and question section stay accessible as headers', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/chapter/[chapterId].tsx'), 'utf8');

  assert.equal(summary.chapterRouteHeadersValidated, 3);
  assert.equal(summary.chapterRouteHeaderParityValidated, true);
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.title\}>\s*Chapter not found\s*<\/Text>/,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.title\}>\s*\{chapter\.nameSv\}\s*<\/Text>/,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>\s*Practice questions \(\{chapterQuestions\.length\}\)\s*<\/Text>/,
  );
  assert.doesNotMatch(source, /<Text style=\{styles\.(?:title|sectionTitle)\}>/);
});

test('chapter route header parity rejects an unheadered question section title', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/chapter/[chapterId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.sectionTitle}>',
        '<Text style={styles.sectionTitle}>',
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
    /chapter route title and section text must expose accessibilityRole="header"/,
  );
});
