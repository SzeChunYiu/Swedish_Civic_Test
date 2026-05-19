const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function runValidationWithProgressStorePatch(search, replacement) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const contents = originalReadFileSync.call(this, filePath, ...args);
  if (normalizedPath.endsWith('/lib/storage/progressStore.ts')) {
    return String(contents).replace(${JSON.stringify(search)}, ${JSON.stringify(replacement)});
  }
  return contents;
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

function resolveLocalTs(parentFilename, request) {
  const base = path.resolve(path.dirname(parentFilename), request);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, 'index.ts')];
  return candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
}

function loadProgressFromStorage(progress) {
  const progressStorePath = path.join(repoRoot, 'lib/storage/progressStore.ts');
  const originalResolve = Module._resolveFilename;
  const originalLoad = Module._load;
  const originalTsExtension = require.extensions['.ts'];

  Module._resolveFilename = function patchedResolve(request, parent, ...args) {
    if (request === 'react-native-mmkv' || request === 'zustand') return `__stub__:${request}`;
    if (request.startsWith('.') && parent?.filename) {
      const localTsPath = resolveLocalTs(parent.filename, request);
      if (localTsPath) return localTsPath;
    }
    return originalResolve.call(this, request, parent, ...args);
  };
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === 'react-native-mmkv') {
      return {
        createMMKV: () => ({
          getString: (key) => (key === 'progressState' ? JSON.stringify(progress) : undefined),
          set: () => {},
        }),
      };
    }

    if (request === 'zustand') {
      return {
        create: (factory) => {
          let state;
          const setState = (partial) => {
            const next = typeof partial === 'function' ? partial(state) : partial;
            if (next == null) return;
            state = { ...state, ...next };
          };
          state = factory(setState, () => state);
          const useStore = (selector) => (selector ? selector(state) : state);
          useStore.getState = () => state;
          return useStore;
        },
      };
    }

    return originalLoad.call(this, request, parent, isMain);
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
    for (const cacheKey of Object.keys(require.cache)) {
      if (cacheKey.startsWith(path.join(repoRoot, 'lib/storage'))) delete require.cache[cacheKey];
      if (cacheKey.startsWith(path.join(repoRoot, 'lib/learning'))) delete require.cache[cacheKey];
    }
    const { useProgressStore } = require(progressStorePath);
    return useProgressStore.getState();
  } finally {
    for (const cacheKey of Object.keys(require.cache)) {
      if (cacheKey.startsWith(path.join(repoRoot, 'lib/storage'))) delete require.cache[cacheKey];
      if (cacheKey.startsWith(path.join(repoRoot, 'lib/learning'))) delete require.cache[cacheKey];
    }
    Module._resolveFilename = originalResolve;
    Module._load = originalLoad;
    if (originalTsExtension) {
      require.extensions['.ts'] = originalTsExtension;
    } else {
      delete require.extensions['.ts'];
    }
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
  assert.equal(summary.progressStoreFieldsValidated, 12);
  assert.equal(summary.progressStoreSchemaParityValidated, true);
  assert.match(progressTypes, /export interface UserQuestionProgress/);
  assert.match(
    progressTypes,
    /export type QuizMode = 'study' \| 'exam' \| 'mistakes' \| 'challenge';/,
  );
  assert.match(progressTypes, /export interface QuizSession/);
  assert.match(progressTypes, /questionProgress: Record<string, UserQuestionProgress>;/);
  assert.match(progressStore, /export type QuestionProgress = \{/);
  assert.match(progressStore, /export type MockExamProgress = \{/);
  assert.match(progressStore, /type ProgressState = PersistedProgress & \{/);
  assert.match(progressStore, /questionProgress: Record<string, QuestionProgress>;/);
  assert.match(progressStore, /completedQuestionIds: string\[\];/);
  assert.match(progressStore, /mockExamSessions: MockExamProgress\[\];/);
  assert.match(progressStore, /streakFreezeState: StreakFreezeState;/);
  assert.match(progressStore, /function normalizeNonNegativeInteger\(value: unknown/);
  assert.match(progressStore, /const seenCount = normalizeNonNegativeInteger/);
  assert.match(progressStore, /totalXp: normalizeNonNegativeInteger/);
  assert.doesNotMatch(progressStore, /Math\.max\(0, item\.seenCount \?\? 0\)/);
  assert.match(progressStore, /recordMockExamSession: \(session: MockExamProgressInput\) => void;/);
  assert.match(progressStore, /calculateAnswerXp, calculateQuizCompletionXp/);
  assert.match(progressStore, /const existingSession = state\.mockExamSessions\.find/);
  assert.match(progressStore, /const completionXp = existingSession/);
  assert.match(progressStore, /totalXp: state\.totalXp \+ completionXp,/);
  assert.match(
    progressStore,
    /setStreakFreezeState: \(streakFreezeState: StreakFreezeState\) => void;/,
  );
  assert.match(
    progressStore,
    /progressStorage\?\.set\(progressStateKey, JSON\.stringify\(progress\)\);/,
  );
});

test('progress hydration normalizes unsafe persisted numeric fields', () => {
  const state = loadProgressFromStorage({
    completedQuestionIds: ['q001', 7, 'q002'],
    questionProgress: {
      q001: {
        questionId: 'wrong-id',
        seenCount: 'bad',
        correctCount: 3.6,
        wrongCount: -2,
        correctStreak: 999999999,
        lastAnsweredAt: 'not-a-date',
      },
      q002: {
        seenCount: 5,
        correctCount: 9,
        wrongCount: 8,
        correctStreak: 3,
      },
    },
    totalXp: 'huge',
    answerDates: ['2026-05-19', 7, '2026-05-19'],
    mockExamSessions: [
      {
        sessionId: 'm1',
        score: 2,
        completedAt: '2026-05-19T10:00:00.000Z',
        correctCount: 999999999,
        totalCount: 1000,
      },
      {
        sessionId: 'm2',
        score: 'bad',
        completedAt: '2026-05-19T11:00:00.000Z',
        correctCount: 3.5,
        totalCount: 'bad',
      },
    ],
    streakFreezeState: {
      available: 999,
      lastEarnedAt: 7,
      lifetimeEarned: 'bad',
      lifetimeSpent: 3.5,
      rescuedDayKeys: ['2026-05-18', 7, '2026-05-18'],
    },
  });

  assert.deepEqual(state.completedQuestionIds, ['q001', 'q002']);
  assert.equal(state.questionProgress.q001.seenCount, 0);
  assert.equal(state.questionProgress.q001.correctCount, 0);
  assert.equal(state.questionProgress.q001.wrongCount, 0);
  assert.equal(state.questionProgress.q001.correctStreak, 0);
  assert.equal(state.questionProgress.q002.seenCount, 5);
  assert.equal(state.questionProgress.q002.correctCount, 5);
  assert.equal(state.questionProgress.q002.wrongCount, 0);
  assert.equal(state.questionProgress.q002.correctStreak, 3);
  assert.equal(state.totalXp, 0);
  assert.deepEqual(state.answerDates, ['2026-05-19']);
  assert.equal(state.mockExamSessions[0].score, 1);
  assert.equal(state.mockExamSessions[0].correctCount, 720);
  assert.equal(state.mockExamSessions[0].totalCount, 720);
  assert.equal(state.mockExamSessions[1].score, 0);
  assert.equal(state.mockExamSessions[1].correctCount, 0);
  assert.equal(state.mockExamSessions[1].totalCount, 0);
  assert.equal(state.streakFreezeState.available, 4);
  assert.equal(state.streakFreezeState.lifetimeEarned, 1);
  assert.equal(state.streakFreezeState.lifetimeSpent, 0);
  assert.deepEqual(state.streakFreezeState.rescuedDayKeys, ['2026-05-18']);
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

test('progress store schema parity rejects raw numeric hydration', () => {
  const result = runValidationWithProgressStorePatch(
    'seenCount,',
    'seenCount: Math.max(0, item.seenCount ?? 0),',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /progress hydration must not use raw numeric expression Math\.max\(0, item\.seenCount \?\? 0\)/,
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
