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

test('quiz UHRReferenceCard keeps source metadata in visible and accessibility parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/quiz/UHRReferenceCard.tsx'),
    'utf8',
  );

  assert.equal(summary.uhrReferenceCardAccessibilityRulesValidated, 10);
  assert.equal(summary.uhrReferenceCardAccessibilityParityValidated, true);
  assert.match(source, /reference\?: UHRReference/);
  assert.match(source, /language\?: AppLanguage;/);
  assert.match(source, /const uhrReferenceCardCopy: Record<AppLanguage, UHRReferenceCardCopy>/);
  assert.match(source, /UHR-källa/);
  assert.match(source, /Ungefär sida/);
  assert.match(source, /`\$\{reference\.chapter\} · \$\{reference\.section\}`/);
  assert.match(source, /`\$\{copy\.approximatePage\} \$\{reference\.pageApprox\}`/);
  assert.match(source, /const referenceAccessibilityLabel = pageLabel/);
  assert.match(source, /<Card accessibilityLabel=\{referenceAccessibilityLabel\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /\{copy\.title\}/);
  assert.match(source, /<Text style=\{styles\.body\}>\{label\}<\/Text>/);
  assert.match(
    source,
    /\{pageLabel \? <Text style=\{styles\.meta\}>\{pageLabel\}<\/Text> : null\}/,
  );
});

test('UHRReferenceCard accessibility parity rejects hidden page-label drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/UHRReferenceCard.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('{pageLabel ? <Text style={styles.meta}>{pageLabel}</Text> : null}', 'null');
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
    /UHRReferenceCard missing visible approximate page label for accessibility parity/,
  );
});
