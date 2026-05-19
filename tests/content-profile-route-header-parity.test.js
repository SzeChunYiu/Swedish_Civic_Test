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

test('profile route title and section headings stay on shared header components', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/profile.tsx'), 'utf8');
  const screenShell = fs.readFileSync(path.join(repoRoot, 'components/ui/ScreenShell.tsx'), 'utf8');

  assert.equal(summary.profileRouteHeadersValidated, 3);
  assert.equal(summary.profileRouteHeaderParityValidated, true);
  assert.match(source, /type ProfileCopy =/);
  assert.match(source, /const profileCopy: Record<AppLanguage, ProfileCopy>/);
  assert.match(source, /const copy = profileCopy\[language\]/);
  assert.match(source, /Framsteg utan konto/);
  assert.match(source, /Progress without an account/);
  assert.match(source, /<ScreenShell[\s\S]*title=\{copy\.title\}/);
  assert.match(source, /<SectionHeader[\s\S]*title=\{copy\.studySetupTitle\}/);
  assert.match(source, /<SectionHeader[\s\S]*title=\{copy\.badgesTitle\}/);
  assert.doesNotMatch(source, /<Text style=\{styles\.(?:title|sectionTitle)\}>/);
  assert.match(screenShell, /<Text accessibilityRole="header" style=\{styles\.title\}>/);
  assert.match(screenShell, /<Text accessibilityRole="header" style=\{styles\.sectionTitle\}>/);
});

test('profile route header parity rejects missing badges section title', () => {
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
      .replace('title={copy.badgesTitle}', 'subtitle={copy.badgesTitle}');
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
    /profile route missing badges section title on the shared header path/,
  );
});
