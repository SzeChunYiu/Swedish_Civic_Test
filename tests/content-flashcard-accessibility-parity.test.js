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

  assert.equal(summary.flashcardAccessibilityRulesValidated, 15);
  assert.equal(summary.flashcardAccessibilityParityValidated, true);
  assert.equal(summary.swedishFlashcardCopyNaturalnessValidated, true);
  assert.match(source, /useSettingsStore, type AppLanguage/);
  assert.match(
    source,
    /type FlashcardProps = \{ front\?: string; back\?: string; language\?: AppLanguage \};/,
  );
  assert.match(source, /const flashcardCopy: Record<AppLanguage, FlashcardCopy> = \{/);
  assert.match(source, /fallbackPrompt: 'Studiefråga saknas'/);
  assert.match(source, /fallbackAnswer: 'Svar saknas'/);
  assert.match(source, /accessibilityLabel: \(prompt, answer\) => `Övningskort\. Fråga:/);
  assert.match(source, /badgeLabel: 'Övningskort'/);
  assert.doesNotMatch(source, /Flashkort|flashkort/);
  assert.match(source, /fallbackPrompt: 'Study prompt unavailable'/);
  assert.match(source, /fallbackAnswer: 'Answer unavailable'/);
  assert.match(
    source,
    /const settingsLanguage = useSettingsStore\(\(state\) => state\.language\);/,
  );
  assert.match(source, /const copy = flashcardCopy\[language \?\? settingsLanguage\];/);
  assert.match(source, /const prompt = cleanText\(front, copy\.fallbackPrompt\);/);
  assert.match(source, /const answer = cleanText\(back, copy\.fallbackAnswer\);/);
  assert.match(
    source,
    /const flashcardAccessibilityLabel = copy\.accessibilityLabel\(prompt, answer\);/,
  );
  assert.match(source, /accessibilityLabel=\{flashcardAccessibilityLabel\}/);
  assert.match(source, /<Badge tone="warm">\{copy\.badgeLabel\}<\/Badge>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.label\}>/);
  assert.match(source, /\{copy\.promptHeader\}/);
  assert.match(source, /\{copy\.answerHeader\}/);
  assert.match(source, /<Text style=\{styles\.prompt\}>\{prompt\}<\/Text>/);
  assert.match(source, /<Text style=\{styles\.answer\}>\{answer\}<\/Text>/);
});

test('Flashcard Swedish copy naturalness rejects loan-word drift', () => {
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
      .replaceAll('Övningskort', 'Flashkort');
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
    /Swedish learner-facing flashcard copy must use natural Swedish study-card wording/,
  );
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
      .replace('const flashcardAccessibilityLabel = copy.accessibilityLabel(prompt, answer);', 'const flashcardAccessibilityLabel = prompt;');
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
    /Flashcard missing localized accessibility summary helper for accessibility parity/,
  );
});
