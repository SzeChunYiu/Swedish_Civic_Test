const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-source-citation-accessibility'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

function readSourceCitationSource() {
  return fs.readFileSync(path.join(repoRoot, 'components/quiz/SourceCitation.tsx'), 'utf8');
}

function runValidationWithSourcePatch(patchExpression) {
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
  if (normalizedPath.endsWith('/components/quiz/SourceCitation.tsx')) {
    return String(contents).${patchExpression};
  }
  return contents;
};
process.argv.push('--focus-source-citation-accessibility');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

test('SourceCitation keeps standalone accessibility and visible citation parity', () => {
  const summary = parseValidationSummary();
  const source = readSourceCitationSource();

  assert.equal(summary.sourceCitationAccessibilityRulesValidated, 20);
  assert.equal(summary.sourceCitationAccessibilityParityValidated, true);
  assert.match(source, /const sourceCitationCopy: Record<AppLanguage, SourceCitationCopy> = \{/);
  assert.match(source, /label: 'Källhänvisning'/);
  assert.match(source, /label: 'Source citation'/);
  assert.match(source, /accessibilityRole = 'text'/);
  assert.match(source, /showLabel = true/);
  assert.match(source, /sourceTitle = 'Sverige i fokus'/);
  assert.match(source, /const pageText = getPageText\(copy, reference\);/);
  assert.match(
    source,
    /const defaultAccessibilityLabel = \[resolvedLabel, citationText, pageText\]/,
  );
  assert.match(source, /accessibilityRole === 'none'\s*\? undefined/);
  assert.match(source, /accessibilityLabel=\{resolvedAccessibilityLabel\}/);
  assert.match(source, /\{showLabel \? \(/);
  assert.match(source, /\{hasCustomBody \? \(/);
  assert.match(source, /\{!hasCustomBody && pageText \? \(/);
});

test('SourceCitation accessibility parity rejects dropped text role default', () => {
  const result = runValidationWithSourcePatch(
    `replace("accessibilityRole = 'text'", "accessibilityRole = 'none'")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /SourceCitation missing text role default/);
});

test('SourceCitation accessibility parity rejects page metadata omission', () => {
  const result = runValidationWithSourcePatch(
    `replace('const defaultAccessibilityLabel = [resolvedLabel, citationText, pageText]', 'const defaultAccessibilityLabel = [resolvedLabel, citationText]')`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /SourceCitation missing composite accessibility label includes page metadata/,
  );
});

test('SourceCitation accessibility parity rejects duplicate labels when hidden', () => {
  const result = runValidationWithSourcePatch(
    `replace("accessibilityRole === 'none' ? undefined : (accessibilityLabel ?? defaultAccessibilityLabel)", "accessibilityLabel ?? defaultAccessibilityLabel")`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /SourceCitation missing role-none accessibility label suppression/,
  );
});

test('SourceCitation accessibility parity rejects custom-body page duplication', () => {
  const result = runValidationWithSourcePatch(
    `replace('{!hasCustomBody && pageText ? (', '{pageText ? (')`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /SourceCitation missing custom body and page metadata rendering/,
  );
});
