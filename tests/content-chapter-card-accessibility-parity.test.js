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

test('learning ChapterCard keeps visible progress and accessibility summary in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/learning/ChapterCard.tsx'),
    'utf8',
  );

  assert.equal(summary.chapterCardAccessibilityRulesValidated, 11);
  assert.equal(summary.chapterCardAccessibilityParityValidated, true);
  assert.match(source, /const chapterAccessibilityLabel =/);
  assert.match(source, /`Chapter: \$\{title\}`/);
  assert.match(source, /English name: \$\{chapter\.nameEn\}/);
  assert.match(source, /`Status: \$\{status\}`/);
  assert.match(source, /Description: \$\{chapter\.descriptionSv\}/);
  assert.match(source, /<Card accessibilityLabel=\{chapterAccessibilityLabel\} elevated/);
  assert.match(source, /<Text style=\{styles\.title\}>\{title\}<\/Text>/);
  assert.match(source, /<ProgressBar progress=\{progress\} \/>/);
});

test('ChapterCard accessibility parity rejects status summary drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/learning/ChapterCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('Status: \${status}', 'Progress hidden');
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
    /ChapterCard missing progress status in accessibility summary for accessibility parity/,
  );
});
