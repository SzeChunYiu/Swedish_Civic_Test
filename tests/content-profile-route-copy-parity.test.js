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

test('profile route shell copy stays keyed by the settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');

  assert.equal(summary.profileRouteCopyLabelsValidated, 36);
  assert.equal(summary.profileRouteCopyParityValidated, true);
  assert.match(source, /type ProfileCopy =/);
  assert.match(source, /const profileCopy: Record<AppLanguage, ProfileCopy>/);
  assert.match(source, /const localizedBadgeTitles: Record<AppLanguage, Record<string, string>>/);
  assert.match(source, /const copy = profileCopy\[language\]/);
  assert.match(source, /Framsteg utan konto/);
  assert.match(source, /Progress without an account/);
  assert.match(source, /Första övningen/);
  assert.match(source, /<ScreenShell eyebrow=\{copy\.eyebrow\} title=\{copy\.title\}/);
  assert.match(source, /<MetricCard label=\{copy\.levelMetric\}/);
  assert.match(source, /<SectionHeader title=\{copy\.studySetupTitle\}/);
  assert.match(source, /formatBadges\(badges, language, copy\.noBadges\)/);
  assert.match(source, /accessibilityLabel=\{copy\.openSettingsAccessibilityLabel\}/);
});

test('profile route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/profile.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = profileCopy[language];', 'const copy = profileCopy.en;');
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
    /profile route must select copy from settings language/,
  );
});

test('profile route copy parity rejects missing Swedish shell copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/profile.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'Framsteg utan konto'", "'Progress without an account'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /profile route is missing sv copy/);
});

test('profile route copy parity rejects badge-title localization drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/profile.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("first_practice: 'Första övningen'", "first_practice: 'First practice'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /profile route is missing sv copy/);
});
