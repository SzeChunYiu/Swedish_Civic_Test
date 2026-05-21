const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  collectExportQuestionBankExecFileSyncCalls,
  collectValidateContentExecFileSyncCalls,
  sourceLineNumberForIndex,
  summarizePinnedCwdCalls,
} = require('../scripts/content-exec-cwd-guards');

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

test('export-question-bank exec cwd guard is source-scanned without running validate-content', () => {
  const exportParitySource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-export-parity.test.js'),
    'utf8',
  );
  const calls = collectExportQuestionBankExecFileSyncCalls(exportParitySource);
  const summary = summarizePinnedCwdCalls(calls);

  assert.deepEqual(summary, {
    total: 1,
    pinned: 1,
    parity: true,
  });
});

test('export-question-bank exec cwd guard rejects ambient cwd mutations', () => {
  const exportParitySource = fs.readFileSync(
    path.join(repoRoot, 'tests/content-export-parity.test.js'),
    'utf8',
  );
  const mutatedSource = exportParitySource.replace(/\n\s*cwd:\s*repoRoot,\n/, '\n');
  const calls = collectExportQuestionBankExecFileSyncCalls(mutatedSource);
  const summary = summarizePinnedCwdCalls(calls);

  assert.deepEqual(summary, {
    total: 1,
    pinned: 0,
    parity: false,
  });
  assert.equal(sourceLineNumberForIndex(mutatedSource, calls[0].index), 9);
});

test('validate-content exec cwd guard is source-scanned without running validate-content', () => {
  let total = 0;
  let pinned = 0;
  const unpinnedCalls = [];

  for (const fileName of contentTestFiles()) {
    const source = fs.readFileSync(path.join(repoRoot, fileName), 'utf8');
    const calls = collectValidateContentExecFileSyncCalls(source);
    const summary = summarizePinnedCwdCalls(calls);
    total += summary.total;
    pinned += summary.pinned;

    calls.forEach((call) => {
      if (!call.hasPinnedCwd) {
        unpinnedCalls.push(`${fileName}:${sourceLineNumberForIndex(source, call.index)}`);
      }
    });
  }

  assert.ok(total >= 70, 'content suite should contain broad direct validate-content exec guards');
  assert.equal(pinned, total, `unpinned validate-content exec calls: ${unpinnedCalls.join(', ')}`);
});

test('validate-content exec cwd guard rejects ambient cwd mutations', () => {
  const validateScript = 'scripts/' + 'validate-content.js';
  const mutatedSource = `
const output = execFileSync(process.execPath, ['${validateScript}'], {
  encoding: 'utf8',
});
`;
  const calls = collectValidateContentExecFileSyncCalls(mutatedSource);
  const summary = summarizePinnedCwdCalls(calls);

  assert.deepEqual(summary, {
    total: 1,
    pinned: 0,
    parity: false,
  });
  assert.equal(sourceLineNumberForIndex(mutatedSource, calls[0].index), 2);
});

test('validate-content focus reports direct exec cwd guard summary', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-content-exec-cwd'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const match = result.stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused validator should print JSON summary');
  const summary = JSON.parse(match[0]);

  assert.ok(summary.contentTestValidateContentExecCallsValidated >= 70);
  assert.equal(
    summary.contentTestValidateContentExecCwdPinnedValidated,
    summary.contentTestValidateContentExecCallsValidated,
  );
  assert.equal(summary.contentTestValidateContentExecCwdParityValidated, true);
});

test('test:content script includes every content test file exactly once', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const testContentScript = packageJson.scripts?.['test:content'];

  assert.equal(typeof testContentScript, 'string');

  const expectedContentTestFiles = contentTestFiles();
  assert.ok(
    expectedContentTestFiles.includes('tests/content-legal-section-rendering.test.js'),
    'content file discovery should include the LegalSection rendering suite',
  );
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
