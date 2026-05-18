const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const test = require('node:test');

test('question bank export stays in parity with generated questions', () => {
  const output = execFileSync(process.execPath, ['scripts/export-question-bank.js', '--check'], {
    encoding: 'utf8',
  });
  assert.match(output, /Question bank export parity OK \(520 questions\)/);
});
