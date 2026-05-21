const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { createMemoryMMKV, loadTsWithStorage } = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function createStorageById() {
  return {
    'citizenship-requirements': createMemoryMMKV(),
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

function loadExportModule(storageById) {
  return loadTsWithStorage(repoRoot, 'lib/storage/localStudyDataExport.ts', storageById);
}

function deepSourcePayload(depth, leafJson) {
  let nestedJson = leafJson;
  for (let index = depth - 1; index >= 0; index -= 1) {
    nestedJson = `{"level${index}":${nestedJson}}`;
  }
  return `{"version":1,"source":${nestedJson}}`;
}

function expectNoImportWrites(storageById) {
  for (const storage of Object.values(storageById)) {
    assert.equal(storage.values.size, 0);
  }
}

test('storage-backed tests share the storage harness TypeScript loader and native stubs', () => {
  const storageHarnessConsumers = [
    'tests/v1-1-review-store.test.js',
    'tests/v1-1-highlights-store.test.js',
    'scripts/learning.test.js',
    'tests/content-local-study-data-import-parity.test.js',
    'tests/v1-1-companion-store.test.js',
  ];

  for (const relativePath of storageHarnessConsumers) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(
      source,
      /storageStoreHarness\.cjs/,
      `${relativePath} must consume the shared storage harness`,
    );
    assert.doesNotMatch(
      source,
      /require\.extensions\[['"]\.ts['"]\]\s*=/,
      `${relativePath} must not install its own TypeScript require hook`,
    );
    assert.doesNotMatch(
      source,
      /Module\._resolveFilename\s*=/,
      `${relativePath} must not patch module resolution directly`,
    );
    assert.doesNotMatch(
      source,
      /['"]react-native-mmkv['"]\s*:/,
      `${relativePath} must not define a local MMKV module stub`,
    );
    assert.doesNotMatch(
      source,
      /['"]zustand['"]\s*:/,
      `${relativePath} must not define a local Zustand module stub`,
    );
    assert.doesNotMatch(
      source,
      /ts\.transpileModule\(/,
      `${relativePath} must not duplicate the harness TypeScript transpiler`,
    );
  }
});

test('local study data import summary keeps Swedish copy learner-facing', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  const swedishCopyMatch = source.match(/sv:\s*\{[\s\S]*?\n\s*\},\n\s*en:/);
  const englishCopyMatch = source.match(/en:\s*\{[\s\S]*?\n\s*\},\n\};/);

  assert.ok(swedishCopyMatch, 'Settings must keep a Swedish import summary copy block');
  assert.ok(englishCopyMatch, 'Settings must keep an English import summary copy block');
  assert.match(swedishCopyMatch[0], /one: 'repetitionsdag'/);
  assert.match(swedishCopyMatch[0], /other: 'repetitionsdagar'/);
  assert.match(swedishCopyMatch[0], /one: 'repetitionskort'/);
  assert.match(swedishCopyMatch[0], /other: 'repetitionskort'/);
  assert.match(swedishCopyMatch[0], /one: 'markerat kravområde'/);
  assert.match(swedishCopyMatch[0], /other: 'markerade kravområden'/);
  assert.match(swedishCopyMatch[0], /one: 'granskning av fel svar'/);
  assert.match(swedishCopyMatch[0], /other: 'granskningar av fel svar'/);
  assert.match(swedishCopyMatch[0], /one: 'sparad inställning'/);
  assert.match(swedishCopyMatch[0], /other: 'sparade inställningar'/);
  assert.match(swedishCopyMatch[0], /Studiesvit och svitskydd ingår/);
  assert.match(swedishCopyMatch[0], /högst \$\{localStudyDataImportMaxLabel\}/);
  assert.match(
    swedishCopyMatch[0],
    /JSON-exporten är större än \$\{localStudyDataImportMaxLabel\}/,
  );
  assert.match(swedishCopyMatch[0], /fält för köp i appen eller kvitton/);
  assert.match(swedishCopyMatch[0], /data om köp i appen importeras inte/);
  assert.doesNotMatch(swedishCopyMatch[0], /\bFSRS\b|frysstatus|\bIAP\b/);
  assert.match(englishCopyMatch[0], /one: 'FSRS review day'/);
  assert.match(englishCopyMatch[0], /other: 'FSRS review days'/);
  assert.match(englishCopyMatch[0], /one: 'FSRS review card'/);
  assert.match(englishCopyMatch[0], /other: 'FSRS review cards'/);
  assert.match(englishCopyMatch[0], /one: 'marked requirement'/);
  assert.match(englishCopyMatch[0], /other: 'marked requirements'/);
  assert.match(englishCopyMatch[0], /one: 'wrong-answer review'/);
  assert.match(englishCopyMatch[0], /other: 'wrong-answer reviews'/);
  assert.match(englishCopyMatch[0], /one: 'saved setting'/);
  assert.match(englishCopyMatch[0], /other: 'saved settings'/);
  assert.match(englishCopyMatch[0], /under \$\{localStudyDataImportMaxLabel\}/);
  assert.match(
    englishCopyMatch[0],
    /The JSON export is larger than \$\{localStudyDataImportMaxLabel\}/,
  );
  assert.match(englishCopyMatch[0], /\bIAP fields\b/);
  assert.match(englishCopyMatch[0], /\bIAP data\b/);
});

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
      dailyGoalAnswers: 20,
      includeSupplementaryQuestions: true,
      hasSeenAboutTheTest: true,
      ignoredSetting: 'skip',
    },
    citizenshipRequirements: {
      checkedAreaIds: ['civicKnowledge', 'unknown', 'identity', 'identity'],
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
    citizenshipRequirementChecklistCount: 2,
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
  assert.equal(storageById.settings.values.get('dailyGoalAnswers'), 20);
  assert.equal(storageById.settings.values.get('includeSupplementaryQuestions'), true);
  assert.equal(storageById.settings.values.get('hasSeenAboutTheTest'), true);

  const citizenshipRequirements = JSON.parse(
    storageById['citizenship-requirements'].values.get('citizenshipRequirementsChecklistState'),
  );
  assert.deepEqual(citizenshipRequirements.checkedAreaIds, ['identity', 'civicKnowledge']);
});

test('local study data export round-trips citizenship requirements without purchase fields', () => {
  const sourceStorageById = createStorageById();
  sourceStorageById['citizenship-requirements'].set(
    'citizenshipRequirementsChecklistState',
    JSON.stringify({
      checkedAreaIds: ['selfSupport', 'identity', 'prototype', 'swedishLanguage', 'identity'],
    }),
  );
  sourceStorageById.settings.set('language', 'en');
  sourceStorageById.settings.set('dailyGoalAnswers', 20);

  const { buildLocalStudyDataExportSnapshot, serializeLocalStudyDataExport } =
    loadExportModule(sourceStorageById);
  const snapshot = buildLocalStudyDataExportSnapshot('2026-05-21T08:00:00.000Z');
  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.source, 'almost-swedish-local-study-data');
  assert.deepEqual(snapshot.citizenshipRequirements.checkedAreaIds, [
    'identity',
    'selfSupport',
    'swedishLanguage',
  ]);
  assert.equal(snapshot.settings.language, 'en');
  assert.equal(snapshot.settings.dailyGoalAnswers, 20);
  assert.doesNotMatch(JSON.stringify(snapshot), /purchase|receipt|entitlement|removeAds/i);

  const targetStorageById = createStorageById();
  const { applyLocalStudyDataImport, previewLocalStudyDataImport } =
    loadImportModule(targetStorageById);
  const previewResult = previewLocalStudyDataImport(
    serializeLocalStudyDataExport('2026-05-21T08:00:00.000Z'),
  );

  assert.equal(previewResult.ok, true);
  assert.equal(previewResult.preview.summary.citizenshipRequirementChecklistCount, 3);
  assert.equal(previewResult.preview.summary.settingCount, 5);
  applyLocalStudyDataImport(previewResult.preview);

  const restoredChecklist = JSON.parse(
    targetStorageById['citizenship-requirements'].values.get(
      'citizenshipRequirementsChecklistState',
    ),
  );
  assert.deepEqual(restoredChecklist.checkedAreaIds, [
    'identity',
    'selfSupport',
    'swedishLanguage',
  ]);
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
  assert.equal(storageById['citizenship-requirements'].values.size, 0);
});

test('local study data import scans deeply nested empty payloads without writes', () => {
  const storageById = createStorageById();
  const { previewLocalStudyDataImport } = loadImportModule(storageById);
  const result = previewLocalStudyDataImport(deepSourcePayload(6000, '{"note":"safe"}'));

  assert.deepEqual(result, { ok: false, code: 'empty_import' });
  expectNoImportWrites(storageById);
});

test('local study data import reports deeply nested purchase-field detail without writes', () => {
  const storageById = createStorageById();
  const { previewLocalStudyDataImport } = loadImportModule(storageById);
  const result = previewLocalStudyDataImport(
    deepSourcePayload(6000, '{"removeAdsReceipt":"local-test-receipt"}'),
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, 'purchase_fields_rejected');
  assert.match(result.detail, /^source\.level0\.level1\./);
  assert.match(result.detail, /\.level5999\.removeAdsReceipt$/);
  expectNoImportWrites(storageById);
});

test('local study data import rejects oversized payloads before parsing', () => {
  const storageById = createStorageById();
  const { LOCAL_STUDY_DATA_IMPORT_MAX_BYTES, previewLocalStudyDataImport } =
    loadImportModule(storageById);
  const originalParse = JSON.parse;
  let parseCalls = 0;

  JSON.parse = (...args) => {
    parseCalls += 1;
    return originalParse(...args);
  };

  try {
    const result = previewLocalStudyDataImport('x'.repeat(LOCAL_STUDY_DATA_IMPORT_MAX_BYTES + 1));

    assert.deepEqual(result, { ok: false, code: 'input_too_large' });
    assert.equal(parseCalls, 0);
    assert.equal(storageById.progress.values.size, 0);
    assert.equal(storageById['mistake-review'].values.size, 0);
    assert.equal(storageById.reviews.values.size, 0);
    assert.equal(storageById.settings.values.size, 0);
    assert.equal(storageById['citizenship-requirements'].values.size, 0);
  } finally {
    JSON.parse = originalParse;
  }
});

test('local study data import rejects multibyte payloads by UTF-8 byte size', () => {
  const storageById = createStorageById();
  const { LOCAL_STUDY_DATA_IMPORT_MAX_BYTES, previewLocalStudyDataImport } =
    loadImportModule(storageById);
  const originalParse = JSON.parse;
  let parseCalls = 0;

  JSON.parse = (...args) => {
    parseCalls += 1;
    return originalParse(...args);
  };

  try {
    const nonLatinPayload = 'å'.repeat(Math.floor(LOCAL_STUDY_DATA_IMPORT_MAX_BYTES / 2) + 1);
    const emojiPayload = '🙂'.repeat(Math.floor(LOCAL_STUDY_DATA_IMPORT_MAX_BYTES / 4) + 1);

    assert.ok(
      nonLatinPayload.length < LOCAL_STUDY_DATA_IMPORT_MAX_BYTES,
      'non-Latin payload should stay below the TextInput character maxLength',
    );
    assert.ok(
      emojiPayload.length < LOCAL_STUDY_DATA_IMPORT_MAX_BYTES,
      'emoji payload should stay below the TextInput character maxLength',
    );
    assert.equal(Buffer.byteLength(nonLatinPayload, 'utf8'), LOCAL_STUDY_DATA_IMPORT_MAX_BYTES + 2);
    assert.equal(Buffer.byteLength(emojiPayload, 'utf8'), LOCAL_STUDY_DATA_IMPORT_MAX_BYTES + 4);

    assert.deepEqual(previewLocalStudyDataImport(nonLatinPayload), {
      ok: false,
      code: 'input_too_large',
    });
    assert.deepEqual(previewLocalStudyDataImport(emojiPayload), {
      ok: false,
      code: 'input_too_large',
    });
    assert.equal(parseCalls, 0);
    assert.equal(storageById.progress.values.size, 0);
    assert.equal(storageById['mistake-review'].values.size, 0);
    assert.equal(storageById.reviews.values.size, 0);
    assert.equal(storageById.settings.values.size, 0);
    assert.equal(storageById['citizenship-requirements'].values.size, 0);
  } finally {
    JSON.parse = originalParse;
  }
});

test('local study data import accepts valid UTF-8 payloads below the byte limit', () => {
  const storageById = createStorageById();
  const { LOCAL_STUDY_DATA_IMPORT_MAX_BYTES, previewLocalStudyDataImport } =
    loadImportModule(storageById);
  const rawPayload = JSON.stringify({
    version: 1,
    settings: {
      language: 'sv',
      dailyGoalAnswers: 10,
    },
  });

  assert.ok(Buffer.byteLength(rawPayload, 'utf8') < LOCAL_STUDY_DATA_IMPORT_MAX_BYTES);
  const result = previewLocalStudyDataImport(rawPayload);

  assert.equal(result.ok, true);
  assert.equal(result.preview.summary.settingCount, 2);
});

test('local study data import ignores unsafe imported map keys with the shared guard', () => {
  const storageById = createStorageById();
  const { previewLocalStudyDataImport } = loadImportModule(storageById);
  const unsafeKeys = ['__proto__', 'constructor', 'prototype'];
  const unsafeProgressEntry = JSON.stringify({
    seenCount: 1,
    correctCount: 1,
    wrongCount: 0,
    correctStreak: 1,
    bookmarked: true,
  });
  const unsafeMistakeReview = JSON.stringify({
    answeredAt: '2026-05-20T08:05:00.000Z',
    selectedOptionTextEn: 'Unsafe answer',
    selectedOptionTextSv: 'Fel svar',
  });
  const unsafeReviewCard = (questionId) => JSON.stringify(validReviewCard(questionId));
  const rawPayload = `{
    "version": 1,
    "progress": {
      "completedQuestionIds": ["q001"],
      "questionProgress": {
        "q001": ${unsafeProgressEntry},
        "__proto__": ${unsafeProgressEntry},
        "constructor": ${unsafeProgressEntry},
        "prototype": ${unsafeProgressEntry}
      }
    },
    "mistakeReview": {
      "wrongAnswerReviews": {
        "q001": ${unsafeMistakeReview},
        "__proto__": ${unsafeMistakeReview},
        "constructor": ${unsafeMistakeReview},
        "prototype": ${unsafeMistakeReview}
      }
    },
    "reviews": {
      "byId": {
        "q001": ${unsafeReviewCard('q001')},
        "__proto__": ${unsafeReviewCard('__proto__')},
        "constructor": ${unsafeReviewCard('constructor')},
        "prototype": ${unsafeReviewCard('prototype')}
      },
      "gradedPerDay": {
        "2026-05-20": 2,
        "__proto__": 9,
        "constructor": 9,
        "prototype": 9
      }
    }
  }`;

  const previewResult = previewLocalStudyDataImport(rawPayload);
  assert.equal(previewResult.ok, true);
  const { mistakeReview, progress, reviews, summary } = previewResult.preview;

  assert.deepEqual(Object.keys(progress.questionProgress), ['q001']);
  assert.deepEqual(Object.keys(mistakeReview.wrongAnswerReviews), ['q001']);
  assert.deepEqual(Object.keys(reviews.byId), ['q001']);
  assert.deepEqual(reviews.gradedPerDay, { '2026-05-20': 2 });
  assert.equal(summary.bookmarkedQuestionCount, 1);
  assert.equal(summary.wrongAnswerReviewCount, 1);
  assert.equal(summary.fsrsReviewCardCount, 1);
  assert.equal(summary.gradedReviewDayCount, 1);
  assert.equal(summary.citizenshipRequirementChecklistCount, 0);

  for (const map of [
    progress.questionProgress,
    mistakeReview.wrongAnswerReviews,
    reviews.byId,
    reviews.gradedPerDay,
  ]) {
    assert.equal(Object.getPrototypeOf(map), Object.prototype);
    for (const unsafeKey of unsafeKeys) {
      assert.equal(Object.prototype.hasOwnProperty.call(map, unsafeKey), false);
    }
  }
});

test('local study data import map-key safety is shared by all storage normalizers', () => {
  const helperSource = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/importKeySafety.ts'),
    'utf8',
  );
  assert.match(helperSource, /export function isSafeImportedMapKey/);
  assert.match(helperSource, /'__proto__'/);
  assert.match(helperSource, /'constructor'/);
  assert.match(helperSource, /'prototype'/);

  for (const relativePath of [
    'lib/storage/progressStore.ts',
    'lib/storage/mistakeReviewStore.ts',
    'lib/storage/reviewStore.ts',
    'lib/storage/citizenshipRequirementsStore.ts',
  ]) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /isSafeImportedMapKey/);
    assert.doesNotMatch(source, /new Set\(\[['"]__proto__['"]/);
  }
});
