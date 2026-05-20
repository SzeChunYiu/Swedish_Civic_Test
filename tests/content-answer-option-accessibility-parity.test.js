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
  const optionCardSource = fs.readFileSync(
    path.join(repoRoot, 'components/OptionCard.tsx'),
    'utf8',
  );

  assert.equal(summary.answerOptionAccessibilityRulesValidated, 20);
  assert.equal(summary.answerOptionAccessibilityParityValidated, true);
  assert.match(source, /import \{ OptionCard \} from '\.\.\/OptionCard';/);
  assert.match(source, /import type \{ OptionCardState \} from '\.\.\/OptionCard';/);
  assert.match(source, /stateLabels: Record<Exclude<OptionCardState, 'idle'>, string>;/);
  assert.match(source, /const answerOptionCopy: Record<AnswerLanguage, AnswerOptionCopy>/);
  assert.match(source, /selectAccessibilityLabel: \(label\) => `Välj svaret \$\{label\}`/);
  assert.match(source, /selectAccessibilityLabel: \(label\) => `Select answer \$\{label\}`/);
  assert.match(source, /const state = getOptionCardState\(tone, selected\);/);
  assert.match(source, /const accessibilityLabel = resultLabel/);
  assert.match(source, /copy\.selectAccessibilityLabel\(label\)/);
  assert.match(
    source,
    /const stateLabel = state === 'idle' \? undefined : copy\.stateLabels\[state\];/,
  );
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /const checked = selected;/);
  assert.match(source, /accessibilityState=\{\{ checked, disabled, selected \}\}/);
  assert.match(source, /disabled=\{disabled\}/);
  assert.match(source, /resultLabel=\{resultLabel\}/);
  assert.match(source, /state=\{state\}/);
  assert.match(source, /stateLabel=\{stateLabel\}/);
  assert.match(
    source,
    /function getOptionCardState\(tone: AnswerTone, selected: boolean\): OptionCardState \{/,
  );
  assert.match(source, /if \(tone !== 'idle'\) return tone;/);
  assert.match(source, /return selected \? 'selected' : 'idle';/);
  assert.match(source, /return language === 'en' \? option\.textEn : option\.textSv;/);
  assert.match(optionCardSource, /const defaultChecked = state === 'selected';/);
  assert.match(
    optionCardSource,
    /const isChecked = accessibilityState\?\.checked \?\? defaultChecked;/,
  );
  assert.match(optionCardSource, /aria-checked=\{resolvedAccessibilityState\.checked\}/);
  assert.match(optionCardSource, /aria-selected=\{resolvedAccessibilityState\.selected\}/);
  assert.doesNotMatch(optionCardSource, /const isChecked = state !== 'idle';/);
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

test('AnswerOption accessibility parity rejects checked-state drift', () => {
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
      .replace('const checked = selected;', "const checked = state !== 'idle';");
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
    /AnswerOption missing selected-only checked state for accessibility parity/,
  );
});

test('AnswerOption accessibility parity rejects selected-state forwarding drift', () => {
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
      .replace('accessibilityState={{ checked, disabled, selected }}', 'accessibilityState={{ checked, disabled }}');
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
    /AnswerOption missing checked, selected, and disabled state forwarding for accessibility parity/,
  );
});
