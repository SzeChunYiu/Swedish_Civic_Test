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

test('shared ProgressBar keeps visual progress and accessibility values in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/ui/ProgressBar.tsx'), 'utf8');

  assert.equal(summary.progressBarAccessibilityRulesValidated, 17);
  assert.equal(summary.progressBarAccessibilityParityValidated, true);
  assert.match(source, /import type \{ AppLanguage \}/);
  assert.match(source, /const progressBarCopy: Record<AppLanguage, ProgressBarCopy> = \{/);
  assert.match(source, /`\$\{progressPercent\} procent klart`/);
  assert.match(source, /`\$\{progressPercent\} percent complete`/);
  assert.match(source, /const clampedProgress = Math\.max\(0, Math\.min\(1, progress\)\);/);
  assert.match(source, /const progressPercent = Math\.round\(clampedProgress \* 100\);/);
  assert.match(source, /const copy = progressBarCopy\[language\];/);
  assert.match(
    source,
    /const progressAccessibilityLabel = copy\.progressLabel\(progressPercent\);/,
  );
  assert.match(source, /aria-valuenow=\{progressPercent\}/);
  assert.match(source, /aria-valuetext=\{progressAccessibilityLabel\}/);
  assert.match(source, /accessibilityRole="progressbar"/);
  assert.match(
    source,
    /accessibilityValue=\{\{[\s\S]*min:\s*0,\s*max:\s*100,\s*now:\s*progressPercent,\s*text:\s*progressAccessibilityLabel,?\s*\}\}/,
  );
  assert.match(source, /new Animated\.Value\(clampedProgress\)/);
});

test('route and chapter progress bars receive the selected settings language', () => {
  const callSites = [
    ['app/(tabs)/home.tsx', /<ProgressBar language=\{language\} progress=\{progress\} \/>/],
    ['app/(tabs)/practice.tsx', /<ProgressBar language=\{language\} progress=\{bankProgress\} \/>/],
    [
      'app/(tabs)/exam.tsx',
      /<ProgressBar\s+language=\{language\}\s+progress=\{examQuestions\.length > 0 \? answeredCount \/ examQuestions\.length : 0\}\s+\/>/,
    ],
    [
      'app/quiz/[sessionId].tsx',
      /<ProgressBar language=\{language\} progress=\{hasSelectedAnswer \? 1 : 0\} \/>/,
    ],
    [
      'components/learning/ChapterCard.tsx',
      /<ProgressBar language=\{language\} progress=\{progress\} \/>/,
    ],
  ];

  for (const [relativePath, pattern] of callSites) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, pattern, `${relativePath} should pass language to ProgressBar`);
  }
});

test('ProgressBar accessibility parity rejects unclamped native value drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/ProgressBar.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('now: progressPercent,', 'now: progress,');
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
    /ProgressBar missing native clamped accessibility value for accessibility parity/,
  );
});
