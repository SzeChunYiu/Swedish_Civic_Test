const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const { createMemoryMMKV, loadTsWithStorage } = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function createStorageById() {
  return {
    progress: createMemoryMMKV(),
    'mistake-review': createMemoryMMKV(),
    reviews: createMemoryMMKV(),
    settings: createMemoryMMKV(),
  };
}

function validReviewCard(questionId = 'q001') {
  return {
    questionId,
    difficulty: 5,
    stability: 7,
    reps: 2,
    lapses: 0,
    state: 'review',
    lastReviewAt: null,
    dueAt: '2026-05-21T08:00:00.000Z',
  };
}

function loadImportModule(storageById) {
  return loadTsWithStorage(repoRoot, 'lib/storage/localStudyDataImport.ts', storageById);
}

test('local study data import previews and applies all learner snapshot sections', () => {
  const storageById = createStorageById();
  const { applyLocalStudyDataImport, previewLocalStudyDataImport } = loadImportModule(storageById);
  const rawPayload = JSON.stringify({
    version: 1,
    progress: {
      completedQuestionIds: ['q001', 'q002', 42],
      questionProgress: {
        q001: {
          seenCount: 3,
          correctCount: 2,
          wrongCount: 1,
          correctStreak: 2,
          bookmarked: true,
          lastAnsweredAt: '2026-05-20T08:00:00.000Z',
          nextReviewAt: '2026-05-21T08:00:00.000Z',
        },
      },
      totalXp: 42,
      answerDates: ['2026-05-20', '2026-05-20'],
      mockExamSessions: [
        {
          sessionId: 'mock-1',
          score: 0.75,
          completedAt: '2026-05-20T09:00:00.000Z',
          correctCount: 3,
          totalCount: 4,
        },
      ],
      streakFreezeState: {
        available: 2,
        lastEarnedAt: '2026-05-20',
        lifetimeEarned: 4,
        lifetimeSpent: 1,
        rescuedDayKeys: ['2026-05-19', '2026-05-19'],
      },
    },
    mistakeReview: {
      wrongAnswerReviews: {
        q001: {
          answeredAt: '2026-05-20T08:05:00.000Z',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
        qMalformed: {
          answeredAt: '2026-05-20T08:05:00.000Z',
          selectedOptionTextEn: 'Missing Swedish answer',
        },
      },
    },
    reviews: {
      byId: {
        q001: validReviewCard('q001'),
        qMalformed: { questionId: 'qMalformed' },
      },
      gradedPerDay: {
        '2026-05-20': 2,
        bad: -1,
      },
    },
    settings: {
      language: 'en',
      audioEnabled: false,
      dailyGoalAnswers: 18.4,
      includeSupplementaryQuestions: true,
      hasSeenAboutTheTest: true,
      ignoredSetting: 'skip',
    },
  });

  const previewResult = previewLocalStudyDataImport(rawPayload);
  assert.equal(previewResult.ok, true);
  assert.deepEqual(previewResult.preview.summary, {
    completedQuestionCount: 2,
    bookmarkedQuestionCount: 1,
    wrongAnswerReviewCount: 1,
    mockExamSessionCount: 1,
    streakFreezeStateIncluded: true,
    fsrsReviewCardCount: 1,
    gradedReviewDayCount: 1,
    settingCount: 5,
  });

  const appliedSummary = applyLocalStudyDataImport(previewResult.preview);
  assert.deepEqual(appliedSummary, previewResult.preview.summary);

  const progress = JSON.parse(storageById.progress.values.get('progressState'));
  assert.deepEqual(progress.completedQuestionIds, ['q001', 'q002']);
  assert.equal(progress.questionProgress.q001.bookmarked, true);
  assert.equal(progress.mockExamSessions[0].correctCount, 3);
  assert.deepEqual(progress.streakFreezeState.rescuedDayKeys, ['2026-05-19']);

  const mistakeReview = JSON.parse(storageById['mistake-review'].values.get('mistakeReviewState'));
  assert.deepEqual(Object.keys(mistakeReview.wrongAnswerReviews), ['q001']);

  const reviews = JSON.parse(storageById.reviews.values.get('learning.reviews.cards.v1'));
  assert.deepEqual(Object.keys(reviews.byId), ['q001']);
  assert.deepEqual(reviews.gradedPerDay, { '2026-05-20': 2 });

  assert.equal(storageById.settings.values.get('language'), 'en');
  assert.equal(storageById.settings.values.get('audioEnabled'), false);
  assert.equal(storageById.settings.values.get('dailyGoalAnswers'), 18);
  assert.equal(storageById.settings.values.get('includeSupplementaryQuestions'), true);
  assert.equal(storageById.settings.values.get('hasSeenAboutTheTest'), true);
});

test('local study data import rejects purchase fields before any snapshot writes', () => {
  const storageById = createStorageById();
  const { previewLocalStudyDataImport } = loadImportModule(storageById);
  const result = previewLocalStudyDataImport(
    JSON.stringify({
      version: 1,
      progress: {
        completedQuestionIds: ['q001'],
      },
      purchase: {
        removeAds: true,
      },
    }),
  );

  assert.deepEqual(result, {
    ok: false,
    code: 'purchase_fields_rejected',
    detail: 'purchase',
  });
  assert.equal(storageById.progress.values.size, 0);
  assert.equal(storageById['mistake-review'].values.size, 0);
  assert.equal(storageById.reviews.values.size, 0);
  assert.equal(storageById.settings.values.size, 0);
});
