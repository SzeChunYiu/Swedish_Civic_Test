const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');
const { runLegalSectionRenderingGuard } = require('../scripts/legal-section-rendering-guard');

const repoRoot = path.resolve(__dirname, '..');

function parseFocusedValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-legal-section-rendering'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused legal-section validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('LegalSection runtime rendering keeps mixed legal copy native-safe', () => {
  const result = runLegalSectionRenderingGuard({ repoRoot });

  assert.deepEqual(result.failures, []);
  assert.equal(result.summary.legalSectionRenderingCasesValidated, 3);
  assert.equal(result.summary.legalSectionWhitespaceTextValidated, true);
  assert.equal(result.summary.legalSectionFragmentChildrenValidated, true);
  assert.equal(result.summary.legalSectionRawTextUnderViewValidated, true);
  assert.equal(result.summary.legalSectionRenderingParityValidated, true);
});

test('LegalSection rendering guard is available through focused content validation', () => {
  const summary = parseFocusedValidationSummary();

  assert.equal(summary.legalSectionRenderingTestsRoutedValidated, true);
  assert.equal(summary.legalSectionRenderingCasesValidated, 3);
  assert.equal(summary.legalSectionWhitespaceTextValidated, true);
  assert.equal(summary.legalSectionFragmentChildrenValidated, true);
  assert.equal(summary.legalSectionRawTextUnderViewValidated, true);
  assert.equal(summary.legalSectionRenderingParityValidated, true);
});

test('LegalSection rendering guard rejects whitespace-only paragraph regressions', () => {
  const result = runLegalSectionRenderingGuard({
    repoRoot,
    transformLegalPageSource: (source) =>
      source
        .replace("if (typeof child === 'string' && child.trim().length === 0) return;", '')
        .replace(
          "const paragraph = paragraphChildren.join('').trim();\n  if (!paragraph) return;",
          "const paragraph = paragraphChildren.join('');\n  if (paragraph.length === 0) return;",
        ),
  });

  assert.notDeepEqual(result.failures, []);
  assert.match(result.failures.join('\n'), /whitespace-only text children/);
});

test('LegalSection rendering guard rejects unflattened Fragment raw text under View', () => {
  const result = runLegalSectionRenderingGuard({
    repoRoot,
    transformLegalPageSource: (source) =>
      source.replace('if (isFragmentChild(child)) {', 'if (false && isFragmentChild(child)) {'),
  });

  assert.notDeepEqual(result.failures, []);
  assert.match(result.failures.join('\n'), /fragment-wrapped mixed children/);
  assert.match(result.failures.join('\n'), /View contains direct raw text child/);
});
