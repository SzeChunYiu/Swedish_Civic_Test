const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function runValidationWithSettingsRoutePatch(search, replacement) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/app/settings.tsx')) {
    return String(contents).replace(${JSON.stringify(search)}, ${JSON.stringify(replacement)});
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

test('daily goal settings stay in parity between storage and settings controls', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const settingsStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/settingsStore.ts'),
    'utf8',
  );
  const settingsRoute = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');

  assert.equal(summary.settingsDailyGoalOptionsValidated, 4);
  assert.equal(summary.settingsDailyGoalParityValidated, true);
  assert.match(settingsStore, /const dailyGoalKey = 'dailyGoalAnswers';/);
  assert.match(settingsStore, /storedValue && storedValue > 0 \? storedValue : 10/);
  assert.match(settingsStore, /Math\.max\(1, Math\.min\(50, Math\.round\(dailyGoalAnswers\)\)\)/);
  assert.match(settingsRoute, /\[5, 10, 20, 40\]\.map\(\(goal\) =>/);
  assert.match(settingsRoute, /Set daily goal to \$\{goal\} answers/);
  assert.match(settingsRoute, /Ställ in dagligt mål till \$\{goal\} svar/);
  assert.match(settingsRoute, /\$\{answerCount\} svar per dag/);
  assert.match(settingsRoute, /\$\{answerCount\} answers per day/);
  assert.match(settingsRoute, /\{copy\.dailyGoalSummary\(dailyGoalAnswers\)\}/);
});

test('daily goal settings parity rejects option-set drift', () => {
  const result = runValidationWithSettingsRoutePatch(
    '[5, 10, 20, 40].map((goal) =>',
    '[5, 20, 40].map((goal) =>',
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(
    output,
    /app\/settings\.tsx daily goal options are \[\[5,20,40\]\], expected \[5,10,20,40\]/,
  );
  assert.match(output, /daily goal options must include the default 10/);
});
