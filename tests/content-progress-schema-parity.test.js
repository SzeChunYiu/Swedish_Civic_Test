const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

function parseValidationSummary(output) {
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

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
process.argv.push('--focus-progress-schema-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

function runFocusedExamSubmissionValidationWithRoutePatch(search, replacement) {
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
  if (normalizedPath.endsWith('/app/(tabs)/exam.tsx')) {
    return String(contents).replace(${JSON.stringify(search)}, ${JSON.stringify(replacement)});
  }
  return contents;
};
process.argv.push('--focus-exam-submission-finality-parity');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

function runFocusedStreakFreezeNormalizerValidationWithPatch(relativePath, search, replacement) {
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
  if (normalizedPath.endsWith(${JSON.stringify(`/${relativePath}`)})) {
    return String(contents).replace(${JSON.stringify(search)}, ${JSON.stringify(replacement)});
  }
  return contents;
};
process.argv.push('--focus-streak-freeze-normalizer-parity');
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
    return {
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
    answerHistory: state.answerHistory,
    dailyChallengeCompletions: state.dailyChallengeCompletions,
    mockExamSessions: state.mockExamSessions,
    streakFreezeState: state.streakFreezeState,
  };
}

test('progress question schema stays in parity with persisted progress records', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-progress-schema-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  const summary = parseValidationSummary(output);
  const progressTypes = fs.readFileSync(path.join(repoRoot, 'types/progress.ts'), 'utf8');
  const progressStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/progressStore.ts'),
    'utf8',
  );

  assert.equal(summary.progressQuestionFieldsValidated, 9);
  assert.equal(summary.progressQuestionSchemaParityValidated, true);
  assert.equal(summary.progressTypeUnionsValidated, 2);
  assert.equal(summary.progressTypeInterfacesValidated, 4);
  assert.equal(summary.progressTypeSchemaParityValidated, true);
  assert.equal(summary.progressStoreFieldsValidated, 17);
  assert.equal(summary.progressStoreSchemaParityValidated, true);
  assert.match(progressTypes, /export interface UserQuestionProgress/);
  assert.match(
    progressTypes,
    /export type QuizMode = 'study' \| 'exam' \| 'mistakes' \| 'challenge';/,
  );
  assert.match(progressTypes, /export type ConfidenceRating = 1 \| 2 \| 3 \| 4 \| 5;/);
  assert.match(progressTypes, /export interface QuizSession/);
  assert.match(progressTypes, /questionProgress: Record<string, UserQuestionProgress>;/);
  assert.match(progressStore, /export type QuestionProgress = \{/);
  assert.match(progressStore, /export type AnswerHistoryEntry = \{/);
  assert.match(progressStore, /export type MockExamProgress = \{/);
  assert.match(progressStore, /export type MockExamQuestionTiming = \{/);
  assert.match(progressStore, /focusBreaks: number;/);
  assert.match(progressStore, /questionTimings: MockExamQuestionTiming\[\];/);
  assert.match(progressStore, /type ProgressState = PersistedProgress & \{/);
  assert.match(progressStore, /questionProgress: Record<string, QuestionProgress>;/);
  assert.match(progressStore, /completedQuestionIds: string\[\];/);
  assert.match(progressStore, /answerHistory: AnswerHistoryEntry\[\];/);
  assert.match(progressStore, /mockExamSessions: MockExamProgress\[\];/);
  assert.match(progressStore, /streakFreezeState: StreakFreezeState;/);
  assert.match(progressStore, /persistenceWarning: RecoverablePersistenceWarning \| null;/);
  assert.match(progressStore, /normalizeStreakFreezeState as normalizeStoredStreakFreezeState/);
  assert.doesNotMatch(progressStore, /function normalizeStreakFreezeState\(value: unknown\)/);
  assert.match(progressStore, /function normalizeNonNegativeInteger\(value: unknown/);
  assert.match(progressStore, /function normalizeAnswerHistoryEntry\(value: unknown\)/);
  assert.match(progressStore, /const seenCount = normalizeNonNegativeInteger/);
  assert.match(progressStore, /totalXp: normalizeNonNegativeInteger/);
  assert.doesNotMatch(progressStore, /Math\.max\(0, item\.seenCount \?\? 0\)/);
  assert.match(
    progressStore,
    /recordAnswer\(\s*questionId: string,\s*isCorrect: boolean,\s*confidenceRating\?: ConfidenceRating,\s*options\?: \{ awardXp\?: boolean \},\s*\): void;/,
  );
  assert.match(progressStore, /recordMockExamSession: \(session: MockExamProgressInput\) => void;/);
  assert.match(progressStore, /function normalizeConfidenceRating\(value: unknown\)/);
  assert.match(progressStore, /gradeFromConfidence\(isCorrect, normalizedConfidenceRating\)/);
  assert.match(progressStore, /lapsePenaltyForWrong\(normalizedConfidenceRating\)/);
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
    /function writeProgress\(\s*progress: PersistedProgress,\s*\): PersistedProgress & \{\s*persistenceWarning: RecoverablePersistenceWarning \| null;?\s*\}/,
  );
  assert.match(progressStore, /const serializedProgress = JSON\.stringify\(progress\);/);
  assert.match(progressStore, /writeRecoverably\(/);
  assert.match(progressStore, /progressStorageId/);
  assert.match(progressStore, /progressStateKey/);
  assert.match(progressStore, /serializedProgress/);
  assert.match(
    progressStore,
    /return \{ \.\.\.normalizeProgress\(JSON\.parse\(serializedProgress\)\), persistenceWarning \};/,
  );
  assert.match(progressStore, /clearPersistenceWarning: \(\) => void;/);
});

test('streak freeze normalizer focused validator mirrors shared storage policy', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-streak-freeze-normalizer-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const summary = parseValidationSummary(output);
  const progressStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/progressStore.ts'),
    'utf8',
  );

  assert.equal(summary.streakFreezeNormalizerCasesValidated, 3);
  assert.equal(summary.streakFreezeNormalizerSourceChecksValidated, 3);
  assert.equal(summary.streakFreezeNormalizerParityValidated, true);
  assert.match(progressStore, /normalizeStreakFreezeState as normalizeStoredStreakFreezeState/);
  assert.doesNotMatch(progressStore, /function normalizeStreakFreezeState\(value: unknown\)/);
});

test('streak freeze normalizer focused validator rejects shared policy drift', () => {
  const result = runFocusedStreakFreezeNormalizerValidationWithPatch(
    'lib/learning/streakWithFreeze.ts',
    'const MAX_STOCKPILE = 4;',
    'const MAX_STOCKPILE = 99;',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /streak-freeze normalizer must cap stockpile\/lifetime counts/,
  );
});

test('streak freeze normalizer focused validator rejects progress store alias drift', () => {
  const result = runFocusedStreakFreezeNormalizerValidationWithPatch(
    'lib/storage/progressStore.ts',
    'normalizeStreakFreezeState as normalizeStoredStreakFreezeState',
    'normalizeStreakFreezeState',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /progressStore must import the shared streak-freeze normalizer by storage alias/,
  );
});

test('exam submission finality parity has focused readiness persistence coverage', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-exam-submission-finality-parity'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const summary = parseValidationSummary(output);
  const examRoute = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/exam.tsx'), 'utf8');

  assert.deepEqual(Object.keys(summary), ['examSubmissionFinalityParityValidated']);
  assert.equal(summary.examSubmissionFinalityParityValidated, true);
  assert.equal((examRoute.match(/\brecordMockExamSession\s*\(\s*\{/g) ?? []).length, 1);
  assert.match(examRoute, /sessionId: examAttemptId/);
  assert.match(
    examRoute,
    /score: resultTotalCount > 0 \? resultCorrectCount \/ resultTotalCount : 0/,
  );
  assert.match(
    examRoute,
    /completedAt: submittedExamSession\?\.completedAt \?\? new Date\(\)\.toISOString\(\)/,
  );
  assert.match(examRoute, /correctCount: resultCorrectCount/);
  assert.match(examRoute, /totalCount: resultTotalCount/);
  assert.match(examRoute, /questionTimings:/);
});

test('DailyChallengeProgress schema mirrors public DailyChallengeCompletion fields', () => {
  const progressTypes = fs.readFileSync(path.join(repoRoot, 'types/progress.ts'), 'utf8');
  const progressStore = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/progressStore.ts'),
    'utf8',
  );
  const expectedFields = [
    'dayKey: string;',
    'questionIds: string[];',
    'correctCount: number;',
    'totalCount: number;',
    'score: number;',
    'timeSpentSeconds: number;',
    'completedAt: string;',
  ];

  assert.match(progressTypes, /export interface DailyChallengeCompletion \{/);
  assert.match(progressStore, /export type DailyChallengeProgress = \{/);
  for (const field of expectedFields) {
    assert.match(progressTypes, new RegExp(field.replace('[]', '\\[\\]')));
    assert.match(progressStore, new RegExp(field.replace('[]', '\\[\\]')));
  }
  assert.match(
    progressTypes,
    /dailyChallengeCompletions: Record<string, DailyChallengeCompletion>;/,
  );
  assert.match(progressStore, /dailyChallengeCompletions: Record<string, DailyChallengeProgress>;/);
  assert.match(progressStore, /function normalizeDailyChallengeProgress\(value: unknown\)/);
  assert.match(progressStore, /recordDailyChallengeCompletion: \(completion\) =>/);
});

test('progress hydration normalizes unsafe persisted numeric fields', () => {
  const state = loadProgressFromStorage({
    completedQuestionIds: [
      ' q001 ',
      7,
      'q002',
      'q001',
      '',
      ' __proto__ ',
      'constructor',
      'prototype',
      ' q003 ',
    ],
    questionProgress: {
      q001: {
        questionId: 'wrong-id',
        seenCount: 'bad',
        correctCount: 3.6,
        wrongCount: -2,
        correctStreak: 999999999,
        lastAnsweredAt: 'not-a-date',
        nextReviewAt: '2099-01-01T00:00:00.000Z',
        confidenceRating: 7,
        bookmarked: 'yes',
      },
      q002: {
        seenCount: 5,
        correctCount: 9,
        wrongCount: 8,
        correctStreak: 3,
        lastAnsweredAt: '2026-05-19T10:00:00.000Z',
        nextReviewAt: '2026-05-20T10:00:00.000Z',
        confidenceRating: 5,
        bookmarked: true,
      },
      q003: {
        seenCount: 1,
        correctCount: 0,
        wrongCount: 1,
        correctStreak: 0,
        confidenceRating: 2,
        bookmarked: false,
      },
    },
    totalXp: 'huge',
    answerDates: ['2026-05-19', 7, 'not-a-date', '2026-02-30', '2099-01-01', '2026-05-19'],
    answerHistory: [
      {
        questionId: ' q001 ',
        isCorrect: true,
        answeredAt: '2026-05-19T10:01:00.000Z',
        timeSpentSeconds: 12,
      },
      {
        questionId: '',
        isCorrect: true,
        answeredAt: '2026-05-19T10:02:00.000Z',
      },
      {
        questionId: ' __proto__ ',
        isCorrect: true,
        answeredAt: '2026-05-19T10:02:30.000Z',
      },
      {
        questionId: 'constructor',
        isCorrect: true,
        answeredAt: '2026-05-19T10:02:40.000Z',
      },
      {
        questionId: 'prototype',
        isCorrect: true,
        answeredAt: '2026-05-19T10:02:50.000Z',
      },
      {
        questionId: 'q002',
        isCorrect: 'yes',
        answeredAt: '2026-05-19T10:03:00.000Z',
      },
      {
        questionId: 'q003',
        isCorrect: false,
        answeredAt: 'not-a-date',
      },
      {
        questionId: 'q004',
        isCorrect: false,
        answeredAt: '2026-05-19T10:04:00.000Z',
        timeSpentSeconds: 'slow',
      },
    ],
    mockExamSessions: [
      {
        sessionId: 'm1',
        score: 2,
        completedAt: '2026-05-19T10:00:00.000Z',
        correctCount: 999999999,
        focusBreaks: 999999999,
        questionTimings: [
          { questionId: ' q001 ', timeSpentSeconds: 12 },
          { questionId: 'q001', timeSpentSeconds: 99 },
          { questionId: 'q002', timeSpentSeconds: 3.5 },
          { questionId: 'q003', timeSpentSeconds: 999999999 },
          { questionId: ' q003 ', timeSpentSeconds: 88 },
          { questionId: ' __proto__ ', timeSpentSeconds: 11 },
          { questionId: 'constructor', timeSpentSeconds: 12 },
          { questionId: 'prototype', timeSpentSeconds: 13 },
          { questionId: '', timeSpentSeconds: 8 },
        ],
        totalCount: 1000,
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

  assert.deepEqual(state.completedQuestionIds, ['q001', 'q002', 'q003']);
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
  assert.equal(Object.hasOwn(state.questionProgress.q001, 'confidenceRating'), false);
  assert.equal(state.questionProgress.q002.confidenceRating, 5);
  assert.equal(state.questionProgress.q003.confidenceRating, 2);
  assert.equal(Object.hasOwn(state.questionProgress.q001, 'bookmarked'), false);
  assert.equal(state.questionProgress.q002.bookmarked, true);
  assert.equal(state.questionProgress.q003.bookmarked, false);
  assert.equal(state.totalXp, 0);
  assert.deepEqual(state.answerDates, ['2026-05-19']);
  assert.deepEqual(state.answerHistory, [
    {
      questionId: 'q001',
      isCorrect: true,
      answeredAt: '2026-05-19T10:01:00.000Z',
      timeSpentSeconds: 12,
    },
    {
      questionId: 'q004',
      isCorrect: false,
      answeredAt: '2026-05-19T10:04:00.000Z',
    },
  ]);
  assert.equal(state.mockExamSessions.length, 2);
  assert.equal(state.mockExamSessions[0].score, 1);
  assert.equal(state.mockExamSessions[0].correctCount, 720);
  assert.equal(state.mockExamSessions[0].focusBreaks, 720);
  assert.deepEqual(state.mockExamSessions[0].questionTimings, [
    { questionId: 'q001', timeSpentSeconds: 12 },
    { questionId: 'q003', timeSpentSeconds: 14400 },
  ]);
  assert.equal(state.mockExamSessions[0].totalCount, 720);
  assert.equal(state.mockExamSessions[1].score, 0);
  assert.equal(state.mockExamSessions[1].correctCount, 0);
  assert.equal(state.mockExamSessions[1].focusBreaks, 0);
  assert.deepEqual(state.mockExamSessions[1].questionTimings, []);
  assert.equal(state.mockExamSessions[1].totalCount, 0);
  assert.equal(state.streakFreezeState.available, 4);
  assert.match(state.streakFreezeState.lastEarnedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(state.streakFreezeState.lastEarnedAt, '2099-01-01');
  assert.equal(state.streakFreezeState.lifetimeEarned, 0);
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
  assert.equal(Object.hasOwn(answeredProgress, 'confidenceRating'), false);
  assert.equal(answeredProgress.bookmarked, false);
  assert.equal(useProgressStore.getState().answerHistory.length, 1);
  assert.equal(useProgressStore.getState().answerHistory[0].questionId, 'q001');
  assert.equal(useProgressStore.getState().answerHistory[0].isCorrect, true);
  assert.match(useProgressStore.getState().answerHistory[0].answeredAt, /^\d{4}-\d{2}-\d{2}T/);

  useProgressStore.getState().recordAnswer('q002', false, 5);
  assertReturnedStateMatchesReadback();
  const ratedProgress = useProgressStore.getState().questionProgress.q002;
  assert.equal(ratedProgress.confidenceRating, 5);
  assert.equal(ratedProgress.wrongCount, 1);

  useProgressStore.getState().markQuestionCompleted('q002');
  assertReturnedStateMatchesReadback();
  assert.ok(useProgressStore.getState().completedQuestionIds.includes('q002'));

  useProgressStore.getState().recordMockExamSession({
    sessionId: 'mock-1',
    score: 0.8,
    correctCount: 16,
    focusBreaks: 2,
    questionTimings: [
      { questionId: 'q001', timeSpentSeconds: 18 },
      { questionId: 'q002', timeSpentSeconds: -1 },
    ],
    totalCount: 20,
  });
  assertReturnedStateMatchesReadback();
  assert.equal(useProgressStore.getState().mockExamSessions[0].sessionId, 'mock-1');
  assert.equal(useProgressStore.getState().mockExamSessions[0].focusBreaks, 2);
  assert.deepEqual(useProgressStore.getState().mockExamSessions[0].questionTimings, [
    { questionId: 'q001', timeSpentSeconds: 18 },
  ]);

  useProgressStore.getState().setStreakFreezeState({
    available: 99,
    lastEarnedAt: '2099-01-01',
    lifetimeEarned: 99999,
    lifetimeSpent: 3.5,
    rescuedDayKeys: ['2026-05-18', '2099-01-01', 'bad-key', '2026-05-18'],
  });
  assertReturnedStateMatchesReadback();
  assert.equal(useProgressStore.getState().streakFreezeState.available, 4);
  assert.notEqual(useProgressStore.getState().streakFreezeState.lastEarnedAt, '2099-01-01');
  assert.equal(useProgressStore.getState().streakFreezeState.lifetimeEarned, 10000);
  assert.equal(useProgressStore.getState().streakFreezeState.lifetimeSpent, 0);
  assert.deepEqual(useProgressStore.getState().streakFreezeState.rescuedDayKeys, ['2026-05-18']);

  useProgressStore.getState().resetProgress();
  assertReturnedStateMatchesReadback();
  assert.deepEqual(useProgressStore.getState().completedQuestionIds, []);
  assert.deepEqual(useProgressStore.getState().questionProgress, {});
  assert.deepEqual(useProgressStore.getState().answerHistory, []);
});

test('recordMockExamSession preserves distinct durable attempt ids and dedupes same-attempt retries', () => {
  const { useProgressStore, readPersistedProgress } = loadProgressStoreFromStorage({
    completedQuestionIds: [],
    questionProgress: {},
    totalXp: 0,
    answerDates: [],
    answerHistory: [],
    dailyChallengeCompletions: {},
    mockExamSessions: [],
    streakFreezeState: {
      available: 1,
      lastEarnedAt: '2026-05-19',
      lifetimeEarned: 1,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
  });

  useProgressStore.getState().recordMockExamSession({
    sessionId: 'mock-exam-attempt-a',
    score: 1,
    completedAt: '2026-05-21T10:00:00.000Z',
    correctCount: 20,
    totalCount: 20,
  });
  useProgressStore.getState().recordMockExamSession({
    sessionId: 'mock-exam-attempt-a',
    score: 0.5,
    completedAt: '2026-05-21T10:05:00.000Z',
    correctCount: 10,
    totalCount: 20,
  });
  useProgressStore.getState().recordMockExamSession({
    sessionId: 'mock-exam-attempt-b',
    score: 0.5,
    completedAt: '2026-05-21T12:00:00.000Z',
    correctCount: 10,
    totalCount: 20,
  });

  const state = useProgressStore.getState();

  assert.deepEqual(
    state.mockExamSessions.map((session) => session.sessionId),
    ['mock-exam-attempt-a', 'mock-exam-attempt-b'],
  );
  assert.equal(state.mockExamSessions[0].completedAt, '2026-05-21T10:05:00.000Z');
  assert.equal(state.mockExamSessions[0].score, 0.5);
  assert.equal(state.mockExamSessions[1].completedAt, '2026-05-21T12:00:00.000Z');
  assert.equal(state.totalXp, 90);
  assert.deepEqual(
    readPersistedProgress().mockExamSessions.map((session) => session.sessionId),
    ['mock-exam-attempt-a', 'mock-exam-attempt-b'],
  );
  assert.equal(readPersistedProgress().totalXp, 90);
});

test('recordAnswer ignores non-boolean correctness before state or storage writes', () => {
  const initialProgress = {
    completedQuestionIds: [],
    questionProgress: {},
    totalXp: 0,
    answerDates: [],
    answerHistory: [],
    dailyChallengeCompletions: {},
    mockExamSessions: [],
    streakFreezeState: {
      available: 1,
      lastEarnedAt: '2026-05-19',
      lifetimeEarned: 1,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
  };
  const { useProgressStore, readPersistedProgress } = loadProgressStoreFromStorage(initialProgress);

  const stateBefore = progressSnapshot(useProgressStore.getState());
  const persistedBefore = readPersistedProgress();

  useProgressStore.getState().recordAnswer('q-runtime-bool', 'yes');
  useProgressStore.getState().recordAnswer('q-runtime-number', 1);
  useProgressStore.getState().recordAnswer('q-runtime-null', null);

  assert.deepEqual(progressSnapshot(useProgressStore.getState()), stateBefore);
  assert.deepEqual(readPersistedProgress(), persistedBefore);
  assert.equal(useProgressStore.getState().questionProgress['q-runtime-bool'], undefined);
  assert.equal(useProgressStore.getState().answerHistory.length, 0);
  assert.equal(useProgressStore.getState().totalXp, 0);
  assert.deepEqual(useProgressStore.getState().completedQuestionIds, []);
  assert.deepEqual(useProgressStore.getState().answerDates, []);
});

test('mock exam completion XP ignores malformed runtime counts', () => {
  const initialProgress = {
    completedQuestionIds: [],
    questionProgress: {},
    totalXp: 0,
    answerDates: [],
    answerHistory: [],
    dailyChallengeCompletions: {},
    mockExamSessions: [],
    streakFreezeState: {
      available: 1,
      lastEarnedAt: '2026-05-19',
      lifetimeEarned: 1,
      lifetimeSpent: 0,
      rescuedDayKeys: [],
    },
  };
  const { useProgressStore } = loadProgressStoreFromStorage(initialProgress);

  useProgressStore.getState().recordMockExamSession({
    sessionId: 'bad-string-counts',
    score: 1,
    correctCount: '10',
    focusBreaks: '2',
    totalCount: '10',
  });
  useProgressStore.getState().recordMockExamSession({
    sessionId: 'bad-infinite-counts',
    score: 1,
    correctCount: Infinity,
    focusBreaks: Infinity,
    totalCount: Infinity,
  });
  useProgressStore.getState().recordMockExamSession({
    sessionId: 'bad-fractional-counts',
    score: 1,
    correctCount: 9.5,
    focusBreaks: 1.5,
    totalCount: 10.5,
  });

  assert.equal(useProgressStore.getState().totalXp, 0);
  assert.deepEqual(
    useProgressStore.getState().mockExamSessions.map((session) => ({
      correctCount: session.correctCount,
      focusBreaks: session.focusBreaks,
      totalCount: session.totalCount,
    })),
    [
      { correctCount: 0, focusBreaks: 0, totalCount: 0 },
      { correctCount: 0, focusBreaks: 0, totalCount: 0 },
      { correctCount: 0, focusBreaks: 0, totalCount: 0 },
    ],
  );

  useProgressStore.getState().recordMockExamSession({
    sessionId: 'valid-perfect-counts',
    score: 1,
    correctCount: 10,
    totalCount: 10,
  });

  assert.equal(useProgressStore.getState().totalXp, 70);
});

test('exam submission finality parity rejects losing the submitted completion timestamp', () => {
  const result = runFocusedExamSubmissionValidationWithRoutePatch(
    'completedAt: submittedExamSession?.completedAt ?? new Date().toISOString(),',
    'completedAt: new Date().toISOString(),',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /exam result submission must persist readiness field: completedAt/,
  );
});

test('exam submission finality parity rejects duplicate mock-exam persistence calls', () => {
  const result = runFocusedExamSubmissionValidationWithRoutePatch(
    'recordMockExamSession({',
    'recordMockExamSession({});\n    recordMockExamSession({',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /exam result submission must persist exactly one completed mock-exam session/,
  );
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
  assert.deepEqual(state.answerHistory, []);
  assert.deepEqual(state.mockExamSessions, []);
  assert.equal(state.streakFreezeState.available, 1);
  assert.equal(state.streakFreezeState.lifetimeEarned, 1);
  assert.equal(state.streakFreezeState.lifetimeSpent, 0);
  assert.deepEqual(state.streakFreezeState.rescuedDayKeys, []);
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.operation, 'read');
  assert.equal(state.persistenceWarning.storageId, 'progress');
  assert.equal(state.persistenceWarning.key, 'progressState');
  assert.match(state.persistenceWarning.errorMessage, /progress read failed/);
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
process.argv.push('--focus-progress-schema-parity');
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
    `const seenCount = normalizeNonNegativeInteger(
        item.seenCount,
        rawCorrectCount + rawWrongCount,
        maxHydratedQuestionAnswerCount,
      );`,
    'const seenCount = Math.max(0, item.seenCount ?? 0);',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /progress hydration must normalize seenCount with capped numeric helper/,
  );
});

test('progress store schema parity rejects raw completed question id hydration', () => {
  const result = runValidationWithProgressStorePatch(
    'const completedQuestionIds = normalizeCompletedQuestionIds(candidate.completedQuestionIds);',
    `const completedQuestionIds = Array.isArray(candidate.completedQuestionIds)
    ? candidate.completedQuestionIds.filter((id): id is string => typeof id === 'string')
    : [];`,
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /normalizeProgress must hydrate completedQuestionIds through the safe id normalizer/,
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

test('progress store schema parity rejects raw confidence hydration', () => {
  const result = runValidationWithProgressStorePatch(
    'if (confidenceRating) normalizedQuestionProgress.confidenceRating = confidenceRating;',
    'normalizedQuestionProgress.confidenceRating = item.confidenceRating;',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /question progress hydration must preserve only valid 1\.\.5 confidence ratings|progress hydration must not use raw numeric expression confidenceRating: item\.confidenceRating/,
  );
});

test('progress store schema parity rejects missing strict recordAnswer boolean guard', () => {
  const result = runValidationWithProgressStorePatch(
    "if (typeof isCorrect !== 'boolean') return state;",
    '',
  );

  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /recordAnswer must ignore non-boolean correctness before mutating progress/,
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
process.argv.push('--focus-progress-schema-parity');
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
