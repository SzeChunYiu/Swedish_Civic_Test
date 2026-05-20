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

test('quiz ExplanationPanel keeps selected explanation text in accessibility parity', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(
    path.join(repoRoot, 'components/quiz/ExplanationPanel.tsx'),
    'utf8',
  );

  assert.equal(summary.explanationPanelAccessibilityRulesValidated, 10);
  assert.equal(summary.explanationPanelAccessibilityParityValidated, true);
  assert.match(
    source,
    /const explanation =[\s\S]*language === 'en' && explanationEn \? explanationEn : \(explanationSv \?\? copy\.fallback\);/,
  );
  assert.match(source, /const explanationPanelCopy: Record<AppLanguage, ExplanationPanelCopy>/);
  assert.match(source, /Förklaring saknas för den här frågan\./);
  assert.match(source, /Explanation unavailable for this question\./);
  assert.match(
    source,
    /const panelAccessibilityLabel = `\$\{copy\.accessibilityLabelPrefix\}: \$\{explanation\}`;/,
  );
  assert.match(source, /<Card accessibilityLabel=\{panelAccessibilityLabel\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /\{copy\.title\}/);
  assert.match(source, /<Text style=\{styles\.body\}>\{explanation\}<\/Text>/);
});

test('ExplanationPanel accessibility parity rejects dropped header role', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/quiz/ExplanationPanel.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('accessibilityRole="header" style={styles.title}', 'style={styles.title}');
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
    /ExplanationPanel missing localized explanation header text for accessibility parity/,
  );
});
