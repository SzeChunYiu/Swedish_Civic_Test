const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const exportQuestionBankExecPattern =
  /execFileSync\(\s*process\.execPath\s*,\s*\[[\s\S]*?['"]scripts\/export-question-bank\.js['"][\s\S]*?\]\s*,\s*\{(?<options>[\s\S]*?)\}\s*\)/g;

function summarizeExportQuestionBankExecCwd(source) {
  const matches = [...source.matchAll(exportQuestionBankExecPattern)];
  return {
    total: matches.length,
    pinned: matches.filter((match) => /\bcwd:\s*repoRoot\b/.test(match.groups?.options || ''))
      .length,
  };
}

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

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

test('content export parity exec pins export-question-bank cwd to repo root', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'tests/content-export-parity.test.js'),
    'utf8',
  );
  const summary = summarizeExportQuestionBankExecCwd(source);

  assert.equal(summary.total, 1);
  assert.equal(summary.pinned, summary.total);
  assert.match(source, /const repoRoot = path\.resolve\(__dirname, '\.\.'\);/);
});

test('content export parity cwd guard rejects ambient export exec fixtures', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'tests/content-export-parity.test.js'),
    'utf8',
  );
  const mutated = source.replace(/\n\s+cwd:\s*repoRoot,/, '');
  const summary = summarizeExportQuestionBankExecCwd(mutated);

  assert.equal(summary.total, 1);
  assert.equal(summary.pinned, 0);
});

test('validate:content reports export-question-bank cwd parity summary', () => {
  const summary = parseValidationSummary();

  assert.equal(summary.exportQuestionBankExecCallsValidated, 1);
  assert.equal(
    summary.exportQuestionBankExecCwdPinnedValidated,
    summary.exportQuestionBankExecCallsValidated,
  );
  assert.equal(summary.exportQuestionBankExecCwdParityValidated, true);
});

test('validate:content rejects an unpinned export-question-bank exec fixture', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/tests/content-export-parity.test.js')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(/\\n\\s+cwd:\\s*repoRoot,/, '');
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
    /pins 0\/1 export-question-bank exec cwd values to repoRoot/,
  );
});
