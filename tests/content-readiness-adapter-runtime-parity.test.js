const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function runFocusedReadinessAdapterValidation() {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-readiness-adapter-rules'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused readiness adapter validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('readiness adapter focus mode validates only the executable runtime parity slice', () => {
  const summary = runFocusedReadinessAdapterValidation();

  assert.deepEqual(Object.keys(summary).sort(), [
    'readinessAdapterRulesValidated',
    'readinessAdapterRuntimeParityValidated',
  ]);
  assert.equal(summary.readinessAdapterRulesValidated, 6);
  assert.equal(summary.readinessAdapterRuntimeParityValidated, true);
});

test('test:content includes readiness adapter runtime parity exactly once', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const contentScript = packageJson.scripts?.['test:content'] ?? '';
  const testPath = 'tests/content-readiness-adapter-runtime-parity.test.js';

  assert.equal(
    (contentScript.match(new RegExp(testPath, 'g')) ?? []).length,
    1,
    'test:content must include the readiness adapter runtime parity test exactly once',
  );
});
