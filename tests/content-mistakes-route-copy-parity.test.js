const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const {
  createMemoryMMKV,
  createThrowingGetMMKV,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function parseValidationSummary() {
  const output = execFileSync(process.execPath, ['scripts/validate-content.js'], {
    encoding: 'utf8',
  });
  const match = output.match(/\{[\s\S]*\}/);
  assert.ok(match, 'validation should print JSON summary');
  return JSON.parse(match[0]);
}

test('mistakes route shell copy follows the persisted settings language', () => {
  const summary = parseValidationSummary();
  const source = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');

  assert.equal(summary.mistakesRouteCopyLabelsValidated, 30);
  assert.equal(summary.mistakesRouteCopyParityValidated, true);
  assert.match(source, /const mistakesCopy: Record<AppLanguage, MistakesCopy> = \{/);
  assert.match(source, /const language = useSettingsStore\(\(state\) => state\.language\);/);
  assert.match(source, /const copy = mistakesCopy\[language\];/);
  assert.match(source, /Här finns frågor du har missat, med förklaring, källhänvisning/);
  assert.match(source, /Review wrong answers with the question, explanation, source reference/);
  [
    ['Fell', 'ogg'],
    ['Fel svar att', ' repetera'],
    ['Gå igenom fel svar', ' med fråga'],
    ['repetitionsantal på', ' samma plats'],
    ['Sparad för fokuserad', ' repetition'],
  ].forEach((parts) => assert.doesNotMatch(source, new RegExp(parts.join(''))));
  assert.match(source, /accessibilityLabel=\{copy\.emptyPracticeAccessibilityLabel\}/);
  assert.match(source, /useMistakeReviewStore/);
  assert.match(source, /type AnswerReviewBlockProps = \{/);
  assert.match(source, /function AnswerReviewBlock\(\{/);
  assert.match(source, /const bookmarkedReviewQuestions = questions\.filter\(/);
  assert.match(source, /\(questionProgress\[question\.id\]\?\.wrongCount \?\? 0\) === 0/);
  assert.match(source, /\{bookmarkedReviewQuestions\.map\(\(question\) => \{/);
  assert.match(source, /<AnswerReviewBlock copy=\{copy\} correctAnswer=\{correctAnswer\} \/>/);
  assert.match(source, /\{copy\.selectedWrongAnswerLabel\}/);
  assert.match(source, /\{copy\.correctAnswerLabel\}/);
  assert.match(source, /accessibilityLabel=\{copy\.answerReviewAccessibilityLabel\(/);
  assert.match(
    source,
    /\{copy\.wrongAnswers\(questionProgress\[question\.id\]\?\.wrongCount \?\? 0\)\}/,
  );
});

test('mistakes route copy parity rejects bypassing the settings language', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace('const copy = mistakesCopy[language];', 'const copy = mistakesCopy.en;');
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
    /mistakes route must select copy from settings language/,
  );
});

test('mistakes route copy parity rejects missing Swedish shell copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace("'När du missar en övningsfråga visas den här.'", "'No mistakes yet'");
  }
  return originalReadFileSync.call(this, filePath, ...args);
};
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /mistakes route is missing sv copy/);
});

test('mistakes route copy parity rejects missing answer-review accessibility copy', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        'accessibilityLabel={copy.answerReviewAccessibilityLabel(',
        'accessibilityLabel={copy.emptyPracticeAccessibilityLabel}',
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
    /answer review must expose localized accessibility summary/,
  );
});

test('mistakes route copy parity rejects missing wrong-answer review store wiring', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replaceAll('useMistakeReviewStore', 'useProgressStore');
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
    /mistakes route must read stored wrong-answer review text/,
  );
});

test('mistakes route copy parity rejects bookmarked cards without answer review', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function readFileSync(filePath, ...args) {
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  if (normalizedPath.endsWith('/app/(tabs)/mistakes.tsx')) {
    return originalReadFileSync
      .call(this, filePath, ...args)
      .replace(
        '<AnswerReviewBlock copy={copy} correctAnswer={correctAnswer} />',
        'null',
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
    /bookmarked review cards must show the localized correct answer/,
  );
});

test('mistake review store drops corrupt persisted selected-answer reviews', () => {
  const answeredAt = '2026-05-19T10:00:00.000Z';
  const longAnswer = 'x'.repeat(501);
  const storage = createMemoryMMKV({
    mistakeReviewState: JSON.stringify({
      wrongAnswerReviews: {
        q001: {
          answeredAt,
          questionId: 'q001',
          selectedOptionTextEn: '  Wrong answer  ',
          selectedOptionTextSv: '  Fel svar  ',
        },
        qBadDate: {
          answeredAt: 'not-a-date',
          questionId: 'qBadDate',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
        qMismatched: {
          answeredAt,
          questionId: 'other-id',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
        '': {
          answeredAt,
          questionId: '',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
        qBlankEn: {
          answeredAt,
          questionId: 'qBlankEn',
          selectedOptionTextEn: '   ',
          selectedOptionTextSv: 'Fel svar',
        },
        qBlankSv: {
          answeredAt,
          questionId: 'qBlankSv',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: '   ',
        },
        qTooLong: {
          answeredAt,
          questionId: 'qTooLong',
          selectedOptionTextEn: longAnswer,
          selectedOptionTextSv: 'Fel svar',
        },
      },
    }),
  });
  const { useMistakeReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/mistakeReviewStore.ts',
    {
      'mistake-review': storage,
    },
  );

  assert.deepEqual(useMistakeReviewStore.getState().wrongAnswerReviews, {
    q001: {
      answeredAt,
      questionId: 'q001',
      selectedOptionTextEn: 'Wrong answer',
      selectedOptionTextSv: 'Fel svar',
    },
  });
});

test('mistake review import snapshot merges normalized wrong-answer reviews', () => {
  const olderAnsweredAt = '2026-05-18T09:00:00.000Z';
  const newerAnsweredAt = '2026-05-19T10:00:00.000Z';
  const storage = createMemoryMMKV({
    mistakeReviewState: JSON.stringify({
      wrongAnswerReviews: {
        q001: {
          answeredAt: olderAnsweredAt,
          questionId: 'q001',
          selectedOptionTextEn: 'Existing answer',
          selectedOptionTextSv: 'Befintligt svar',
        },
      },
    }),
  });
  const { importMistakeReviewSnapshot, useMistakeReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/mistakeReviewStore.ts',
    {
      'mistake-review': storage,
    },
  );

  const imported = importMistakeReviewSnapshot({
    wrongAnswerReviews: {
      q001: {
        answeredAt: newerAnsweredAt,
        questionId: 'q001',
        selectedOptionTextEn: '  Imported answer  ',
        selectedOptionTextSv: '  Importerat svar  ',
      },
      q002: {
        answeredAt: newerAnsweredAt,
        questionId: 'q002',
        selectedOptionTextEn: 'Another answer',
        selectedOptionTextSv: 'Ett annat svar',
      },
      qBad: {
        answeredAt: 'not-a-date',
        questionId: 'qBad',
        selectedOptionTextEn: 'Bad',
        selectedOptionTextSv: 'Dålig',
      },
    },
  });

  assert.equal(imported.wrongAnswerReviews.q001.selectedOptionTextEn, 'Imported answer');
  assert.equal(imported.wrongAnswerReviews.q002.selectedOptionTextSv, 'Ett annat svar');
  assert.equal(Object.hasOwn(imported.wrongAnswerReviews, 'qBad'), false);
  assert.deepEqual(
    useMistakeReviewStore.getState().wrongAnswerReviews,
    imported.wrongAnswerReviews,
  );
});

test('local study data import preview rejects purchase fields and applies validated study data', () => {
  const progressStorage = createMemoryMMKV();
  const mistakeStorage = createMemoryMMKV();
  const reviewStorage = createMemoryMMKV();
  const settingsStorage = createMemoryMMKV();
  const { applyLocalStudyDataImport, previewLocalStudyDataImport } = loadTsWithStorage(
    repoRoot,
    'lib/storage/localStudyDataImport.ts',
    {
      progress: progressStorage,
      'mistake-review': mistakeStorage,
      reviews: reviewStorage,
      settings: settingsStorage,
    },
  );
  const validCard = {
    questionId: 'q001',
    difficulty: 5,
    stability: 4,
    reps: 1,
    lapses: 0,
    state: 'review',
    lastReviewAt: '2026-05-15T10:00:00.000Z',
    dueAt: '2026-05-19T10:00:00.000Z',
  };

  assert.deepEqual(
    previewLocalStudyDataImport(JSON.stringify({ version: 1, purchaseReceipt: 'blocked' })),
    { ok: false, code: 'purchase_fields_rejected', detail: 'purchaseReceipt' },
  );
  assert.equal(
    previewLocalStudyDataImport(JSON.stringify({ version: 2, settings: {} })).code,
    'unsupported_version',
  );

  const result = previewLocalStudyDataImport(
    JSON.stringify({
      version: 1,
      progress: {
        completedQuestionIds: ['q001'],
        questionProgress: {
          q001: {
            seenCount: 2,
            correctCount: 1,
            wrongCount: 1,
            correctStreak: 0,
            bookmarked: true,
          },
        },
        mockExamSessions: [
          {
            sessionId: 'mock-1',
            score: 0.5,
            completedAt: '2026-05-19T12:00:00.000Z',
            correctCount: 1,
            totalCount: 2,
            answers: [{ questionId: 'q001', isCorrect: true, timeSpentSeconds: 4 }],
          },
        ],
        streakFreezeState: {
          available: 2,
          lastEarnedAt: '2026-05-19',
          lifetimeEarned: 2,
          lifetimeSpent: 1,
          rescuedDayKeys: ['2026-05-18'],
        },
      },
      mistakeReview: {
        wrongAnswerReviews: {
          q001: {
            answeredAt: '2026-05-19T11:00:00.000Z',
            questionId: 'q001',
            selectedOptionTextEn: 'Wrong answer',
            selectedOptionTextSv: 'Fel svar',
          },
        },
      },
      reviews: {
        byId: { q001: validCard },
        gradedPerDay: { '2026-05-19': 1 },
      },
      settings: {
        language: 'en',
        audioEnabled: false,
        dailyGoalAnswers: 20,
        includeSupplementaryQuestions: true,
        hasSeenAboutTheTest: true,
      },
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.preview.summary.completedQuestionCount, 1);
  assert.equal(result.preview.summary.bookmarkedQuestionCount, 1);
  assert.equal(result.preview.summary.wrongAnswerReviewCount, 1);
  assert.equal(result.preview.summary.mockExamSessionCount, 1);
  assert.equal(result.preview.summary.streakFreezeStateIncluded, true);
  assert.equal(result.preview.summary.fsrsReviewCardCount, 1);
  assert.equal(result.preview.summary.gradedReviewDayCount, 1);
  assert.equal(result.preview.summary.settingCount, 5);

  applyLocalStudyDataImport(result.preview);
  assert.equal(
    JSON.parse(progressStorage.values.get('progressState')).completedQuestionIds[0],
    'q001',
  );
  assert.equal(
    JSON.parse(mistakeStorage.values.get('mistakeReviewState')).wrongAnswerReviews.q001
      .selectedOptionTextSv,
    'Fel svar',
  );
  assert.equal(
    JSON.parse(reviewStorage.values.get('learning.reviews.cards.v1')).byId.q001.questionId,
    'q001',
  );
  assert.equal(settingsStorage.values.get('language'), 'en');
  assert.equal(settingsStorage.values.get('audioEnabled'), false);
  assert.equal(settingsStorage.values.get('dailyGoalAnswers'), 20);
});

test('mistake review store falls back when MMKV reads throw', () => {
  const { useMistakeReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/mistakeReviewStore.ts',
    {
      'mistake-review': createThrowingGetMMKV('mistake review read failed'),
    },
  );

  assert.deepEqual(useMistakeReviewStore.getState().wrongAnswerReviews, {});
});
