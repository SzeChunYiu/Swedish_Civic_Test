const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('UHR source metadata schema validates a current retrieval date', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const uhrSectionMap = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'content/uhr-section-map.json'), 'utf8'),
  );

  assert.equal(summary.uhrSourceMetadataValidated, true);
  assert.equal(summary.uhrSourceRetrievedDateValidated, true);
  assert.match(uhrSectionMap.source.retrievedDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(new Date(`${uhrSectionMap.source.retrievedDate}T00:00:00Z`) <= new Date());
});

test('UHR source metadata schema rejects future retrieval dates', () => {
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
    return String(contents).replace('"retrievedDate": "2026-05-15"', '"retrievedDate": "2999-01-01"');
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
    /UHR section map source retrievedDate must not be in the future/,
  );
});

test('UHR source metadata schema rejects non-ISO retrieval dates', () => {
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
    return String(contents).replace('"retrievedDate": "2026-05-15"', '"retrievedDate": "15 May 2026"');
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
    /UHR section map source retrievedDate must use YYYY-MM-DD/,
  );
});
