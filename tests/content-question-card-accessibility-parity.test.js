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

test('quiz QuestionCard keeps question text and accessibility summary in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/quiz/QuestionCard.tsx'), 'utf8');

  assert.equal(summary.questionCardAccessibilityRulesValidated, 13);
  assert.equal(summary.questionCardAccessibilityParityValidated, true);
  assert.match(source, /const questionAccessibilityLabel =/);
  assert.match(source, /getQuestionDisplayText\(question, 'sv'\)/);
  assert.match(source, /getQuestionTranslationText\(question\)/);
  assert.match(source, /getQuestionSourceCitation\(question\)/);
  assert.match(source, /`Difficulty: \$\{difficulty\}`/);
  assert.match(source, /`Question: \$\{questionText\}`/);
  assert.match(source, /English translation: \$\{questionTranslation\}/);
  assert.match(source, /`Source citation: \$\{sourceCitation\}`/);
  assert.match(source, /<Card accessibilityLabel=\{questionAccessibilityLabel\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.question\}>/);
  assert.match(source, /\{questionText\}/);
  assert.match(source, /<Text style=\{styles\.sourceCitation\}>\{sourceCitation\}<\/Text>/);
  assert.match(source, /\{questionTranslation\}/);
});

test('QuestionCard accessibility parity rejects dropped question header', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/QuestionCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('accessibilityRole="header" style={styles.question}', 'style={styles.question}');
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
    /QuestionCard missing question header text for accessibility parity/,
  );
});

test('QuestionCard accessibility parity rejects hidden source citation drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/QuestionCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('<Text style={styles.sourceCitation}>{sourceCitation}</Text>', 'null');
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
    /QuestionCard missing visible source citation line for accessibility parity/,
  );
});
