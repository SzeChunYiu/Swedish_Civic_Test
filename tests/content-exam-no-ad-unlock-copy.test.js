const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('exam route copy validator reflects no ad unlocks on the exam screen', () => {
  const examSource = read('app/(tabs)/exam.tsx');
  assert.match(examSource, /Extra prov låses inte upp på provskärmen/);
  assert.match(examSource, /Extra exams are not unlocked on the exam screen/);

  const result = spawnSync(process.execPath, ['scripts/validate-content.js'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assert.equal(result.status, 0, `content validation should pass: ${output}`);
  assert.doesNotMatch(output, /exam route is missing sv copy "Lås upp extra prov"/);
  assert.doesNotMatch(output, /exam route is missing en copy "Unlock extra exam"/);
});
