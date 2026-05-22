const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('quiz empty-state title remains a localized header when route is empty or unknown', () => {
  const source = read('app/quiz/[sessionId].tsx');
  assert.match(
    source,
    /<Text\s+accessibilityRole="header"\s+style=\{styles\.title\}>[\s\S]{0,160}copy\.emptyTitle[\s\S]{0,160}<\/Text>/,
  );

  const result = spawnSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(
    result.status,
    0,
    'content validation should pass when the empty-title header stays wired',
  );
  assert.doesNotMatch(output, /quiz route missing empty quiz title as a title header/);
});
