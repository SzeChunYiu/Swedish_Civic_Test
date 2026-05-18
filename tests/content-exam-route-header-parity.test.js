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

test('exam route title and section headings stay exposed as accessibility headers', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.equal(summary.examRouteHeadersValidated, 8);
  assert.equal(summary.examRouteHeaderParityValidated, true);
  assert.doesNotMatch(source, /<Text style=\{styles\.(?:title|sectionTitle)\}>/);
  assert.match(source, /accessibilityRole="header" style=\{styles\.title\}/);
  assert.match(source, /accessibilityRole="header" style=\{styles\.sectionTitle\}/);
  assert.match(source, /const examRouteCopy: Record<AppLanguage, ExamRouteCopy> = \{/);
  assert.match(source, /\{copy\.mockExamTitle\}/);
  assert.match(source, /\{copy\.examResultTitle\}/);
  assert.match(source, /\{copy\.accessTitle\}/);
  assert.match(source, /\{copy\.nextExamTitle\}/);
  assert.match(source, /\{copy\.chapterBreakdownTitle\}/);
  assert.match(source, /\{copy\.questionReviewTitle\}/);
  assert.match(source, /\{copy\.progressTitle\}/);
});

test('exam route header parity rejects dropped section header roles', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.sectionTitle}>\\n          {copy.questionReviewTitle}\\n        </Text>',
        '<Text style={styles.sectionTitle}>{copy.questionReviewTitle}</Text>'
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
    /exam route title and sectionTitle text must expose accessibilityRole="header"/,
  );
});
