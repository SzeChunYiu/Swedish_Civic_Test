const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createMemoryMMKV,
  createThrowingSetMMKV,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function createStorageById() {
  return {
    accessibility: createMemoryMMKV(),
    'citizenship-requirements': createMemoryMMKV(),
    companion: createMemoryMMKV(),
    progress: createMemoryMMKV(),
    'mistake-review': createMemoryMMKV(),
    reviews: createMemoryMMKV(),
    settings: createMemoryMMKV(),
    highlights: createMemoryMMKV(),
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

function validHighlight(overrides = {}) {
  return {
    id: 'hl-safe-1',
    chapterId: 'ch01',
    blockId: 'intro-1',
    startOffset: 4,
    endOffset: 18,
    color: 'yellow',
    note: 'Portable margin note',
    createdAt: '2026-05-21T08:00:00.000Z',
    updatedAt: '2026-05-21T08:05:00.000Z',
    ...overrides,
  };
}

function createSpeechStub() {
  return {
    stopCalls: 0,
    stop() {
      this.stopCalls += 1;
    },
  };
}

function loadImportModule(storageById, moduleStubs = {}) {
  return loadTsWithStorage(
    repoRoot,
    'lib/storage/localStudyDataImport.ts',
    storageById,
    moduleStubs,
  );
}

function loadExportModule(storageById) {
  return loadTsWithStorage(repoRoot, 'lib/storage/localStudyDataExport.ts', storageById);
}

function assertNoSnapshotWrites(storageById) {
  for (const storageId of [
    'accessibility',
    'citizenship-requirements',
    'companion',
    'progress',
    'mistake-review',
    'reviews',
    'settings',
    'highlights',
  ]) {
    assert.equal(storageById[storageId].values.size, 0, `${storageId} storage should be untouched`);
  }
}

function listJavaScriptFiles(rootDir) {
  const files = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      listJavaScriptFiles(entryPath).forEach((file) => files.push(file));
    } else if (/\.(?:cjs|js)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function findStorageHarnessConsumers() {
  return ['tests', 'scripts']
    .flatMap((relativeRoot) => listJavaScriptFiles(path.join(repoRoot, relativeRoot)))
    .map((filePath) => path.relative(repoRoot, filePath))
    .filter((relativePath) => {
      if (relativePath === 'tests/helpers/storageStoreHarness.cjs') return false;
      const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
      return source.includes('storageStoreHarness.cjs');
    })
    .sort();
}

test('storage-backed tests share the storage harness TypeScript loader and native stubs', () => {
  const storageHarnessConsumers = findStorageHarnessConsumers();

  assert.deepEqual(
    storageHarnessConsumers,
    [...storageHarnessConsumers].sort(),
    'storage harness consumers should be scanned in stable order',
  );
  assert.ok(
    storageHarnessConsumers.includes('scripts/learning.test.js') &&
      storageHarnessConsumers.includes('tests/content-local-study-data-import-parity.test.js'),
    'guard should dynamically cover storage harness consumers in tests/ and scripts/',
  );

  for (const relativePath of storageHarnessConsumers) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(
      source,
      /storageStoreHarness\.cjs/,
      `${relativePath} must consume the shared storage harness`,
    );
    assert.doesNotMatch(
      source.replace(/storageStoreHarness\.cjs/g, ''),
      /require\.extensions\[['"]\.tsx?['"]\]\s*=/,
      `${relativePath} must not install its own TypeScript require hook`,
    );
    assert.doesNotMatch(
      source,
      /Module\._resolveFilename\s*=/,
      `${relativePath} must not patch module resolution directly`,
    );
    assert.doesNotMatch(
      source,
      /(?:request\s*===\s*['"]react-native-mmkv['"]|['"]react-native-mmkv['"]\s*:)/,
      `${relativePath} must not define a local MMKV module stub`,
    );
    assert.doesNotMatch(
      source,
      /(?:request\s*===\s*['"]zustand['"]|['"]zustand['"]\s*:)/,
      `${relativePath} must not define a local Zustand module stub`,
    );
    if (
      relativePath !== 'scripts/validate-content.js' &&
      relativePath !== 'tests/content-citizenship-requirements-parity.test.js'
    ) {
      assert.doesNotMatch(
        source,
        /ts\.transpileModule\(/,
        `${relativePath} must not duplicate the harness TypeScript transpiler`,
      );
    }
  }
});

test('local study data import summary keeps Swedish copy learner-facing', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  const importSource = fs.readFileSync(
    path.join(repoRoot, 'lib/storage/localStudyDataImport.ts'),
    'utf8',
  );
  const swedishCopyMatch = source.match(/sv:\s*\{[\s\S]*?\n\s*\},\n\s*en:/);
  const englishCopyMatch = source.match(/en:\s*\{[\s\S]*?\n\s*\},\n\};/);

  assert.ok(swedishCopyMatch, 'Settings must keep a Swedish import summary copy block');
  assert.ok(englishCopyMatch, 'Settings must keep an English import summary copy block');
  assert.match(swedishCopyMatch[0], /one: 'repetitionsdag'/);
  assert.match(swedishCopyMatch[0], /other: 'repetitionsdagar'/);
  assert.match(swedishCopyMatch[0], /one: 'repetitionskort'/);
  assert.match(swedishCopyMatch[0], /other: 'repetitionskort'/);
  assert.match(swedishCopyMatch[0], /one: 'markering i e-boken'/);
  assert.match(swedishCopyMatch[0], /other: 'markeringar i e-boken'/);
  assert.match(swedishCopyMatch[0], /one: 'genomfört övningsprov'/);
  assert.match(swedishCopyMatch[0], /other: 'genomförda övningsprov'/);
  assert.match(swedishCopyMatch[0], /one: 'markerat kravområde'/);
  assert.match(swedishCopyMatch[0], /other: 'markerade kravområden'/);
  assert.match(swedishCopyMatch[0], /one: 'granskning av fel svar'/);
  assert.match(swedishCopyMatch[0], /other: 'granskningar av fel svar'/);
  assert.match(swedishCopyMatch[0], /one: 'sparad inställning'/);
  assert.match(swedishCopyMatch[0], /other: 'sparade inställningar'/);
  assert.match(swedishCopyMatch[0], /one: 'tillgänglighetsval'/);
  assert.match(swedishCopyMatch[0], /one: 'vald studiekompis'/);
  assert.match(swedishCopyMatch[0], /Studiesvit och svitskydd ingår/);
  assert.match(swedishCopyMatch[0], /högst \$\{localStudyDataImportMaxLabel\}/);
  assert.match(
    swedishCopyMatch[0],
    /JSON-exporten är större än \$\{localStudyDataImportMaxLabel\}/,
  );
  assert.match(swedishCopyMatch[0], /fält för köp i appen eller kvitton/);
  assert.match(swedishCopyMatch[0], /data om köp i appen importeras inte/);
  assert.match(swedishCopyMatch[0], /kunde inte sparas varaktigt/);
  assert.match(swedishCopyMatch[0], /bara i minnet tills appen stängs/);
  assert.doesNotMatch(swedishCopyMatch[0], /\bFSRS\b|frysstatus|\bIAP\b/);
  assert.match(englishCopyMatch[0], /one: 'FSRS review day'/);
  assert.match(englishCopyMatch[0], /other: 'FSRS review days'/);
  assert.match(englishCopyMatch[0], /one: 'FSRS review card'/);
  assert.match(englishCopyMatch[0], /other: 'FSRS review cards'/);
  assert.match(englishCopyMatch[0], /one: 'ebook highlight'/);
  assert.match(englishCopyMatch[0], /other: 'ebook highlights'/);
  assert.match(englishCopyMatch[0], /one: 'completed mock exam'/);
  assert.match(englishCopyMatch[0], /other: 'completed mock exams'/);
  assert.match(englishCopyMatch[0], /one: 'marked requirement'/);
  assert.match(englishCopyMatch[0], /other: 'marked requirements'/);
  assert.match(englishCopyMatch[0], /one: 'wrong-answer review'/);
  assert.match(englishCopyMatch[0], /other: 'wrong-answer reviews'/);
  assert.match(englishCopyMatch[0], /one: 'saved setting'/);
  assert.match(englishCopyMatch[0], /other: 'saved settings'/);
  assert.match(englishCopyMatch[0], /one: 'accessibility preference'/);
  assert.match(englishCopyMatch[0], /other: 'accessibility preferences'/);
  assert.match(englishCopyMatch[0], /one: 'selected study companion'/);
  assert.match(englishCopyMatch[0], /under \$\{localStudyDataImportMaxLabel\}/);
  assert.match(
    englishCopyMatch[0],
    /The JSON export is larger than \$\{localStudyDataImportMaxLabel\}/,
  );
  assert.match(englishCopyMatch[0], /\bIAP fields\b/);
  assert.match(englishCopyMatch[0], /\bIAP data\b/);
  assert.match(englishCopyMatch[0], /durable storage failed/);
  assert.match(englishCopyMatch[0], /only in memory until the app closes/);
  assert.match(source, /getLocalStudyDataImportPayloadByteCount/);
  assert.match(importSource, /type LocalStudyDataImportApplyResult/);
  assert.match(importSource, /warnings: LocalStudyDataImportApplyWarning\[\]/);
  assert.match(importSource, /\| 'accessibility'/);
  assert.match(importSource, /\| 'companion'/);
  assert.match(source, /section === 'accessibility'\) return 'tillgänglighetsval'/);
  assert.match(source, /section === 'companion'\) return 'studiekompis'/);
  assert.match(source, /section === 'accessibility'\) return 'accessibility preferences'/);
  assert.match(source, /section === 'companion'\) return 'study companion'/);
  assert.match(source, /applyResult\.warnings\.length > 0/);
  assert.match(source, /copy\.importPersistenceWarning\(sectionList\)/);
  assert.match(
    source,
    /const importPayloadOverByteLimit = importPayloadByteCount > LOCAL_STUDY_DATA_IMPORT_MAX_BYTES;/,
  );
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /disabled=\{importPayloadOverByteLimit\}/);
  assert.match(source, /maxLength=\{LOCAL_STUDY_DATA_IMPORT_MAX_BYTES\}/);
});

test('settings import browser fixtures cover accessibility and companion preview rows', () => {
  const source = fs.readFileSync(
    path.join(repoRoot, 'tests/e2e/settings-import-confirm-apply.spec.ts'),
    'utf8',
  );

  assert.match(
    source,
    /const accessibilityEasyReadFontKey = 'accessibility\\\\a11y\.easyReadFont\.v1';/,
  );
  assert.match(
    source,
    /const accessibilityFontSizeStepKey = 'accessibility\\\\a11y\.fontSizeStep\.v1';/,
  );
  assert.match(
    source,
    /const accessibilityAudioPlaybackRateKey = 'accessibility\\\\a11y\.audioPlaybackRate\.v1';/,
  );
  assert.match(
    source,
    /const accessibilityListenFirstAudioKey = 'accessibility\\\\a11y\.listenFirstAudio\.v1';/,
  );
  assert.match(source, /const accessibilityThemeModeKey = 'accessibility\\\\a11y\.themeMode\.v1';/);
  assert.match(source, /const companionSelectedIdKey = 'companion\\\\companion\.selectedId\.v1';/);
  assert.match(source, /const importWriteFailureCases: ImportWriteFailureCase\[\]/);
  assert.match(source, /name: 'accessibility'/);
  assert.match(source, /storageKey: accessibilityThemeModeKey/);
  assert.match(source, /durable storage failed for: accessibility preferences/);
  assert.match(source, /name: 'companion'/);
  assert.match(source, /storageKey: companionSelectedIdKey/);
  assert.match(source, /durable storage failed for: study companion/);
  assert.match(source, /accessibility:\s*\{\s*themeMode: 'dark',\s*\}/);
  assert.match(
    source,
    /accessibility:\s*\{\s*easyReadFont: true,\s*fontSizeStep: 3,\s*audioPlaybackRate: 1\.25,\s*listenFirstAudioEnabled: true,\s*themeMode: 'dark',\s*\}/,
  );
  assert.match(source, /companion:\s*\{\s*selectedId: 'dala-horse',\s*\}/);
  assert.match(source, /'1 tillgänglighetsval'/);
  assert.match(source, /'5 tillgänglighetsval'/);
  assert.match(source, /'1 vald studiekompis'/);
  assert.match(source, /'1 accessibility preference'/);
  assert.match(source, /'5 accessibility preferences'/);
  assert.match(source, /'1 selected study companion'/);
  assert.match(source, /expectImportedSettingsControlsPersistAfterReload/);
  assert.match(source, /Dalahäst är vald som studiekompis/);
  assert.match(source, /Dala horse is selected as study companion/);
});

test('local study data import previews and applies all learner snapshot sections', () => {
  const storageById = createStorageById();
  const speech = createSpeechStub();
  const { applyLocalStudyDataImport, previewLocalStudyDataImport } = loadImportModule(storageById, {
    'expo-speech': () => speech,
  });
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
    accessibility: {
      easyReadFont: true,
      fontSizeStep: 3,
      audioPlaybackRate: 1.25,
      listenFirstAudioEnabled: true,
      themeMode: 'dark',
      invalidPreference: 'skip',
    },
    companion: {
      selectedId: 'dala-horse',
    },
    citizenshipRequirements: {
      checkedAreaIds: ['civicKnowledge', 'unknown', 'identity', 'identity'],
    },
    highlights: {
      byChapter: {
        ch01: [
          validHighlight(),
          validHighlight({
            id: 'hl-bad-range',
            startOffset: 10,
            endOffset: 10,
          }),
        ],
        ['__proto__']: [validHighlight({ id: 'hl-unsafe', chapterId: '__proto__' })],
      },
    },
  });

  const previewResult = previewLocalStudyDataImport(rawPayload);
  assert.equal(previewResult.ok, true);
  assert.equal(speech.stopCalls, 0);
  assert.deepEqual(previewResult.preview.summary, {
    completedQuestionCount: 2,
    bookmarkedQuestionCount: 1,
    wrongAnswerReviewCount: 1,
    mockExamSessionCount: 1,
    streakFreezeStateIncluded: true,
    fsrsReviewCardCount: 1,
    gradedReviewDayCount: 1,
    settingCount: 5,
    accessibilityPreferenceCount: 5,
    companionPreferenceCount: 1,
    citizenshipRequirementChecklistCount: 2,
    highlightCount: 1,
  });
  assert.deepEqual(Object.keys(previewResult.preview.highlights.byChapter), ['ch01']);
  assert.deepEqual(
    previewResult.preview.highlights.byChapter.ch01.map((highlight) => highlight.id),
    ['hl-safe-1'],
  );

  const applyResult = applyLocalStudyDataImport(previewResult.preview);
  assert.deepEqual(applyResult.summary, previewResult.preview.summary);
  assert.deepEqual(applyResult.warnings, []);
  assert.equal(speech.stopCalls, 1);

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
  assert.equal(storageById.accessibility.values.get('a11y.easyReadFont.v1'), true);
  assert.equal(storageById.accessibility.values.get('a11y.fontSizeStep.v1'), 3);
  assert.equal(storageById.accessibility.values.get('a11y.audioPlaybackRate.v1'), 1.25);
  assert.equal(storageById.accessibility.values.get('a11y.listenFirstAudio.v1'), true);
  assert.equal(storageById.accessibility.values.get('a11y.themeMode.v1'), 'dark');
  assert.equal(storageById.companion.values.get('companion.selectedId.v1'), 'dala-horse');

  const citizenshipRequirements = JSON.parse(
    storageById['citizenship-requirements'].values.get('citizenshipRequirementsChecklistState'),
  );
  assert.deepEqual(citizenshipRequirements.checkedAreaIds, ['identity', 'civicKnowledge']);

  const highlights = JSON.parse(storageById.highlights.values.get('ebook.highlights.v1'));
  assert.deepEqual(Object.keys(highlights.byChapter), ['ch01']);
  assert.deepEqual(
    highlights.byChapter.ch01.map((highlight) => highlight.note),
    ['Portable margin note'],
  );
});

test('local study data import stops active speech once when imported audioEnabled is false', () => {
  const storageById = createStorageById();
  storageById.settings.set('audioEnabled', true);
  const speech = createSpeechStub();
  const { applyLocalStudyDataImport, previewLocalStudyDataImport } = loadImportModule(storageById, {
    'expo-speech': () => speech,
  });

  const previewResult = previewLocalStudyDataImport(
    JSON.stringify({
      version: 1,
      settings: {
        audioEnabled: false,
      },
    }),
  );

  assert.equal(previewResult.ok, true);
  assert.deepEqual(previewResult.preview.settings, { audioEnabled: false });
  assert.equal(speech.stopCalls, 0);

  applyLocalStudyDataImport(previewResult.preview);

  assert.equal(speech.stopCalls, 1);
  assert.equal(storageById.settings.values.get('audioEnabled'), false);
});

test('local study data import does not stop speech when audioEnabled is true absent or invalid', () => {
  const cases = [
    {
      name: 'true',
      settings: {
        audioEnabled: true,
      },
    },
    {
      name: 'absent',
      settings: {
        language: 'en',
      },
    },
    {
      name: 'invalid',
      settings: {
        language: 'en',
        audioEnabled: 'false',
      },
    },
  ];

  for (const { name, settings } of cases) {
    const storageById = createStorageById();
    storageById.settings.set('audioEnabled', true);
    const speech = createSpeechStub();
    const { applyLocalStudyDataImport, previewLocalStudyDataImport } = loadImportModule(
      storageById,
      {
        'expo-speech': () => speech,
      },
    );

    const previewResult = previewLocalStudyDataImport(
      JSON.stringify({
        version: 1,
        settings,
      }),
    );

    assert.equal(previewResult.ok, true, name);
    assert.notEqual(previewResult.preview.settings.audioEnabled, false, name);

    applyLocalStudyDataImport(previewResult.preview);

    assert.equal(speech.stopCalls, 0, name);
    assert.equal(storageById.settings.values.get('audioEnabled'), true, name);
  }
});

test('local study data import apply result reports section write warnings', () => {
  const storageById = {
    accessibility: createThrowingSetMMKV('accessibility disk full'),
    'citizenship-requirements': createThrowingSetMMKV('requirements disk full'),
    companion: createThrowingSetMMKV('companion disk full'),
    progress: createThrowingSetMMKV('progress disk full'),
    'mistake-review': createThrowingSetMMKV('mistake disk full'),
    reviews: createThrowingSetMMKV('reviews disk full'),
    settings: createThrowingSetMMKV('settings disk full'),
    highlights: createThrowingSetMMKV('highlights disk full'),
  };
  const { applyLocalStudyDataImport, previewLocalStudyDataImport } = loadImportModule(storageById);
  const rawPayload = JSON.stringify({
    version: 1,
    progress: {
      completedQuestionIds: ['q001'],
      questionProgress: {
        q001: {
          seenCount: 1,
          correctCount: 1,
          wrongCount: 0,
          correctStreak: 1,
          bookmarked: true,
          lastAnsweredAt: '2026-05-20T08:00:00.000Z',
          nextReviewAt: '2026-05-21T08:00:00.000Z',
        },
      },
      mockExamSessions: [
        {
          sessionId: 'mock-1',
          score: 1,
          completedAt: '2026-05-20T09:00:00.000Z',
          correctCount: 1,
          totalCount: 1,
        },
      ],
    },
    mistakeReview: {
      wrongAnswerReviews: {
        q001: {
          answeredAt: '2026-05-20T08:05:00.000Z',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
      },
    },
    reviews: {
      byId: {
        q001: validReviewCard('q001'),
      },
      gradedPerDay: {
        '2026-05-20': 1,
      },
    },
    settings: {
      language: 'en',
      audioEnabled: false,
      dailyGoalAnswers: 20,
    },
    accessibility: {
      easyReadFont: true,
      themeMode: 'dark',
    },
    companion: {
      selectedId: 'dala-horse',
    },
    citizenshipRequirements: {
      checkedAreaIds: ['identity'],
    },
    highlights: {
      byChapter: {
        ch01: [validHighlight()],
      },
    },
  });

  const previewResult = previewLocalStudyDataImport(rawPayload);
  assert.equal(previewResult.ok, true);

  const applyResult = applyLocalStudyDataImport(previewResult.preview);
  assert.deepEqual(applyResult.summary, previewResult.preview.summary);
  assert.deepEqual(
    applyResult.warnings.map((item) => item.section),
    [
      'accessibility',
      'companion',
      'progress',
      'mistakeReview',
      'reviews',
      'settings',
      'citizenshipRequirements',
      'highlights',
    ],
  );
  for (const item of applyResult.warnings) {
    assert.equal(item.warning.type, 'recoverable-persistence-warning');
    assert.equal(item.warning.recoverable, true);
    assert.equal(item.warning.operation, 'write');
    assert.match(item.warning.message, /using in-memory state for this session/);
  }
});

test('local study data import summary reports plural bookmark wrong-answer mock exam FSRS settings and citizenship rows', () => {
  const storageById = createStorageById();
  const { applyLocalStudyDataImport, previewLocalStudyDataImport } = loadImportModule(storageById);
  const rawPayload = JSON.stringify({
    version: 1,
    progress: {
      completedQuestionIds: ['q001', 'q002', 'q003'],
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
        q002: {
          seenCount: 2,
          correctCount: 1,
          wrongCount: 1,
          correctStreak: 1,
          bookmarked: true,
          lastAnsweredAt: '2026-05-21T08:00:00.000Z',
          nextReviewAt: '2026-05-22T08:00:00.000Z',
        },
      },
      mockExamSessions: [
        {
          sessionId: 'mock-1',
          score: 0.75,
          completedAt: '2026-05-20T09:00:00.000Z',
          correctCount: 3,
          totalCount: 4,
        },
        {
          sessionId: 'mock-2',
          score: 0.8,
          completedAt: '2026-05-21T09:00:00.000Z',
          correctCount: 4,
          totalCount: 5,
        },
      ],
      streakFreezeState: {
        available: 2,
        lastEarnedAt: '2026-05-21',
        lifetimeEarned: 5,
        lifetimeSpent: 1,
        rescuedDayKeys: ['2026-05-19', '2026-05-20'],
      },
    },
    mistakeReview: {
      wrongAnswerReviews: {
        q001: {
          answeredAt: '2026-05-20T08:05:00.000Z',
          selectedOptionTextEn: 'Wrong answer',
          selectedOptionTextSv: 'Fel svar',
        },
        q002: {
          answeredAt: '2026-05-21T08:05:00.000Z',
          selectedOptionTextEn: 'Another wrong answer',
          selectedOptionTextSv: 'Ännu ett fel svar',
        },
      },
    },
    reviews: {
      byId: {
        q001: validReviewCard('q001'),
        q002: {
          ...validReviewCard('q002'),
          difficulty: 4,
          stability: 6,
          reps: 3,
          lapses: 1,
          lastReviewAt: '2026-05-21T08:00:00.000Z',
          dueAt: '2026-05-22T08:00:00.000Z',
        },
      },
      gradedPerDay: {
        '2026-05-20': 2,
        '2026-05-21': 1,
      },
    },
    settings: {
      language: 'en',
      audioEnabled: false,
      dailyGoalAnswers: 20,
      includeSupplementaryQuestions: true,
      hasSeenAboutTheTest: true,
    },
    citizenshipRequirements: {
      checkedAreaIds: ['conduct', 'identity', 'residenceStatus', 'identity', 'unknown'],
    },
    highlights: {
      byChapter: {
        ch01: [
          validHighlight({
            id: 'hl-plural-1',
            note: 'First portable note',
          }),
        ],
        ch02: [
          validHighlight({
            id: 'hl-plural-2',
            chapterId: 'ch02',
            blockId: 'democracy-1',
            startOffset: 0,
            endOffset: 9,
            note: 'Second portable note',
          }),
        ],
      },
    },
  });

  const previewResult = previewLocalStudyDataImport(rawPayload);
  assert.equal(previewResult.ok, true);
  assert.deepEqual(previewResult.preview.summary, {
    completedQuestionCount: 3,
    bookmarkedQuestionCount: 2,
    wrongAnswerReviewCount: 2,
    mockExamSessionCount: 2,
    streakFreezeStateIncluded: true,
    fsrsReviewCardCount: 2,
    gradedReviewDayCount: 2,
    settingCount: 5,
    accessibilityPreferenceCount: 0,
    companionPreferenceCount: 0,
    citizenshipRequirementChecklistCount: 3,
    highlightCount: 2,
  });
  assert.deepEqual(previewResult.preview.citizenshipRequirements.checkedAreaIds, [
    'identity',
    'residenceStatus',
    'conduct',
  ]);

  const applyResult = applyLocalStudyDataImport(previewResult.preview);
  assert.deepEqual(applyResult.summary, previewResult.preview.summary);
  assert.deepEqual(applyResult.warnings, []);

  const progress = JSON.parse(storageById.progress.values.get('progressState'));
  assert.deepEqual(progress.completedQuestionIds, ['q001', 'q002', 'q003']);
  assert.deepEqual(
    Object.entries(progress.questionProgress)
      .filter(([, value]) => value.bookmarked === true)
      .map(([questionId]) => questionId),
    ['q001', 'q002'],
  );
  assert.deepEqual(
    progress.mockExamSessions.map((session) => session.sessionId),
    ['mock-1', 'mock-2'],
  );

  const mistakeReview = JSON.parse(storageById['mistake-review'].values.get('mistakeReviewState'));
  assert.deepEqual(Object.keys(mistakeReview.wrongAnswerReviews), ['q001', 'q002']);

  const reviews = JSON.parse(storageById.reviews.values.get('learning.reviews.cards.v1'));
  assert.deepEqual(Object.keys(reviews.byId), ['q001', 'q002']);
  assert.deepEqual(reviews.gradedPerDay, { '2026-05-20': 2, '2026-05-21': 1 });

  const checkedAreaIds = JSON.parse(
    storageById['citizenship-requirements'].values.get('citizenshipRequirements.checkedAreaIds.v1'),
  );
  const legacyChecklist = JSON.parse(
    storageById['citizenship-requirements'].values.get('citizenshipRequirementsChecklistState'),
  );
  assert.deepEqual(checkedAreaIds, ['identity', 'residenceStatus', 'conduct']);
  assert.deepEqual(legacyChecklist.checkedAreaIds, checkedAreaIds);

  const highlights = JSON.parse(storageById.highlights.values.get('ebook.highlights.v1'));
  assert.deepEqual(Object.keys(highlights.byChapter), ['ch01', 'ch02']);
  assert.equal(highlights.byChapter.ch01[0].note, 'First portable note');
  assert.equal(highlights.byChapter.ch02[0].note, 'Second portable note');
});

test('local study data import summary nonzero focus validates localized preview rows', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-content.js', '--focus-settings-import-summary-nonzero'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  const output = `${result.stdout}\n${result.stderr}`;
  const match = result.stdout.match(/\{[\s\S]*\}/);

  assert.equal(result.status, 0, output);
  assert.ok(match, 'focused import summary validation should print JSON summary');
  const summary = JSON.parse(match[0]);
  assert.equal(summary.settingsImportSummaryNonzeroValidated, true);
  assert.equal(summary.settingsImportSummaryLocalesValidated, 2);
  assert.equal(summary.settingsImportSummaryHiddenZeroRowsValidated, 4);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, 'questionSchemasValidated'), false);
  assert.match(output, /settingsImportSummaryNonzeroValidated/);
});

test('local study data export round-trips citizenship requirements without purchase fields', () => {
  const sourceStorageById = createStorageById();
  sourceStorageById['citizenship-requirements'].set(
    'citizenshipRequirementsChecklistState',
    JSON.stringify({
      checkedAreaIds: ['selfSupport', 'identity', 'prototype', 'swedishLanguage', 'identity'],
    }),
  );
  sourceStorageById.highlights.set(
    'ebook.highlights.v1',
    JSON.stringify({
      byChapter: {
        ch01: [validHighlight({ id: 'hl-exported', note: 'Exported note' })],
      },
    }),
  );
  sourceStorageById.settings.set('language', 'en');
  sourceStorageById.settings.set('dailyGoalAnswers', 20);
  sourceStorageById.settings.set('mockExamRealisticMode', true);
  sourceStorageById.accessibility.set('a11y.easyReadFont.v1', true);
  sourceStorageById.accessibility.set('a11y.fontSizeStep.v1', 2);
  sourceStorageById.accessibility.set('a11y.audioPlaybackRate.v1', 1.25);
  sourceStorageById.accessibility.set('a11y.listenFirstAudio.v1', true);
  sourceStorageById.accessibility.set('a11y.themeMode.v1', 'dark');
  sourceStorageById.companion.set('companion.selectedId.v1', 'lucia');

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
  assert.deepEqual(
    snapshot.highlights.byChapter.ch01.map((highlight) => highlight.id),
    ['hl-exported'],
  );
  assert.equal(snapshot.settings.language, 'en');
  assert.equal(snapshot.settings.dailyGoalAnswers, 20);
  assert.equal(snapshot.settings.mockExamRealisticMode, true);
  assert.deepEqual(snapshot.accessibility, {
    easyReadFont: true,
    fontSizeStep: 2,
    audioPlaybackRate: 1.25,
    listenFirstAudioEnabled: true,
    themeMode: 'dark',
  });
  assert.deepEqual(snapshot.companion, { selectedId: 'lucia' });
  assert.doesNotMatch(JSON.stringify(snapshot), /purchase|receipt|entitlement|removeAds/i);

  const targetStorageById = createStorageById();
  const { applyLocalStudyDataImport, previewLocalStudyDataImport } =
    loadImportModule(targetStorageById);
  const previewResult = previewLocalStudyDataImport(
    serializeLocalStudyDataExport('2026-05-21T08:00:00.000Z'),
  );

  assert.equal(previewResult.ok, true);
  assert.equal(previewResult.preview.summary.citizenshipRequirementChecklistCount, 3);
  assert.equal(previewResult.preview.summary.highlightCount, 1);
  assert.equal(previewResult.preview.summary.settingCount, 6);
  assert.equal(previewResult.preview.summary.accessibilityPreferenceCount, 5);
  assert.equal(previewResult.preview.summary.companionPreferenceCount, 1);
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
  const restoredHighlights = JSON.parse(
    targetStorageById.highlights.values.get('ebook.highlights.v1'),
  );
  assert.deepEqual(
    restoredHighlights.byChapter.ch01.map((highlight) => highlight.note),
    ['Exported note'],
  );
  assert.equal(targetStorageById.accessibility.values.get('a11y.easyReadFont.v1'), true);
  assert.equal(targetStorageById.accessibility.values.get('a11y.fontSizeStep.v1'), 2);
  assert.equal(targetStorageById.accessibility.values.get('a11y.audioPlaybackRate.v1'), 1.25);
  assert.equal(targetStorageById.accessibility.values.get('a11y.listenFirstAudio.v1'), true);
  assert.equal(targetStorageById.accessibility.values.get('a11y.themeMode.v1'), 'dark');
  assert.equal(targetStorageById.companion.values.get('companion.selectedId.v1'), 'lucia');
});

test('local study data import omits malformed daily-goal settings before applying', () => {
  const storageById = createStorageById();
  storageById.settings.set('dailyGoalAnswers', 20);
  const { applyLocalStudyDataImport, previewLocalStudyDataImport } = loadImportModule(storageById);
  const rawPayload = JSON.stringify({
    version: 1,
    settings: {
      language: 'en',
      dailyGoalAnswers: 19.6,
      audioEnabled: false,
    },
  });

  const previewResult = previewLocalStudyDataImport(rawPayload);
  assert.equal(previewResult.ok, true);
  assert.deepEqual(previewResult.preview.settings, {
    language: 'en',
    audioEnabled: false,
  });
  assert.equal(previewResult.preview.summary.settingCount, 2);

  applyLocalStudyDataImport(previewResult.preview);

  assert.equal(storageById.settings.values.get('language'), 'en');
  assert.equal(storageById.settings.values.get('audioEnabled'), false);
  assert.equal(storageById.settings.values.get('dailyGoalAnswers'), 20);
});

test('local study data import omits malformed accessibility and companion preferences before applying', () => {
  const storageById = createStorageById();
  storageById.accessibility.set('a11y.fontSizeStep.v1', 2);
  storageById.accessibility.set('a11y.audioPlaybackRate.v1', 0.75);
  storageById.accessibility.set('a11y.themeMode.v1', 'dark');
  storageById.companion.set('companion.selectedId.v1', 'lucia');
  const { applyLocalStudyDataImport, previewLocalStudyDataImport } = loadImportModule(storageById);
  const rawPayload = JSON.stringify({
    version: 1,
    accessibility: {
      easyReadFont: true,
      fontSizeStep: 8,
      audioPlaybackRate: 1.5,
      listenFirstAudioEnabled: true,
      themeMode: 'sepia',
    },
    companion: {
      selectedId: 'not-a-mascot',
    },
  });

  const previewResult = previewLocalStudyDataImport(rawPayload);
  assert.equal(previewResult.ok, true);
  assert.deepEqual(previewResult.preview.accessibility, {
    easyReadFont: true,
    listenFirstAudioEnabled: true,
  });
  assert.deepEqual(previewResult.preview.companion, {});
  assert.equal(previewResult.preview.summary.accessibilityPreferenceCount, 2);
  assert.equal(previewResult.preview.summary.companionPreferenceCount, 0);

  applyLocalStudyDataImport(previewResult.preview);

  assert.equal(storageById.accessibility.values.get('a11y.easyReadFont.v1'), true);
  assert.equal(storageById.accessibility.values.get('a11y.listenFirstAudio.v1'), true);
  assert.equal(storageById.accessibility.values.get('a11y.fontSizeStep.v1'), 2);
  assert.equal(storageById.accessibility.values.get('a11y.audioPlaybackRate.v1'), 0.75);
  assert.equal(storageById.accessibility.values.get('a11y.themeMode.v1'), 'dark');
  assert.equal(storageById.companion.values.get('companion.selectedId.v1'), 'lucia');
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
  assertNoSnapshotWrites(storageById);
});

test('local study data import rejects nested purchase fields with useful detail', () => {
  const storageById = createStorageById();
  const { previewLocalStudyDataImport } = loadImportModule(storageById);
  const result = previewLocalStudyDataImport(
    JSON.stringify({
      version: 1,
      progress: {
        completedQuestionIds: ['q001'],
        history: [{ removeAdsReceipt: true }],
      },
    }),
  );

  assert.deepEqual(result, {
    ok: false,
    code: 'purchase_fields_rejected',
    detail: 'progress.history.0.removeAdsReceipt',
  });
  assertNoSnapshotWrites(storageById);
});

test('local study data import formats rejected field details with bounded head and tail', () => {
  const storageById = createStorageById();
  const { formatLocalStudyDataImportErrorDetail } = loadImportModule(storageById);
  const longPath = [
    'source',
    ...Array.from({ length: 80 }, (_, index) => `level${index}`),
    'removeAdsReceipt',
  ].join('.');
  const longKey = `removeAdsReceipt${'x'.repeat(120)}transaction`;

  assert.equal(formatLocalStudyDataImportErrorDetail('purchase'), 'purchase');
  assert.equal(
    formatLocalStudyDataImportErrorDetail(longPath),
    'source.level0.level1.[...].level79.removeAdsReceipt',
  );
  assert.equal(
    formatLocalStudyDataImportErrorDetail(`source.${longKey}`),
    `source.removeAdsReceiptxxxxxxxxxxxx...xtransaction`,
  );
  assert.equal(formatLocalStudyDataImportErrorDetail(''), null);
  assert.equal(formatLocalStudyDataImportErrorDetail(), null);
  assert.ok(
    formatLocalStudyDataImportErrorDetail(longPath).length < 80,
    'deep rejected field detail should stay short enough for alert text',
  );
  assert.ok(
    !formatLocalStudyDataImportErrorDetail(longPath).includes('level2.level3.level4'),
    'deep rejected field detail should not render the entire middle path',
  );
});

test('local study data import rejects deeply nested payloads without throwing or writing', () => {
  const storageById = createStorageById();
  const { LOCAL_STUDY_DATA_IMPORT_MAX_BYTES, previewLocalStudyDataImport } =
    loadImportModule(storageById);
  const deepObjectDepth = 5000;
  const rawPayload = [
    '{"version":1,"progress":',
    '{"x":'.repeat(deepObjectDepth),
    '0',
    '}'.repeat(deepObjectDepth),
    '}',
  ].join('');

  assert.ok(Buffer.byteLength(rawPayload, 'utf8') < LOCAL_STUDY_DATA_IMPORT_MAX_BYTES);
  const result = previewLocalStudyDataImport(rawPayload);

  assert.deepEqual(result, { ok: false, code: 'empty_import' });
  assertNoSnapshotWrites(storageById);
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
    assertNoSnapshotWrites(storageById);
  } finally {
    JSON.parse = originalParse;
  }
});

test('local study data import exposes the same UTF-8 byte counter used by preview guard', () => {
  const storageById = createStorageById();
  const { getLocalStudyDataImportPayloadByteCount } = loadImportModule(storageById);

  assert.equal(getLocalStudyDataImportPayloadByteCount('abc'), 3);
  assert.equal(getLocalStudyDataImportPayloadByteCount('å'), 2);
  assert.equal(getLocalStudyDataImportPayloadByteCount('🙂'), 4);
  assert.equal(getLocalStudyDataImportPayloadByteCount('aå🙂'), Buffer.byteLength('aå🙂', 'utf8'));
});

test('local study data import rejects multibyte payloads by UTF-8 byte size', () => {
  const storageById = createStorageById();
  const {
    LOCAL_STUDY_DATA_IMPORT_MAX_BYTES,
    getLocalStudyDataImportPayloadByteCount,
    previewLocalStudyDataImport,
  } = loadImportModule(storageById);
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
    assert.equal(
      getLocalStudyDataImportPayloadByteCount(nonLatinPayload),
      LOCAL_STUDY_DATA_IMPORT_MAX_BYTES + 2,
    );
    assert.equal(
      getLocalStudyDataImportPayloadByteCount(emojiPayload),
      LOCAL_STUDY_DATA_IMPORT_MAX_BYTES + 4,
    );

    assert.deepEqual(previewLocalStudyDataImport(nonLatinPayload), {
      ok: false,
      code: 'input_too_large',
    });
    assert.deepEqual(previewLocalStudyDataImport(emojiPayload), {
      ok: false,
      code: 'input_too_large',
    });
    assert.equal(parseCalls, 0);
    assertNoSnapshotWrites(storageById);
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
      "answerHistory": [
        {
          "questionId": "q001",
          "isCorrect": true,
          "answeredAt": "2026-05-20T08:00:00.000Z"
        },
        {
          "questionId": " __proto__ ",
          "isCorrect": true,
          "answeredAt": "2026-05-20T08:01:00.000Z"
        },
        {
          "questionId": "constructor",
          "isCorrect": true,
          "answeredAt": "2026-05-20T08:02:00.000Z"
        },
        {
          "questionId": "prototype",
          "isCorrect": true,
          "answeredAt": "2026-05-20T08:03:00.000Z"
        }
      ],
      "mockExamSessions": [
        {
          "sessionId": "safe-session",
          "score": 1,
          "completedAt": "2026-05-20T08:10:00.000Z",
          "correctCount": 1,
          "totalCount": 1,
          "questionTimings": [
            { "questionId": "q001", "timeSpentSeconds": 12 },
            { "questionId": " __proto__ ", "timeSpentSeconds": 13 },
            { "questionId": "constructor", "timeSpentSeconds": 14 },
            { "questionId": "prototype", "timeSpentSeconds": 15 }
          ]
        }
      ],
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
  assert.deepEqual(
    progress.answerHistory.map((entry) => entry.questionId),
    ['q001'],
  );
  assert.deepEqual(progress.mockExamSessions[0].questionTimings, [
    { questionId: 'q001', timeSpentSeconds: 12 },
  ]);
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
    'lib/storage/highlightsStore.ts',
  ]) {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    assert.match(source, /isSafeImportedMapKey/);
    assert.doesNotMatch(source, /new Set\(\[['"]__proto__['"]/);
  }
});
