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

function readValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
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

test('validate:content reports node eval spawns pinned to repoRoot cwd', () => {
  const summary = readValidationSummary();

  assert.ok(summary.contentTestNodeEvalSpawnCallsValidated > 0);
  assert.equal(
    summary.contentTestNodeEvalSpawnCwdCallsValidated,
    summary.contentTestNodeEvalSpawnCallsValidated,
  );
  assert.equal(summary.contentTestNodeEvalSpawnCwdParityValidated, true);
});

test('validate:content rejects content node eval spawns without repoRoot cwd', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/tests/content-question-exact-schema-keys.test.js')) {
    const source = String(contents);
    const needle = "{ cwd: repoRoot, encoding: 'utf8' }";
    const index = source.lastIndexOf(needle);
    return index === -1
      ? source
      : source.slice(0, index) + "{ encoding: 'utf8' }" + source.slice(index + needle.length);
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /tests\/content-question-exact-schema-keys\.test\.js node eval spawnSync at line \d+ must set cwd: repoRoot/,
  );
});
