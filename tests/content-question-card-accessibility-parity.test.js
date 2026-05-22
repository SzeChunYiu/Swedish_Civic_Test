const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-question-card-accessibility'],
    {
      encoding: 'utf8',
      cwd: repoRoot,
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('quiz QuestionCard keeps question text and accessibility summary in parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/quiz/QuestionCard.tsx'), 'utf8');
  const provenanceSource = fs.readFileSync(
    path.join(repoRoot, 'components/quiz/ProvenanceBadge.tsx'),
    'utf8',
  );
  const webAriaFalseStateSource = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/web-aria-false-state.spec.ts'),
    'utf8',
  );
  const helperSource = fs.readFileSync(path.join(repoRoot, 'lib/quiz/questionText.ts'), 'utf8');

  assert.equal(summary.questionCardAccessibilityRulesValidated, 22);
  assert.equal(summary.questionCardAccessibilityParityValidated, true);
  assert.match(source, /const questionAccessibilityLabel =/);
  assert.match(source, /language\?: AppLanguage/);
  assert.match(source, /const copy = questionCardCopy\[language\];/);
  assert.match(
    source,
    /difficultyValueLabels: Record<PracticeQuestion\['difficulty'\] \| 'practice', string>/,
  );
  assert.match(source, /easy: 'Lätt'/);
  assert.match(source, /medium: 'Medel'/);
  assert.match(source, /hard: 'Svår'/);
  assert.match(source, /practice: 'Övning'/);
  assert.match(source, /easy: 'Easy'/);
  assert.match(source, /medium: 'Medium'/);
  assert.match(source, /hard: 'Hard'/);
  assert.match(source, /practice: 'Practice'/);
  assert.match(source, /const difficultyLabel = copy\.difficultyValueLabels\[difficulty\];/);
  assert.match(source, /getQuestionDisplayText\(question, language\)/);
  assert.match(source, /getQuestionTranslationText\(question, language\)/);
  assert.match(source, /getQuestionSourceCitation\(question, language\)/);
  assert.match(source, /difficultyLabel: 'Svårighetsgrad'/);
  assert.match(source, /questionLabel: 'Fråga'/);
  assert.match(source, /secondaryLabel: 'Engelsk översättning'/);
  assert.match(source, /sourceCitationLabel: 'Källhänvisning'/);
  assert.match(source, /difficultyLabel: 'Difficulty'/);
  assert.match(source, /\$\{copy\.difficultyLabel\}: \$\{difficultyLabel\}/);
  assert.match(source, /\$\{copy\.questionLabel\}: \$\{questionText\}/);
  assert.match(
    source,
    /questionTranslation \? `\$\{copy\.secondaryLabel\}: \$\{questionTranslation\}` : null/,
  );
  const questionAccessibilityLabelBlock =
    source.match(/const questionAccessibilityLabel = \[[\s\S]*?\]\s*\.filter\(Boolean\)/)?.[0] ??
    '';
  assert.doesNotMatch(
    questionAccessibilityLabelBlock,
    /\$\{copy\.sourceCitationLabel\}: \$\{sourceCitation\}/,
  );
  assert.match(
    source,
    /accessibilityLabel=\{`\$\{copy\.sourceCitationLabel\}: \$\{sourceCitation\}`\}/,
  );
  assert.match(source, /Swedish original/);
  assert.match(source, /<Card accessibilityLabel=\{questionAccessibilityLabel\}>/);
  assert.match(source, /<Text style=\{styles\.label\}>\{difficultyLabel\}<\/Text>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.question\}>/);
  assert.match(source, /\{questionText\}/);
  assert.match(source, /<Text style=\{styles\.sourceCitation\}>\{sourceCitation\}<\/Text>/);
  assert.match(source, /\{questionTranslation\}/);
  assert.match(provenanceSource, /import \{ useEffect, useMemo, useRef, useState \} from 'react';/);
  assert.match(
    provenanceSource,
    /useEffect\(\(\) =>\s*\{[\s\S]*setSourceNoteVisible\(false\);[\s\S]*\},\s*\[\s*question\?\.id,\s*language\s*\]\s*\);/,
  );
  assert.match(
    provenanceSource,
    /sourceNote:\s*\{[\s\S]*backgroundColor: themeColors\.surfaceWarm,[\s\S]*borderColor: themeColors\.border,[\s\S]*borderRadius: radius\.small,[\s\S]*color: themeColors\.textSecondary,[\s\S]*\}/,
  );
  assert.match(
    webAriaFalseStateSource,
    /await provenance\.focus\(\);\s*await expect\(provenance\)\.toHaveAttribute\('aria-expanded', 'true'\);\s*await expect\(sourceNote\)\.toBeVisible\(\);\s*await provenance\.evaluate\(\(element: HTMLElement\) => element\.blur\(\)\);\s*await expect\(provenance\)\.not\.toBeFocused\(\);\s*await expect\(provenance\)\.toHaveAttribute\('aria-expanded', 'false'\);\s*await expect\(sourceNote\)\.toHaveCount\(0\);\s*await provenance\.click\(\);\s*await expect\(provenance\)\.toHaveAttribute\('aria-expanded', 'true'\);/,
  );
  assert.match(helperSource, /const QUESTION_DISPLAY_FALLBACKS/);
  assert.match(helperSource, /sv: 'Fråga saknas'/);
  assert.match(helperSource, /en: 'Question unavailable'/);
  assert.match(
    helperSource,
    /fallback = QUESTION_DISPLAY_FALLBACKS_BY_LANGUAGE\[language\] \?\?\s*QUESTION_DISPLAY_FALLBACKS\[primaryLanguageFor\(language\)\]/,
  );
  assert.match(helperSource, /resolveLocalizedText\(question\?\.questionText, language/);
});

test('QuestionCard accessibility parity rejects English-only missing-question fallback', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/quiz/questionText.ts')) {
    return String(originalReadFileSync.call(this, filePath, ...args))
      .replace("sv: 'Fråga saknas'", "sv: 'Question unavailable'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-question-card-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard missing localized question display fallback/,
  );
});

test('QuestionCard accessibility parity rejects mixed-language source citation prefixes', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/quiz/questionText.ts')) {
    return String(originalReadFileSync.call(this, filePath, ...args))
      .replace(/Källa: Sverige i fokus/g, 'Källa/Source: Sverige i fokus')
      .replace(/Source: Sverige i fokus/g, 'Källa/Source: Sverige i fokus');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-question-card-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard source citation helper still exposes mixed Källa\/Source prefix/,
  );
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
process.argv.push('--focus-question-card-accessibility');
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

test('QuestionCard accessibility parity rejects dropped card accessibility summary', () => {
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
      .replace('<Card accessibilityLabel={questionAccessibilityLabel}>', '<Card>');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-question-card-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard missing Card receives accessibility summary for accessibility parity/,
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
process.argv.push('--focus-question-card-accessibility');
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

test('QuestionCard accessibility parity rejects carried source note disclosure state', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/ProvenanceBadge.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(/\\n\\s*useEffect\\(\\(\\) => \\{\\n\\s*clearFocusRevealTimeout\\(\\);\\n\\s*setSourceNoteVisible\\(false\\);\\n\\s*\\}, \\[question\\?\\.id, language\\]\\);\\n/, '\\n');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-question-card-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard missing source note disclosure reset on question or language change for accessibility parity/,
  );
});

test('QuestionCard accessibility parity rejects source note without polite live region', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/ProvenanceBadge.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('          accessibilityLiveRegion="polite"\\n', '')
      .replace('          aria-live="polite"\\n', '');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-question-card-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard missing expanded source note native polite live region for accessibility parity/,
  );
});

test('QuestionCard accessibility parity rejects raw difficulty enum display', () => {
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
      .replace(
        '<Text style={styles.label}>{difficultyLabel}</Text>',
        '<Text style={styles.label}>{difficulty}</Text>',
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-question-card-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionCard missing visible difficulty label for accessibility parity/,
  );
});
