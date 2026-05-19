const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function contentTestFiles() {
  return fs
    .readdirSync(path.join(repoRoot, 'tests'))
    .filter((fileName) => /^content-.*\.test\.js$/.test(fileName))
    .map((fileName) => `tests/${fileName}`)
    .sort();
}

function collectValidateContentExecFileSyncCalls(sourceText) {
  const calls = [];
  const callPattern =
    /execFileSync\(\s*process\.execPath,\s*\[\s*(['"])scripts\/validate-content\.js\1\s*\],\s*\{([\s\S]*?)\}\s*\)/g;
  let match;
  while ((match = callPattern.exec(sourceText)) !== null) {
    calls.push({
      index: match.index,
      hasPinnedCwd: /\bcwd\s*:\s*repoRoot\b/.test(match[2]),
    });
  }
  return calls;
}

test('test:content script includes every content test file exactly once', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const testContentScript = packageJson.scripts?.['test:content'];

  assert.equal(typeof testContentScript, 'string');

  const expectedContentTestFiles = contentTestFiles();
  const wiredContentTests = testContentScript
    .split(/\s+/)
    .filter((token) => token.startsWith('tests/content-') && token.endsWith('.test.js'));

  const missingTests = expectedContentTestFiles.filter(
    (fileName) => !wiredContentTests.includes(fileName),
  );
  const unknownTests = wiredContentTests.filter(
    (fileName) => !expectedContentTestFiles.includes(fileName),
  );
  const duplicateTests = wiredContentTests.filter(
    (fileName, index) => wiredContentTests.indexOf(fileName) !== index,
  );

  assert.deepEqual(missingTests, [], `test:content missing tests: ${missingTests.join(', ')}`);
  assert.deepEqual(
    unknownTests,
    [],
    `test:content references unknown tests: ${unknownTests.join(', ')}`,
  );
  assert.deepEqual(
    duplicateTests,
    [],
    `test:content duplicates tests: ${duplicateTests.join(', ')}`,
  );
});

test('content tests pin direct validate-content exec calls to the repo root', () => {
  const unpinnedCalls = [];
  let totalCalls = 0;

  for (const fileName of contentTestFiles()) {
    const sourceText = fs.readFileSync(path.join(repoRoot, fileName), 'utf8');
    const calls = collectValidateContentExecFileSyncCalls(sourceText);
    totalCalls += calls.length;
    for (const call of calls) {
      if (!call.hasPinnedCwd) {
        const lineNumber = sourceText.slice(0, call.index).split('\n').length;
        unpinnedCalls.push(`${fileName}:${lineNumber}`);
      }
    }
  }

  assert.ok(totalCalls > 0, 'content tests should run validate-content directly');
  assert.deepEqual(
    unpinnedCalls,
    [],
    `validate-content exec calls missing cwd: repoRoot: ${unpinnedCalls.join(', ')}`,
  );
});

test('content exec cwd scanner rejects an unpinned direct validate-content call', () => {
  const unsafeSource =
    "const output = execFileSync(process.execPath, ['scripts/" +
    "validate-content.js'], {\\n  encoding: 'utf8',\\n});";
  const safeSource =
    "const output = execFileSync(process.execPath, ['scripts/" +
    "validate-content.js'], {\\n  cwd: repoRoot,\\n  encoding: 'utf8',\\n});";

  assert.deepEqual(collectValidateContentExecFileSyncCalls(unsafeSource), [
    { index: 15, hasPinnedCwd: false },
  ]);
  assert.deepEqual(collectValidateContentExecFileSyncCalls(safeSource), [
    { index: 15, hasPinnedCwd: true },
  ]);
});

test('validate:content reports direct exec cwd guard coverage', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  assert.ok(summary.contentTestValidateContentExecCallsValidated > 0);
  assert.equal(
    summary.contentTestValidateContentExecCwdPinnedValidated,
    summary.contentTestValidateContentExecCallsValidated,
  );
  assert.equal(summary.contentTestValidateContentExecCwdParityValidated, true);
});
