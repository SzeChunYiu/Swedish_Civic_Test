const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('routed quiz titles stay exposed as accessibility headers', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/quiz/[sessionId].tsx'), 'utf8');

  assert.equal(summary.quizRouteHeadersValidated, 2);
  assert.equal(summary.quizRouteHeaderParityValidated, true);
  assert.doesNotMatch(source, /<Text style=\{styles\.title\}>/);
  assert.match(source, /\{copy\.emptyTitle\}/);
  assert.match(source, /\{copy\.sessionTitle\(normalizedSessionId\)\}/);
  assert.equal(
    source.match(/<Text accessibilityRole="header" style=\{styles\.title\}>/g)?.length,
    2,
  );
});

test('quiz route header parity rejects dropped title header roles', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/quiz/[sessionId].tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<Text accessibilityRole="header" style={styles.title}>\\n          {copy.sessionTitle(normalizedSessionId)}\\n        </Text>',
        '<Text style={styles.title}>{copy.sessionTitle(normalizedSessionId)}</Text>'
      );
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /quiz route title text must expose accessibilityRole="header"/,
  );
});
