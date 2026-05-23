const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('mistakes route title, review sections, and empty state stay accessible as headers', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');

  assert.equal(summary.mistakesRouteHeadersValidated, 4);
  assert.equal(summary.mistakesRouteHeaderParityValidated, true);
  assert.match(source, /type MistakesCopy =/);
  assert.match(source, /const mistakesCopy: Record<AppLanguage, MistakesCopy>/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = mistakesCopy\[language\];/);
  assert.match(source, /Repetition/);
  assert.match(source, /Inga sparade eller missade frågor ännu/);
  assert.doesNotMatch(source, /Inga misstag ännu/);
  assert.match(source, /Frågor att öva på/);
  assert.match(source, /Review/);
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>\s*\{copy\.bookmarkedTitle\}\s*<\/Text>/,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>\s*\{copy\.mistakeTitle\}\s*<\/Text>/,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.emptyTitle\}>\s*\{copy\.emptyTitle\}\s*<\/Text>/,
  );
  assert.doesNotMatch(source, /<Text style=\{styles\.(?:title|sectionTitle|emptyTitle)\}>/);
});

test('mistakes route header parity rejects an unheadered empty-state title', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.emptyTitle}>',
        '<Text style={styles.emptyTitle}>',
      );
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
    /mistakes route title and section text must expose accessibilityRole="header"/,
  );
});
