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

test('tab navigation uses localized labels and suppresses placeholder glyph output', () => {
  const summary = parseValidationSummary();
  const tabLayout = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/_layout.tsx'), 'utf8');

  assert.equal(summary.tabNavigationRulesValidated, 11);
  assert.equal(summary.tabNavigationRoutesValidated, 6);
  assert.equal(summary.tabNavigationParityValidated, true);
  assert.match(tabLayout, /exam: 'Övningsprov'/);
  assert.doesNotMatch(tabLayout, /exam: 'Prov'/);
  assert.match(tabLayout, /tabBarAccessibilityLabel: title/);
  assert.match(tabLayout, /tabBarIcon: hiddenTabIcon/);
  assert.match(
    tabLayout,
    /<Tabs\.Screen name="practice" options=\{getTabOptions\(copy\.practice\)\}/,
  );
  assert.doesNotMatch(tabLayout, /⏷/);
});

test('tab navigation parity rejects bare Swedish exam labels', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/_layout.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("exam: 'Övningsprov'", "exam: 'Prov'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /exam tab Swedish title must use Övningsprov/);
});

test('tab navigation parity rejects placeholder icon drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/_layout.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('tabBarIcon: hiddenTabIcon', 'tabBarIcon: undefined');
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /placeholder glyph suppression/);
});

test('tab navigation parity rejects route options that bypass accessible tab options', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/_layout.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Tabs.Screen name="practice" options={getTabOptions(copy.practice)} />',
        '<Tabs.Screen name="practice" options={{ title: copy.practice }} />',
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
    /practice tab must use getTabOptions\(copy\.practice\)/,
  );
});
