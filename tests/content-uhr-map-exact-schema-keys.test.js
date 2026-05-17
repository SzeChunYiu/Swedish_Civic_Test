const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function readValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('UHR section map records keep exact runtime schema keys', () => {
  const summary = readValidationSummary();

  assert.equal(summary.uhrMapSourceExactSchemaKeysValidated, true);
  assert.equal(summary.uhrMapChapterExactSchemaKeysValidated, 13);
  assert.equal(summary.uhrMapChapterExactSchemaKeysValidated, summary.uhrMapChaptersValidated);
});

test('UHR section map exact schema rejects internal field leakage', () => {
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
  if (normalizedPath.endsWith('/content/uhr-section-map.json')) {
    const map = JSON.parse(String(contents));
    map.source.editorNote = 'internal source note';
    map.chapters[0].sourceLine = 'internal chapter note';
    return JSON.stringify(map);
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(
    output,
    /UHR section map source\.editorNote is not part of UHRSectionMapSource schema/,
  );
  assert.match(output, /ch01\.sourceLine is not part of UHRSectionMapChapter schema/);
});
