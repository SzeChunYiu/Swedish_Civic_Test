const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(relativePath) {
  const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, require);
  return mod.exports;
}

test('streak runtime parity validates daily habit rules', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-streak-rules'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const { calculateStreak, getLocalDateKey } = loadTs('lib/learning/streaks.ts');
  const today = '2026-05-15';

  assert.equal(summary.streakRulesValidated, 17);
  assert.equal(summary.streakRulesParityValidated, true);
  assert.equal(calculateStreak([], today), 0);
  assert.equal(calculateStreak(['2026-05-13T09:00:00.000Z', '2026-05-14', '2026-05-15'], today), 3);
  assert.equal(
    calculateStreak(['2026-05-14', '2026-05-15T08:00:00.000Z', '2026-05-15T20:00:00.000Z'], today),
    2,
  );
  assert.equal(calculateStreak(['2026-05-13', '2026-05-14'], today), 2);
  assert.equal(calculateStreak(['2026-05-12', '2026-05-13', '2026-05-15'], today), 1);
  assert.equal(calculateStreak(['2026-05-16'], today), 0);
  assert.equal(calculateStreak(['2026-05-14', 42, 'not-a-date', '2026-05-15'], today), 2);
  assert.equal(calculateStreak(['2026-05-14', '2026-05-15'], 'not-a-date'), 0);
  assert.match(getLocalDateKey(new Date(Number.NaN)), /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(getLocalDateKey(new Date(Number.NaN)), 'NaN-NaN-NaN');
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'xpRulesParityValidated'), false);
});

test('streak runtime parity rejects timestamp date-key normalization drift', () => {
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
  if (normalizedPath.endsWith('/lib/learning/streaks.ts')) {
    return String(contents).replace(
      'const dateKey = value.slice(0, 10);',
      'const dateKey = value;',
    );
  }
  return contents;
};
process.argv.push('--focus-streak-rules');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /streak rule consecutive answer days through today returned 2, expected 3/,
  );
});
