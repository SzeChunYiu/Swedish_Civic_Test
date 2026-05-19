const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

test('question bank export stays in parity with generated questions', () => {
  const output = execFileSync(process.execPath, ['scripts/export-question-bank.js', '--check'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const match = output.match(/Question bank export parity OK \((\d+) questions\)/);
  assert.ok(match, 'export parity should report the generated question count');
  assert.ok(Number(match[1]) >= 720);
});
