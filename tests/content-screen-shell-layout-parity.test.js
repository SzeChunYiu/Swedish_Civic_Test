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

test('shared ScreenShell keeps tab content scrollable and headings accessible', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');

  assert.equal(summary.screenShellLayoutRulesValidated, 7);
  assert.equal(summary.screenShellLayoutParityValidated, true);
  assert.match(source, /import \{ ScrollView, StyleSheet, Text, View \}/);
  assert.match(
    source,
    /<ScrollView style=\{styles\.container\} contentContainerStyle=\{styles\.content\}>/,
  );
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(source, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
  assert.match(source, /content: \{\n\s+gap: space\[2\.25\],/);
  assert.match(source, /paddingBottom: space\[10\]/);
  assert.doesNotMatch(source, /<View style=\{styles\.container\}>/);
});

test('shared ScreenShell layout parity rejects an unscrollable root container', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/components/ui/ScreenShell.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<ScrollView style={styles.container} contentContainerStyle={styles.content}>',
        '<View style={styles.container}>',
      )
      .replace('</ScrollView>', '</View>');
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
    /ScreenShell must keep shared tab content inside ScrollView for mobile scrolling/,
  );
});
