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

test('UHR section-map chapter metadata stays in parity with data chapters', () => {
  const summary = readValidationSummary();

  assert.equal(summary.uhrMapChapterMetadataParityValidated, 13);
  assert.equal(summary.uhrMapChapterMetadataParityValidated, summary.uhrMapChaptersValidated);
});

test('UHR section-map chapter metadata parity rejects id and title drift', () => {
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
    map.chapters[0].id = 'ch01-disabled';
    map.chapters[0].chapter = 'Landet Sverige disabled';
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
  assert.match(output, /ch01-disabled id does not match data chapter id ch01/);
  assert.match(output, /ch01-disabled title does not match data chapter name "Landet Sverige"/);
});

test('UHR section-map chapter metadata parity rejects missing chapter rows', () => {
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
    map.chapters.pop();
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
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /UHR section map expected 13 chapters, found 12/,
  );
});

test('UHR section-map chapter metadata parity rejects extra chapter rows', () => {
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
    map.chapters.push({
      id: 'ch14',
      chapter: 'Extra UHR chapter',
      startPage: 48,
      endPage: 49,
      sections: ['Extra section'],
    });
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
  assert.match(output, /UHR section map expected 13 chapters, found 14/);
  assert.match(output, /ch14 is missing data chapter metadata/);
});
