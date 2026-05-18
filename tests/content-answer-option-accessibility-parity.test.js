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

test('quiz AnswerOption keeps feedback labels and selection state in accessibility parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/quiz/AnswerOption.tsx'), 'utf8');

  assert.equal(summary.answerOptionAccessibilityRulesValidated, 15);
  assert.equal(summary.answerOptionAccessibilityParityValidated, true);
  assert.match(source, /const answerOptionCopy: Record<AnswerLanguage, AnswerOptionCopy>/);
  assert.match(source, /selectAccessibilityLabel: \(label\) => `Välj svaret \$\{label\}`/);
  assert.match(source, /selectAccessibilityLabel: \(label\) => `Select answer \$\{label\}`/);
  assert.match(source, /const accessibilityLabel = resultLabel/);
  assert.match(source, /copy\.selectAccessibilityLabel\(label\)/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityState=\{\{ disabled, selected \}\}/);
  assert.match(source, /disabled=\{disabled\}/);
  assert.match(source, /variant=\{variant\}/);
  assert.match(source, /return language === 'en' \? option\.textEn : option\.textSv;/);
});

test('AnswerOption accessibility parity rejects English-only Swedish idle labels', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/AnswerOption.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('selectAccessibilityLabel: (label) => \`Välj svaret \${label}\`', 'selectAccessibilityLabel: (label) => \`Select answer \${label}\`');
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
    /AnswerOption missing Swedish select-answer accessibility copy for accessibility parity/,
  );
});

test('AnswerOption accessibility parity rejects selected-state drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/AnswerOption.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('accessibilityState={{ disabled, selected }}', 'accessibilityState={{ disabled }}');
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
    /AnswerOption missing selected and disabled state forwarding for accessibility parity/,
  );
});
