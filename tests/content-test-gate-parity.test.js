const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function findMatchingParen(source, openParenIndex) {
  let depth = 0;
  let quote = null;
  let templateExpressionDepth = 0;

  for (let index = openParenIndex; index < source.length; index += 1) {
    const char = source[index];
    const previous = source[index - 1];

    if (quote) {
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (quote === '`' && char === '$' && source[index + 1] === '{') {
        templateExpressionDepth += 1;
        index += 1;
        continue;
      }
      if (quote === '`' && templateExpressionDepth > 0) {
        if (char === '{') templateExpressionDepth += 1;
        if (char === '}') templateExpressionDepth -= 1;
        continue;
      }
      if (char === quote && previous !== '\\') quote = null;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function extractSpawnSyncCalls(source) {
  const calls = [];
  const needle = 'spawnSync(';
  let start = source.indexOf(needle);

  while (start !== -1) {
    const openParenIndex = start + 'spawnSync'.length;
    const closeParenIndex = findMatchingParen(source, openParenIndex);
    if (closeParenIndex === -1) break;
    calls.push(source.slice(start, closeParenIndex + 1));
    start = source.indexOf(needle, closeParenIndex + 1);
  }

  return calls;
}

function isProcessNodeEvalSpawn(callSource) {
  return /spawnSync\(\s*process\.execPath\s*,\s*\[\s*['"]-e['"]/.test(callSource);
}

function hasRepoRootCwd(callSource) {
  return /cwd:\s*repoRoot/.test(callSource);
}

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

test('content node eval spawns pin cwd to repo root', () => {
  const contentTestFiles = fs
    .readdirSync(path.join(repoRoot, 'tests'))
    .filter((fileName) => /^content-.*\.test\.js$/.test(fileName))
    .sort();
  const missingCwd = [];

  for (const fileName of contentTestFiles) {
    const relativePath = `tests/${fileName}`;
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    const nodeEvalSpawns = extractSpawnSyncCalls(source).filter(isProcessNodeEvalSpawn);

    for (const callSource of nodeEvalSpawns) {
      if (!hasRepoRootCwd(callSource)) missingCwd.push(relativePath);
    }
  }

  assert.deepEqual(
    [...new Set(missingCwd)],
    [],
    `content node -e spawnSync calls must set cwd: repoRoot: ${[...new Set(missingCwd)].join(
      ', ',
    )}`,
  );
});

test('content node eval spawn guard rejects missing cwd fixture', () => {
  const fixture = `
test('fixture', () => {
  spawnSync(
    process.execPath,
    [
      '-e',
      'require("./scripts/validate-content.js")',
    ],
    { encoding: 'utf8' },
  );
});
`;
  const offendingCalls = extractSpawnSyncCalls(fixture)
    .filter(isProcessNodeEvalSpawn)
    .filter((callSource) => !hasRepoRootCwd(callSource));

  assert.equal(offendingCalls.length, 1);
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
