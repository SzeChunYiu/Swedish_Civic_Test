const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-settings-route'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('settings route keeps mobile content inside a scrollable root', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.equal(summary.settingsRouteScrollRulesValidated, 5);
  assert.equal(summary.settingsRouteScrollParityValidated, true);
  assert.match(
    source,
    /import\s+\{[\s\S]*Pressable,[\s\S]*ScrollView,[\s\S]*StyleSheet,[\s\S]*Text,[\s\S]*TextInput,[\s\S]*View,?[\s\S]*\}\s+from 'react-native';/,
  );
  assert.match(
    source,
    /<ScrollView[\s\S]*\bstyle=\{styles\.container\}[\s\S]*\bcontentContainerStyle=\{styles\.content\}[\s\S]*>/,
  );
  assert.match(source, /content: \{\n\s+flexGrow: 1,/);
  assert.match(source, /paddingBottom: space\[10\]/);
  assert.doesNotMatch(source, /<View style=\{styles\.container\}>/);
});

test('settings route scroll parity rejects an unscrollable root container', () => {
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
        '<ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={styles.content}>',
        '<View style={styles.container}>'
      )
      .replace('</ScrollView>', '</View>');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-settings-route');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /settings route must keep its root content inside ScrollView for mobile scrolling/,
  );
});
