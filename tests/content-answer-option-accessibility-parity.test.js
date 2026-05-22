const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-answer-option-accessibility'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('quiz AnswerOption keeps feedback labels and selection state in accessibility parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/quiz/AnswerOption.tsx'), 'utf8');
  const optionCardSource = fs.readFileSync(
    path.join(repoRoot, 'components/OptionCard.tsx'),
    'utf8',
  );

  assert.equal(summary.answerOptionAccessibilityRulesValidated, 35);
  assert.equal(summary.answerOptionAccessibilityParityValidated, true);
  assert.match(source, /import \{ OptionCard \} from '\.\.\/OptionCard';/);
  assert.match(source, /import type \{ OptionCardState \} from '\.\.\/OptionCard';/);
  assert.match(source, /stateLabels: Record<Exclude<OptionCardState, 'idle'>, string>;/);
  assert.match(source, /const answerOptionCopy: Record<AnswerLanguage, AnswerOptionCopy>/);
  assert.match(source, /selectAccessibilityLabel: \(label\) => `Välj svaret \$\{label\}`/);
  assert.match(source, /selectAccessibilityLabel: \(label\) => `Select answer \$\{label\}`/);
  assert.match(source, /strikeoutAccessibilityLabel: \(label\) => `Eliminera svaret \$\{label\}`/);
  assert.match(source, /strikeoutAccessibilityLabel: \(label\) => `Eliminate answer \$\{label\}`/);
  assert.match(
    source,
    /restoreStrikeoutAccessibilityLabel: \(label\) => `Återställ svaret \$\{label\}`/,
  );
  assert.match(
    source,
    /restoreStrikeoutAccessibilityLabel: \(label\) => `Restore answer \$\{label\}`/,
  );
  assert.match(source, /struckStateLabel: 'Eliminerat'/);
  assert.match(source, /struckStateLabel: 'Eliminated'/);
  assert.match(source, /const state = getOptionCardState\(tone, selected\);/);
  assert.match(source, /const accessibilityLabel = resultLabel/);
  assert.match(source, /struck[\s\S]*`\$\{label\}, \$\{copy\.struckStateLabel\}`/);
  assert.match(source, /copy\.selectAccessibilityLabel\(label\)/);
  assert.match(
    source,
    /const stateLabel = state === 'idle' \? undefined : copy\.stateLabels\[state\];/,
  );
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /aria-checked=\{selected\}/);
  assert.match(
    source,
    /accessibilityState=\{\{ checked: selected, disabled: optionDisabled, selected \}\}/,
  );
  assert.match(source, /export function getAnswerOptionRadioKeyboardProps\(/);
  assert.match(source, /key === 'ArrowRight' \|\| key === 'ArrowDown'/);
  assert.match(source, /key === 'ArrowLeft' \|\| key === 'ArrowUp'/);
  assert.match(source, /key === 'Home'/);
  assert.match(source, /key === 'End'/);
  assert.match(source, /tabIndex: currentValue === focusableValue \? 0 : -1/);
  assert.match(
    source,
    /const enabledValues = optionValues\.filter\(\(value\) => !disabledValueSet\.has\(value\)\);/,
  );
  assert.match(source, /optionRefs\.current\[nextValue\]\?\.focus\?\.\(\);/);
  assert.match(source, /disabled=\{optionDisabled\}/);
  assert.match(source, /ref=\{optionRef\}/);
  assert.match(source, /struck=\{struck\}/);
  assert.match(source, /\{\.\.\.radioKeyboardProps\}/);
  assert.match(source, /aria-pressed=\{struck\}/);
  assert.match(source, /resultLabel=\{resultLabel\}/);
  assert.match(source, /state=\{state\}/);
  assert.match(source, /stateLabel=\{stateLabel\}/);
  assert.match(
    source,
    /function getOptionCardState\(tone: AnswerTone, selected: boolean\): OptionCardState \{/,
  );
  assert.match(source, /if \(tone !== 'idle'\) return tone;/);
  assert.match(source, /return selected \? 'selected' : 'idle';/);
  assert.match(source, /return getQuestionOptionText\(option, language\);/);
  assert.match(optionCardSource, /struck\?: boolean;/);
  assert.match(optionCardSource, /textDecorationLine: 'line-through'/);
  assert.match(optionCardSource, /struckLabel: \{/);
  assert.match(optionCardSource, /struckDescription: \{/);
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
process.argv.push('--focus-answer-option-accessibility');
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

test('AnswerOption accessibility parity rejects OptionCard tone-state drift', () => {
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
      .replace("if (tone !== 'idle') return tone;", "if (tone !== 'idle') return 'selected';");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-answer-option-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AnswerOption missing tone-to-OptionCard state mapping for accessibility parity/,
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
      .replace(
        'accessibilityState={{ checked: selected, disabled: optionDisabled, selected }}',
        'accessibilityState={{ disabled: optionDisabled }}',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-answer-option-accessibility');
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

test('AnswerOption accessibility parity rejects missing strikeout labels', () => {
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
      .replace('strikeoutAccessibilityLabel: (label) => \`Eliminate answer \${label}\`', 'strikeoutAccessibilityLabel: (label) => \`Hide answer \${label}\`');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-answer-option-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /AnswerOption missing localized strikeout accessibility copy for accessibility parity/,
  );
});
