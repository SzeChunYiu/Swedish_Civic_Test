const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-question-source-citation-accessibility'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function readQuestionSourceCitationSource() {
  return fs.readFileSync(path.join(repoRoot, 'components/quiz/QuestionSourceCitation.tsx'), 'utf8');
}

function runValidationWithQuestionSourcePatch(patchExpression) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/components/quiz/QuestionSourceCitation.tsx')) {
    return String(contents).${patchExpression};
  }
  return contents;
};
process.argv.push('--focus-question-source-citation-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

test('QuestionSourceCitation keeps wrapper accessibility and citation helper parity', () => {
  const summary = parseValidationSummary();
  const source = readQuestionSourceCitationSource();

  assert.equal(summary.questionSourceCitationAccessibilityRulesValidated, 15);
  assert.equal(summary.questionSourceCitationAccessibilityParityValidated, true);
  assert.match(source, /import \{ getQuestionSourceCitation \}/);
  assert.match(source, /import \{ SourceCitation \}/);
  assert.match(source, /label: 'Källhänvisning'/);
  assert.match(source, /label: 'Source citation'/);
  assert.match(
    source,
    /const sourceCitation = citationText \?\? getQuestionSourceCitation\(question, language\);/,
  );
  assert.match(
    source,
    /const resolvedLabel = label \?\? questionSourceCitationLabels\[language\]\.label;/,
  );
  assert.match(
    source,
    /const resolvedAccessibilityLabel = accessibilityLabel \?\? `\$\{resolvedLabel\}: \$\{sourceCitation\}`;/,
  );
  assert.match(source, /<SourceCitation[\s\S]*accessibilityLabel=\{resolvedAccessibilityLabel\}/);
  assert.match(source, /<SourceCitation[\s\S]*reference=\{question\?\.uhrReference\}/);
  assert.match(source, /<SourceCitation[\s\S]*themeColors=\{resolvedThemeColors\}/);
  assert.match(source, /\{hasCustomBody \? \(/);
  assert.match(
    source,
    /<NativeText style=\{\[styles\.body, bodyStyle\]\}>\{sourceCitation\}<\/NativeText>/,
  );
});

test('QuestionSourceCitation accessibility parity rejects label fallback drift', () => {
  const result = runValidationWithQuestionSourcePatch(
    `replace('const resolvedLabel = label ?? questionSourceCitationLabels[language].label;', "const resolvedLabel = label ?? 'Source citation';")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionSourceCitation missing localized label fallback/,
  );
});

test('QuestionSourceCitation accessibility parity rejects helper bypass', () => {
  const result = runValidationWithQuestionSourcePatch(
    `replace('const sourceCitation = citationText ?? getQuestionSourceCitation(question, language);', "const sourceCitation = citationText ?? '';")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionSourceCitation missing helper-derived citation fallback/,
  );
});

test('QuestionSourceCitation accessibility parity rejects missing reference forwarding', () => {
  const result = runValidationWithQuestionSourcePatch(
    `replace('reference={question?.uhrReference}', 'reference={undefined}')`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionSourceCitation missing UHR reference forwarding/,
  );
});

test('QuestionSourceCitation accessibility parity rejects custom body drift', () => {
  const result = runValidationWithQuestionSourcePatch(
    `replace('{hasCustomBody ? (', '{false ? (')`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /QuestionSourceCitation missing custom body rendering/,
  );
});
