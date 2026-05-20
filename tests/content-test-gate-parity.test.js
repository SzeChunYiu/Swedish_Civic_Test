const assert = require('node:assert/strict');
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

test('content node eval spawns pin cwd to repo root', () => {
  const missingCwd = [];

  for (const relativePath of contentTestFiles()) {
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
    "validate-content.js'], {\n  encoding: 'utf8',\n});";
  const safeSource =
    "const output = execFileSync(process.execPath, ['scripts/" +
    "validate-content.js'], {\n  cwd: repoRoot,\n  encoding: 'utf8',\n});";

  assert.deepEqual(collectValidateContentExecFileSyncCalls(unsafeSource), [
    { index: 15, hasPinnedCwd: false },
  ]);
  assert.deepEqual(collectValidateContentExecFileSyncCalls(safeSource), [
    { index: 15, hasPinnedCwd: true },
  ]);
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
