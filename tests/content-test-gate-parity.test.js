const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('test:content script includes every content test file exactly once', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const testContentScript = packageJson.scripts?.['test:content'];

  assert.equal(typeof testContentScript, 'string');

  const contentTestFiles = fs
    .readdirSync(path.join(repoRoot, 'tests'))
    .filter((fileName) => /^content-.*\.test\.js$/.test(fileName))
    .map((fileName) => `tests/${fileName}`)
    .sort();
  const wiredContentTests = testContentScript
    .split(/\s+/)
    .filter((token) => token.startsWith('tests/content-') && token.endsWith('.test.js'));

  const missingTests = contentTestFiles.filter((fileName) => !wiredContentTests.includes(fileName));
  const unknownTests = wiredContentTests.filter((fileName) => !contentTestFiles.includes(fileName));
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

test('generated-id fixture guard scans content test globs', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'tests/content-published-question-types.test.js'),
    'utf8',
  );

  assert.match(source, /function contentMutationFixtureFiles\(\)/);
  assert.match(source, /readdirSync\(path\.join\(repoRoot, 'tests'\)\)/);
  assert.match(source, /\^content-\.\*\\\.test\\\.js\$/);
  assert.match(source, /readdirSync\(path\.join\(repoRoot, 'scripts'\)\)/);
  assert.match(source, /\^.\*content.\*\\\.test\\\.js\$/);
  assert.doesNotMatch(source, /const scannedFiles = \[\s*['"`]tests\/content-published/);
  assert.match(source, /generated id fixture guard rejects raw generated ids/);
  assert.match(source, /generated id fixture guard allows source ids and helper-derived ids/);
});
