const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function loadProgressStoreWithStubs() {
  const originalResolve = Module._resolveFilename;
  const originalLoad = Module._load;
  const originalTsLoader = require.extensions['.ts'];
  const stubs = {
    'react-native-mmkv': { createMMKV: () => null },
    zustand: {
      create: (factory) => {
        const set = (partial) =>
          Object.assign(state, typeof partial === 'function' ? partial(state) : partial);
        const get = () => state;
        const state = factory(set, get);
        return () => state;
      },
    },
  };

  Module._resolveFilename = function patchedResolve(request, ...args) {
    if (Object.prototype.hasOwnProperty.call(stubs, request)) return `__stub__:${request}`;
    return originalResolve.call(this, request, ...args);
  };
  Module._load = function patchedLoad(request, ...args) {
    if (Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
    return originalLoad.call(this, request, ...args);
  };
  require.extensions['.ts'] = function tsLoader(module, filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const transpiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      fileName: filename,
    }).outputText;
    module._compile(transpiled, filename);
  };

  try {
    const progressStorePath = path.join(repoRoot, 'lib/storage/progressStore.ts');
    delete require.cache[progressStorePath];
    return require(progressStorePath);
  } finally {
    Module._resolveFilename = originalResolve;
    Module._load = originalLoad;
    require.extensions['.ts'] = originalTsLoader;
  }
}

test('progress question schema stays in parity with persisted progress records', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');

  const summary = JSON.parse(match[0]);
  const progressTypes = fs.readFileSync(path.join(repoRoot, 'types/progress.ts'), 'utf8');
  const progressStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/progressStore.ts'),
    'utf8',
  );

  assert.equal(summary.progressQuestionFieldsValidated, 8);
  assert.equal(summary.progressQuestionSchemaParityValidated, true);
  assert.equal(summary.progressTypeUnionsValidated, 2);
  assert.equal(summary.progressTypeInterfacesValidated, 4);
  assert.equal(summary.progressTypeSchemaParityValidated, true);
  assert.equal(summary.progressStoreFieldsValidated, 8);
  assert.equal(summary.progressStoreSchemaParityValidated, true);
  assert.match(progressTypes, /export interface UserQuestionProgress/);
  assert.match(
    progressTypes,
    /export type QuizMode = 'study' \| 'exam' \| 'mistakes' \| 'challenge';/,
  );
  assert.match(progressTypes, /export interface QuizSession/);
  assert.match(progressTypes, /questionProgress: Record<string, UserQuestionProgress>;/);
  assert.match(progressStore, /export type QuestionProgress = \{/);
  assert.match(progressStore, /type ProgressState = PersistedProgress & \{/);
  assert.match(progressStore, /questionProgress: Record<string, QuestionProgress>;/);
  assert.match(progressStore, /completedQuestionIds: string\[\];/);
  assert.match(
    progressStore,
    /progressStorage\?\.set\(progressStateKey, JSON\.stringify\(normalizedProgress\)\);/,
  );
  assert.match(progressStore, /function normalizeNonNegativeInteger/);
  assert.match(progressStore, /questionProgress\[questionId\] = normalizeQuestionProgress/);
  assert.match(progressStore, /normalizeMockExamProgress\(session as Partial<MockExamProgress>\)/);
});

test('progress store normalizes corrupt persisted numeric counters', () => {
  const { __progressStoreTestHooks } = loadProgressStoreWithStubs();
  const normalized = __progressStoreTestHooks.normalizeProgress({
    completedQuestionIds: ['q1', 7, 'q2'],
    questionProgress: {
      q1: {
        seenCount: Number.POSITIVE_INFINITY,
        correctCount: Number.NaN,
        wrongCount: -3,
        correctStreak: 2.8,
        bookmarked: 'yes',
      },
      q2: {
        seenCount: 3.8,
        correctCount: 9,
        wrongCount: 4,
        correctStreak: 8,
        lastAnsweredAt: '2026-05-19T10:00:00.000Z',
      },
      q3: {
        seenCount: 5,
        correctCount: 2,
        wrongCount: 4,
        correctStreak: 3,
      },
    },
    totalXp: Number.POSITIVE_INFINITY,
    answerDates: ['2026-05-19', 42, '2026-05-19'],
    mockExamSessions: [
      {
        sessionId: 'm1',
        score: Number.POSITIVE_INFINITY,
        completedAt: '2026-05-19T11:00:00.000Z',
        correctCount: 4.9,
        totalCount: 3.2,
      },
      {
        sessionId: 'm2',
        score: 0.8,
        completedAt: '2026-05-19T12:00:00.000Z',
        correctCount: 2,
        totalCount: Number.NaN,
      },
      {
        sessionId: 'bad',
        score: 0.9,
        correctCount: 1,
        totalCount: 1,
      },
    ],
    streakFreezeState: {
      available: Number.POSITIVE_INFINITY,
      lastEarnedAt: 17,
      lifetimeEarned: 2.8,
      lifetimeSpent: 9,
      rescuedDayKeys: ['2026-05-18', 7, '2026-05-18'],
    },
  });

  assert.deepEqual(normalized.completedQuestionIds, ['q1', 'q2']);
  assert.deepEqual(normalized.answerDates, ['2026-05-19']);
  assert.equal(normalized.totalXp, 0);
  assert.deepEqual(normalized.questionProgress.q1, {
    questionId: 'q1',
    seenCount: 0,
    correctCount: 0,
    wrongCount: 0,
    correctStreak: 0,
    lastAnsweredAt: undefined,
    nextReviewAt: undefined,
    bookmarked: undefined,
  });
  assert.equal(normalized.questionProgress.q2.seenCount, 3);
  assert.equal(normalized.questionProgress.q2.correctCount, 3);
  assert.equal(normalized.questionProgress.q2.wrongCount, 0);
  assert.equal(normalized.questionProgress.q2.correctStreak, 3);
  assert.equal(normalized.questionProgress.q3.seenCount, 5);
  assert.equal(normalized.questionProgress.q3.correctCount, 2);
  assert.equal(normalized.questionProgress.q3.wrongCount, 3);
  assert.equal(normalized.questionProgress.q3.correctStreak, 2);
  assert.deepEqual(normalized.mockExamSessions, [
    {
      sessionId: 'm1',
      score: 0,
      completedAt: '2026-05-19T11:00:00.000Z',
      correctCount: 3,
      totalCount: 3,
    },
    {
      sessionId: 'm2',
      score: 0.8,
      completedAt: '2026-05-19T12:00:00.000Z',
      correctCount: 0,
      totalCount: 0,
    },
  ]);
  assert.equal(normalized.streakFreezeState.available, 0);
  assert.match(normalized.streakFreezeState.lastEarnedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(normalized.streakFreezeState.lifetimeEarned, 2);
  assert.equal(normalized.streakFreezeState.lifetimeSpent, 2);
  assert.deepEqual(normalized.streakFreezeState.rescuedDayKeys, ['2026-05-18']);
});

test('progress type schema parity rejects session optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/types/progress.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('score?: number;', 'score: number;');
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
    /types\/progress\.ts QuizSession\.score optional=false, expected true/,
  );
});

test('progress store schema parity rejects persisted field optionality drift', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/lib/storage/progressStore.ts')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('answerDates: string[];', 'answerDates?: string[];');
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
    /ProgressState\.answerDates optional=true, expected false/,
  );
});
