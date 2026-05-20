const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const test = require('node:test');

function parseValidationSummary(output) {
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('speech runtime parity validates Swedish TTS language and stop handling', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const summary = parseValidationSummary(output);

  assert.equal(summary.speechRuntimeCasesValidated, 4);
  assert.equal(summary.speechRuntimeParityValidated, true);
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
require('./scripts/validate-content.js');
`,
    ],
    { cwd: process.cwd(), encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /speakSwedish must request sv-SE speech for non-empty text/,
  );
});
