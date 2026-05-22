const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');
const moduleCache = new Map();

function resolveLocalModule(fromFilePath, request) {
  const base = path.resolve(path.dirname(fromFilePath), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  const found = candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
  if (!found) throw new Error(`Cannot resolve ${request} from ${fromFilePath}`);
  return found;
}

function loadTs(relativePath) {
  const filePath = path.resolve(repoRoot, relativePath);
  if (moduleCache.has(filePath)) return moduleCache.get(filePath);

  const source = fs.readFileSync(filePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(filePath, mod.exports);

  function localRequire(request) {
    if (request.startsWith('.')) {
      const resolvedPath = resolveLocalModule(filePath, request);
      return loadTs(path.relative(repoRoot, resolvedPath));
    }
    return require(request);
  }

  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  moduleCache.set(filePath, mod.exports);
  return mod.exports;
}

function runFocusedStreakRulesWithStreaksPatch(search, replacement) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const search = ${JSON.stringify(search)};
const replacement = ${JSON.stringify(replacement)};
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/learning/streaks.ts')) {
    const source = String(contents);
    if (!source.includes(search)) {
      throw new Error('streak mutation fixture did not find target source');
    }
    return source.replace(search, replacement);
  }
  return contents;
};
process.argv.push('--focus-streak-rules');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
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
  const {
    calculateStreak,
    countAnswerAttemptsForLocalDate,
    countAnswersForLocalDate,
    getLocalDateKey,
  } = loadTs('lib/learning/streaks.ts');
  const today = '2026-05-15';
  const rolloverTarget = new Date(2026, 2, 2, 12);

  assert.equal(summary.streakRulesValidated, 21);
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
  assert.equal(
    countAnswersForLocalDate(
      {
        valid: { lastAnsweredAt: '2026-03-02T08:00:00.000Z' },
        lateValid: { lastAnsweredAt: '2026-03-02T20:00:00.000Z' },
        rollover: { lastAnsweredAt: '2026-02-30T08:00:00.000Z' },
        malformed: { lastAnsweredAt: 'not-a-date' },
        nonString: { lastAnsweredAt: 42 },
      },
      rolloverTarget,
    ),
    2,
  );
  assert.equal(
    countAnswerAttemptsForLocalDate({
      answerAttempts: [
        { questionId: 'q001', answeredAt: '2026-03-02T08:00:00.000Z' },
        { questionId: 'q001', answeredAt: '2026-03-02T20:00:00.000Z' },
        { questionId: 'q-rollover', answeredAt: '2026-02-30T08:00:00.000Z' },
        { questionId: 'q-malformed', answeredAt: 'not-a-date' },
      ],
      date: rolloverTarget,
    }),
    2,
  );
  assert.match(getLocalDateKey(new Date(Number.NaN)), /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(getLocalDateKey(new Date(Number.NaN)), 'NaN-NaN-NaN');
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'xpRulesParityValidated'), false);
});

test('streak runtime parity rejects timestamp date-key normalization drift', () => {
  const result = runFocusedStreakRulesWithStreaksPatch(
    'const dateKey = value.slice(0, 10);',
    'const dateKey = value;',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /streak rule consecutive answer days through today returned 2, expected 3/,
  );
});

test('streak runtime parity rejects invalid local date fallback drift', () => {
  const result = runFocusedStreakRulesWithStreaksPatch(
    'const safeDate = date instanceof Date && Number.isFinite(date.getTime()) ? date : new Date();',
    'const safeDate = date;',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /streak rule invalid local date fallback returned 0, expected 1/,
  );
});

test('streak runtime parity rejects malformed imported day slice crashes', () => {
  const result = runFocusedStreakRulesWithStreaksPatch(
    "if (typeof value !== 'string') return undefined;",
    "if (false && typeof value !== 'string') return undefined;",
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /streak rule malformed imported answer dates threw .*slice/,
  );
});
