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
  function localRequire(request) {
    if (request.startsWith('.')) {
      const resolved = path.join(path.dirname(path.join(repoRoot, relativePath)), request);
      const normalized = path.relative(repoRoot, resolved).replace(/\.ts$/, '') + '.ts';
      return loadTs(normalized);
    }
    return require(request);
  }
  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return mod.exports;
}

test('streak runtime parity validates daily habit rules', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const { calculateStreak } = loadTs('lib/learning/streaks.ts');
  const today = '2026-05-15';

  assert.equal(summary.streakRulesValidated, 6);
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
});

test('streak freeze state is persisted separately from XP and answer counts', () => {
  const progressStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/progressStore.ts'),
    'utf8',
  );
  const { calculateStreakWithFreeze, createInitialFreezeState, freezeBannerCopy } = loadTs(
    'lib/learning/streakWithFreeze.ts',
  );
  const now = new Date('2026-05-19T12:00:00.000Z');
  const result = calculateStreakWithFreeze({
    activeDayKeys: ['2026-05-15', '2026-05-16', '2026-05-18', '2026-05-19'],
    freezeState: createInitialFreezeState(now),
    today: '2026-05-19',
    now,
  });

  assert.equal(result.streakDays, 5);
  assert.deepEqual(result.rescuedThisRun, ['2026-05-17']);
  assert.match(freezeBannerCopy(result, 'sv'), /Sviten är räddad/);
  assert.match(freezeBannerCopy(result, 'en'), /Streak protected/);
  assert.match(progressStore, /streakFreezeState: StreakFreezeState;/);
  assert.match(
    progressStore,
    /setStreakFreezeState: \(streakFreezeState: StreakFreezeState\) => void;/,
  );
  assert.match(progressStore, /streakFreezeState,/);
  assert.match(progressStore, /totalXp: state\.totalXp,/);
  assert.match(progressStore, /answerDates: state\.answerDates,/);
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
      'const uniqueDays = new Set(days.map((day) => day.slice(0, 10)));',
      'const uniqueDays = new Set(days);',
    );
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
    /streak rule consecutive answer days through today returned 2, expected 3/,
  );
});
