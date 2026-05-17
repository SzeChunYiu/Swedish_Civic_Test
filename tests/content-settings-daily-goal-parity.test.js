const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

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

  assert.equal(summary.settingsDailyGoalOptionsValidated, 3);
  assert.equal(summary.settingsDailyGoalParityValidated, true);
  assert.match(settingsStore, /const dailyGoalKey = 'dailyGoalAnswers';/);
  assert.match(settingsStore, /storedValue && storedValue > 0 \? storedValue : 10/);
  assert.match(settingsStore, /Math\.max\(1, Math\.min\(50, Math\.round\(dailyGoalAnswers\)\)\)/);
  assert.match(settingsRoute, /\[5, 10, 20\]\.map\(\(goal\) =>/);
  assert.match(settingsRoute, /Set daily goal to \$\{goal\} answers/);
  assert.match(settingsRoute, /\{dailyGoalAnswers\} answers per day/);
});
