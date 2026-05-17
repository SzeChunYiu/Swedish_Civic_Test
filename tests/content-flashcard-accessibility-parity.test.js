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

test('learning Flashcard keeps prompt and answer accessibility in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/learning/Flashcard.tsx'), 'utf8');

  assert.equal(summary.flashcardAccessibilityRulesValidated, 11);
  assert.equal(summary.flashcardAccessibilityParityValidated, true);
  assert.match(source, /const fallbackPrompt = 'Study prompt unavailable';/);
  assert.match(source, /const fallbackAnswer = 'Answer unavailable';/);
  assert.match(source, /const prompt = cleanText\(front, fallbackPrompt\);/);
  assert.match(source, /const answer = cleanText\(back, fallbackAnswer\);/);
  assert.match(
    source,
    /accessibilityLabel=\{`Study flashcard\. Prompt: \$\{prompt\}\. Answer: \$\{answer\}\.`\}/,
  );
  assert.match(source, /<Badge tone="warm">Flashcard<\/Badge>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.label\}>/);
  assert.match(source, /<Text style=\{styles\.prompt\}>\{prompt\}<\/Text>/);
  assert.match(source, /<Text style=\{styles\.answer\}>\{answer\}<\/Text>/);
});

test('Flashcard accessibility parity rejects summary drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/learning/Flashcard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('Prompt: \${prompt}. Answer: \${answer}.', 'Prompt hidden.');
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
    /Flashcard missing prompt and answer accessibility summary for accessibility parity/,
  );
});
