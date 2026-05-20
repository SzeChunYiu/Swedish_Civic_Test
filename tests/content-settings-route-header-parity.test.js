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

test('settings route title and preference sections stay accessible as headers', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.equal(summary.settingsRouteHeadersValidated, 4);
  assert.equal(summary.settingsRouteHeaderParityValidated, true);
  assert.match(source, /const copy = settingsCopy\[language\]/);
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.title\}>\s*\{copy\.title\}\s*<\/Text>/,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>\s*\{copy\.questionLanguageTitle\}\s*<\/Text>/,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>\s*\{copy\.audioTitle\}\s*<\/Text>/,
  );
  assert.match(
    source,
    /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>\s*\{copy\.dailyGoalTitle\}\s*<\/Text>/,
  );
  assert.match(source, /Inställningar/);
  assert.match(source, /Frågespråk/);
  assert.match(source, /Dagligt mål/);
  assert.match(source, /Settings/);
  assert.match(source, /Question language/);
  assert.match(source, /Daily goal/);
  assert.doesNotMatch(source, /<Text style=\{styles\.(?:title|sectionTitle)\}>/);
});

test('settings route header parity rejects dropped section header roles', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/settings.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.sectionTitle}>',
        '<Text style={styles.sectionTitle}>'
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
    /settings route title and section text must expose accessibilityRole="header"/,
  );
});
