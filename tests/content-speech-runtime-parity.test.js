const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary(output) {
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('speech runtime parity validates Swedish TTS language and stop handling', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-speech-runtime-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const summary = parseValidationSummary(output);

  assert.equal(summary.speechRuntimeCasesValidated, 10);
  assert.equal(summary.speechRuntimeParityValidated, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(summary, 'audioButtonAccessibilityParityValidated'),
    false,
  );
});

test('speech runtime parity rejects language drift away from Swedish', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/audio/speak.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("language: 'sv-SE'", "language: 'en-US'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-speech-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /speakSwedish must request sv-SE speech for non-empty text/,
  );
});

test('speech runtime parity rejects missing synchronous onError cleanup callback', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/audio/speak.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        "    const onError = getSpeechCallback<'onError'>(options.onError);\\n" +
          "    onError?.(error instanceof Error ? error : new Error(String(error)));\\n",
        "",
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
process.argv.push('--focus-speech-runtime-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /speakSwedish must call onError once when Speech\.speak throws synchronously/,
  );
});
