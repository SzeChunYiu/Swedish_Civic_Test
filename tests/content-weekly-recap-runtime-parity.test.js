const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const weeklyRecapFocusArgs = ['scripts/validate-content.js', '--focus-weekly-recap-runtime'];

function focusedWeeklyRecapSummary() {
  const output = execFileSync(process.execPath, weeklyRecapFocusArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);

  assert.ok(match, 'focused weekly recap validation should print a JSON summary');
  return JSON.parse(match[0]);
}

test('weekly recap focused runtime validator emits isolated parity summary', () => {
  const summary = focusedWeeklyRecapSummary();

  assert.deepEqual(Object.keys(summary).sort(), [
    'weeklyRecapRuntimeCasesValidated',
    'weeklyRecapRuntimeParityValidated',
  ]);
  assert.equal(summary.weeklyRecapRuntimeCasesValidated, 7);
  assert.equal(summary.weeklyRecapRuntimeParityValidated, true);
  assert.equal(Object.hasOwn(summary, 'questionSchemasValidated'), false);
});
