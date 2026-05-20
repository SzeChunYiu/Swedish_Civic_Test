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

function loadProgressStoreFromProgressStorage(
  progressStorage,
  readPersistedProgress = () => undefined,
) {
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
        createMMKV: () => progressStorage,
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
          useStore.setState = (partial) => setState(partial);
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
    const { importProgressSnapshot, useProgressStore } = require(progressStorePath);
    return {
      importProgressSnapshot,
      useProgressStore,
      readPersistedProgress,
    };
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

function loadProgressStoreFromStorage(progress) {
  let persistedProgressJson = JSON.stringify(progress);

  return loadProgressStoreFromProgressStorage(
    {
      getString: (key) => (key === 'progressState' ? persistedProgressJson : undefined),
      set: (key, value) => {
        if (key === 'progressState') persistedProgressJson = String(value);
      },
    },
    () => JSON.parse(persistedProgressJson),
  );
}

function loadProgressFromProgressStorage(progressStorage) {
  return loadProgressStoreFromProgressStorage(progressStorage).useProgressStore.getState();
}

function loadProgressFromStorage(progress) {
  return loadProgressFromProgressStorage({
    getString: (key) => (key === 'progressState' ? JSON.stringify(progress) : undefined),
    set: () => {},
  });
}

function progressSnapshot(state) {
  return {
    completedQuestionIds: state.completedQuestionIds,
    questionProgress: state.questionProgress,
    totalXp: state.totalXp,
    answerDates: state.answerDates,
    mockExamSessions: state.mockExamSessions,
    streakFreezeState: state.streakFreezeState,
  };
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
  assert.match(progressStore, /export type MockExamAnswerProgress = \{/);
  assert.match(progressStore, /export type MockExamProgress = \{/);
  assert.match(progressStore, /answers: MockExamAnswerProgress\[\];/);
  assert.match(progressStore, /type ProgressState = PersistedProgress & \{/);
  assert.match(progressStore, /questionProgress: Record<string, QuestionProgress>;/);
  assert.match(progressStore, /completedQuestionIds: string\[\];/);
  assert.match(progressStore, /mockExamSessions: MockExamProgress\[\];/);
  assert.match(progressStore, /streakFreezeState: StreakFreezeState;/);
  assert.match(progressStore, /function normalizeNonNegativeInteger\(value: unknown/);
  assert.match(progressStore, /const seenCount = normalizeNonNegativeInteger/);
  assert.match(progressStore, /function normalizeMockExamAnswers\(value: unknown/);
  assert.match(
    progressStore,
    /const normalizedAnswers = normalizeMockExamAnswers\(item\.answers\);/,
  );
  assert.match(
    progressStore,
    /const normalizedAnswers = normalizeMockExamAnswers\(session\.answers\);/,
  );
  assert.match(progressStore, /totalXp: normalizeNonNegativeInteger/);
  assert.doesNotMatch(progressStore, /Math\.max\(0, item\.seenCount \?\? 0\)/);
  assert.match(progressStore, /recordMockExamSession: \(session: MockExamProgressInput\) => void;/);
  assert.match(progressStore, /calculateAnswerXp, calculateQuizCompletionXp/);
  assert.match(progressStore, /const existingSession = state\.mockExamSessions\.find/);
  assert.match(progressStore, /const completionXp = existingSession/);
  assert.match(progressStore, /totalXp: state\.totalXp \+ completionXp,/);
  assert.match(progressStore, /if \(typeof isCorrect !== 'boolean'\) return state;/);
  assert.match(
    progressStore,
    /setStreakFreezeState: \(streakFreezeState: StreakFreezeState\) => void;/,
  );
  assert.match(
    progressStore,
    /function writeProgress\(progress: PersistedProgress\): PersistedProgress/,
  );
  assert.match(progressStore, /const serializedProgress = JSON\.stringify\(progress\);/);
  assert.match(progressStore, /progressStorage\?\.set\(progressStateKey, serializedProgress\);/);
  assert.match(progressStore, /return normalizeProgress\(JSON\.parse\(serializedProgress\)\);/);
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
        nextReviewAt: '2099-01-01T00:00:00.000Z',
        bookmarked: 'yes',
      },
      q002: {
        seenCount: 5,
        correctCount: 9,
        wrongCount: 8,
        correctStreak: 3,
        lastAnsweredAt: '2026-05-19T10:00:00.000Z',
        nextReviewAt: '2026-05-20T10:00:00.000Z',
        bookmarked: true,
      },
      q003: {
        seenCount: 1,
        correctCount: 0,
        wrongCount: 1,
        correctStreak: 0,
        bookmarked: false,
      },
    },
    totalXp: 'huge',
    answerDates: ['2026-05-19', 7, 'not-a-date', '2026-02-30', '2099-01-01', '2026-05-19'],
    mockExamSessions: [
      {
        sessionId: 'm1',
        score: 2,
        completedAt: '2026-05-19T10:00:00.000Z',
        correctCount: 999999999,
        totalCount: 1000,
        answers: [
          { questionId: 'q001', isCorrect: true, timeSpentSeconds: 10 },
          { questionId: 'q002', isCorrect: false, timeSpentSeconds: 999999 },
          { questionId: '', isCorrect: true, timeSpentSeconds: 3 },
          { questionId: 'q003', isCorrect: 'yes', timeSpentSeconds: 3 },
        ],
      },
      {
        sessionId: 'm2',
        score: 'bad',
        completedAt: '2026-05-19T11:00:00.000Z',
        correctCount: 3.5,
        totalCount: 'bad',
      },
      {
        sessionId: 'future',
        score: 0.8,
        completedAt: '2099-01-01T00:00:00.000Z',
        correctCount: 8,
        totalCount: 10,
      },
      {
        sessionId: 'invalid',
        score: 0.8,
        completedAt: 'not-a-date',
        correctCount: 8,
        totalCount: 10,
      },
    ],
    streakFreezeState: {
      available: 999,
      lastEarnedAt: '2099-01-01',
      lifetimeEarned: 'bad',
      lifetimeSpent: 3.5,
      rescuedDayKeys: ['2026-05-18', 7, 'not-a-date', '2099-01-01', '2026-05-18'],
    },
  });

  assert.deepEqual(state.completedQuestionIds, ['q001', 'q002']);
  assert.equal(state.questionProgress.q001.seenCount, 0);
  assert.equal(state.questionProgress.q001.correctCount, 0);
  assert.equal(state.questionProgress.q001.wrongCount, 0);
  assert.equal(state.questionProgress.q001.correctStreak, 0);
  assert.equal(Object.hasOwn(state.questionProgress.q001, 'lastAnsweredAt'), false);
  assert.equal(Object.hasOwn(state.questionProgress.q001, 'nextReviewAt'), false);
  assert.equal(state.questionProgress.q002.seenCount, 5);
  assert.equal(state.questionProgress.q002.correctCount, 5);
  assert.equal(state.questionProgress.q002.wrongCount, 0);
  assert.equal(state.questionProgress.q002.correctStreak, 3);
  assert.equal(state.questionProgress.q002.lastAnsweredAt, '2026-05-19T10:00:00.000Z');
  assert.equal(state.questionProgress.q002.nextReviewAt, '2026-05-20T10:00:00.000Z');
  assert.equal(Object.hasOwn(state.questionProgress.q001, 'bookmarked'), false);
  assert.equal(state.questionProgress.q002.bookmarked, true);
  assert.equal(state.questionProgress.q003.bookmarked, false);
  assert.equal(state.totalXp, 0);
  assert.deepEqual(state.answerDates, ['2026-05-19']);
  assert.equal(state.mockExamSessions.length, 2);
  assert.equal(state.mockExamSessions[0].score, 1);
  assert.equal(state.mockExamSessions[0].correctCount, 720);
  assert.equal(state.mockExamSessions[0].totalCount, 720);
  assert.deepEqual(state.mockExamSessions[0].answers, [
    { questionId: 'q001', isCorrect: true, timeSpentSeconds: 10 },
    { questionId: 'q002', isCorrect: false, timeSpentSeconds: 43200 },
  ]);
  assert.equal(state.mockExamSessions[1].score, 0);
  assert.equal(state.mockExamSessions[1].correctCount, 0);
  assert.equal(state.mockExamSessions[1].totalCount, 0);
  assert.deepEqual(state.mockExamSessions[1].answers, []);
  assert.equal(state.streakFreezeState.available, 4);
  assert.match(state.streakFreezeState.lastEarnedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(state.streakFreezeState.lastEarnedAt, '2099-01-01');
  assert.equal(state.streakFreezeState.lifetimeEarned, 1);
  assert.equal(state.streakFreezeState.lifetimeSpent, 0);
  assert.deepEqual(state.streakFreezeState.rescuedDayKeys, ['2026-05-18']);
});

test('progress mutations return the same shape as persisted JSON readback', () => {
  const { useProgressStore, readPersistedProgress } = loadProgressStoreFromStorage({
    completedQuestionIds: [],
    questionProgress: {
      q001: {
        questionId: 'q001',
        seenCount: 0,
        correctCount: 0,
        wrongCount: 0,
        correctStreak: 0,
      },
    },
    totalXp: 0,
    answerDates: [],
    mockExamSessions: [],
    streakFreezeState: {
      available: 1,
      lastEarnedAt: '2026-05-19',
      lifetimeEarned: 1,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
  });

  function assertReturnedStateMatchesReadback() {
    assert.deepEqual(
      progressSnapshot(useProgressStore.getState()),
      progressSnapshot(loadProgressFromStorage(readPersistedProgress())),
    );
  }

  assert.equal(
    Object.hasOwn(useProgressStore.getState().questionProgress.q001, 'lastAnsweredAt'),
    false,
  );
  assert.equal(
    Object.hasOwn(useProgressStore.getState().questionProgress.q001, 'nextReviewAt'),
    false,
  );

  const beforeInvalidAnswer = progressSnapshot(useProgressStore.getState());
  useProgressStore.getState().recordAnswer('q001', 'true');
  assert.deepEqual(progressSnapshot(useProgressStore.getState()), beforeInvalidAnswer);
  assertReturnedStateMatchesReadback();

  useProgressStore.getState().toggleBookmark('q001');
  assertReturnedStateMatchesReadback();
  assert.equal(useProgressStore.getState().questionProgress.q001.bookmarked, true);
  assert.equal(
    Object.hasOwn(useProgressStore.getState().questionProgress.q001, 'lastAnsweredAt'),
    false,
  );
  assert.equal(
    Object.hasOwn(useProgressStore.getState().questionProgress.q001, 'nextReviewAt'),
    false,
  );

  useProgressStore.getState().toggleBookmark('q001');
  assertReturnedStateMatchesReadback();
  assert.equal(useProgressStore.getState().questionProgress.q001.bookmarked, false);

  useProgressStore.getState().recordAnswer('q001', true);
  assertReturnedStateMatchesReadback();
  const answeredProgress = useProgressStore.getState().questionProgress.q001;
  assert.match(answeredProgress.lastAnsweredAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(answeredProgress.nextReviewAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(answeredProgress.bookmarked, false);

  useProgressStore.getState().markQuestionCompleted('q002');
  assertReturnedStateMatchesReadback();
  assert.ok(useProgressStore.getState().completedQuestionIds.includes('q002'));

  useProgressStore.getState().recordMockExamSession({
    sessionId: 'mock-1',
    score: 0.8,
    answers: [
      { questionId: 'q001', isCorrect: true, timeSpentSeconds: 12 },
      { questionId: 'q002', isCorrect: false, timeSpentSeconds: 0 },
    ],
    correctCount: 16,
    totalCount: 20,
  });
  assertReturnedStateMatchesReadback();
  assert.equal(useProgressStore.getState().mockExamSessions[0].sessionId, 'mock-1');
  assert.deepEqual(useProgressStore.getState().mockExamSessions[0].answers, [
    { questionId: 'q001', isCorrect: true, timeSpentSeconds: 12 },
    { questionId: 'q002', isCorrect: false, timeSpentSeconds: 0 },
  ]);

  useProgressStore.getState().resetProgress();
  assertReturnedStateMatchesReadback();
  assert.deepEqual(useProgressStore.getState().completedQuestionIds, []);
  assert.deepEqual(useProgressStore.getState().questionProgress, {});
});

test('progress import snapshot merges normalized local study data without replacing current progress', () => {
  const { importProgressSnapshot, readPersistedProgress, useProgressStore } =
    loadProgressStoreFromStorage({
      completedQuestionIds: ['q001'],
      questionProgress: {
        q001: {
          questionId: 'q001',
          seenCount: 1,
          correctCount: 1,
          wrongCount: 0,
          correctStreak: 1,
        },
      },
      totalXp: 20,
      answerDates: ['2026-05-18'],
      mockExamSessions: [],
      streakFreezeState: {
        available: 1,
        lastEarnedAt: '2026-05-18',
        lifetimeEarned: 1,
        lifetimeSpent: 0,
        rescuedDayKeys: ['2026-05-17'],
      },
    });

  const persisted = importProgressSnapshot({
    completedQuestionIds: ['q002'],
    questionProgress: {
      q001: {
        questionId: 'ignored',
        seenCount: 3,
        correctCount: 2,
        wrongCount: 1,
        correctStreak: 2,
        lastAnsweredAt: '2026-05-19T10:00:00.000Z',
        bookmarked: true,
      },
      q002: {
        seenCount: 1,
        correctCount: 0,
        wrongCount: 1,
        correctStreak: 0,
      },
    },
    totalXp: 50,
    answerDates: ['2026-05-19'],
    mockExamSessions: [
      {
        sessionId: 'mock-imported',
        score: 0.5,
        completedAt: '2026-05-19T12:00:00.000Z',
        correctCount: 1,
        totalCount: 2,
        answers: [
          { questionId: 'q001', isCorrect: true, timeSpentSeconds: 5 },
          { questionId: 'q002', isCorrect: false, timeSpentSeconds: 9 },
        ],
      },
    ],
    streakFreezeState: {
      available: 2,
      lastEarnedAt: '2026-05-19',
      lifetimeEarned: 2,
      lifetimeSpent: 1,
      rescuedDayKeys: ['2026-05-17', '2026-05-19'],
    },
  });

  assert.deepEqual(persisted.completedQuestionIds, ['q001', 'q002']);
  assert.equal(persisted.questionProgress.q001.seenCount, 3);
  assert.equal(persisted.questionProgress.q001.bookmarked, true);
  assert.equal(persisted.questionProgress.q002.wrongCount, 1);
  assert.equal(persisted.totalXp, 50);
  assert.deepEqual(persisted.answerDates, ['2026-05-18', '2026-05-19']);
  assert.equal(persisted.mockExamSessions[0].sessionId, 'mock-imported');
  assert.equal(persisted.streakFreezeState.available, 2);
  assert.deepEqual(persisted.streakFreezeState.rescuedDayKeys, ['2026-05-17', '2026-05-19']);
  assert.deepEqual(progressSnapshot(useProgressStore.getState()), progressSnapshot(persisted));
  assert.deepEqual(progressSnapshot(loadProgressFromStorage(readPersistedProgress())), persisted);
});

test('progress hydration falls back when MMKV reads throw', () => {
  const state = loadProgressFromProgressStorage({
    getString() {
      throw new Error('progress read failed');
    },
    set() {},
  });

  assert.deepEqual(state.completedQuestionIds, []);
  assert.deepEqual(state.questionProgress, {});
  assert.equal(state.totalXp, 0);
  assert.deepEqual(state.answerDates, []);
  assert.deepEqual(state.mockExamSessions, []);
  assert.equal(state.streakFreezeState.available, 1);
  assert.equal(state.streakFreezeState.lifetimeEarned, 1);
  assert.equal(state.streakFreezeState.lifetimeSpent, 0);
  assert.deepEqual(state.streakFreezeState.rescuedDayKeys, []);
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

test('progress store schema parity rejects raw date hydration', () => {
  const result = runValidationWithProgressStorePatch(
    'if (lastAnsweredAt) normalizedQuestionProgress.lastAnsweredAt = lastAnsweredAt;',
    'normalizedQuestionProgress.lastAnsweredAt = item.lastAnsweredAt;',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /question progress hydration must normalize and omit absent lastAnsweredAt timestamps/,
  );
});

test('progress store schema parity rejects raw bookmark hydration', () => {
  const result = runValidationWithProgressStorePatch(
    `if (typeof item.bookmarked === 'boolean') {
        normalizedQuestionProgress.bookmarked = item.bookmarked;
      }`,
    'normalizedQuestionProgress.bookmarked = item.bookmarked;',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /question progress hydration must preserve only boolean bookmark values/,
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
