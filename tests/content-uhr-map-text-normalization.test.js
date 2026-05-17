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

test('UHR section-map source, chapter, and section text is normalized', () => {
  const summary = readValidationSummary();

  assert.equal(summary.uhrMapTextFieldsNormalizedValidated, 140);
  assert.equal(
    summary.uhrMapTextFieldsNormalizedValidated,
    4 + summary.uhrMapChaptersValidated * 2 + summary.uhrMapSectionsValidated,
  );
});

test('UHR section-map text normalization rejects whitespace drift', () => {
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
    map.source.title = \` \${map.source.title}\`;
    map.chapters[0].chapter = map.chapters[0].chapter.replace('Landet Sverige', 'Landet  Sverige');
    map.chapters[0].sections[0] = map.chapters[0].sections[0].replace('Geografi, klimat', 'Geografi,  klimat');
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
  assert.match(output, /UHR section map source title must be trimmed and single-spaced/);
  assert.match(output, /ch01 chapter title must be trimmed and single-spaced/);
  assert.match(output, /ch01 section\[0\] must be trimmed and single-spaced/);
});
