const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  createMemoryMMKV,
  createThrowingReadMMKV,
  createThrowingSetMMKV,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');
const LOCAL_STUDY_CORRUPT_JSON_FOCUS_FLAG = '--focus-local-study-corrupt-json-warnings';
const LOCAL_STUDY_CORRUPT_JSON_SUMMARY_KEYS = [
  'localStudyCorruptJsonStoresValidated',
  'localStudyCorruptJsonRecoverableReadWarningTestsValidated',
  'localStudyCorruptJsonWarningParityValidated',
];

function runFocusedLocalStudyCorruptJsonValidation() {
  return spawnSync(
    process.execPath,
    ['scripts/validate-content.js', LOCAL_STUDY_CORRUPT_JSON_FOCUS_FLAG],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
}

function runFocusedLocalStudyCorruptJsonValidationWithMutations(mutations) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const mutations = ${JSON.stringify(mutations)};
const originalReadFileSync = fs.readFileSync;

fs.readFileSync = function readFileSync(filePath, ...args) {
  const contents = originalReadFileSync.call(this, filePath, ...args);
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const mutation = mutations.find((candidate) => normalizedPath.endsWith(candidate.file));

  if (!mutation) return contents;

  const isString = typeof contents === 'string';
  let next = isString ? contents : contents.toString();

  for (const replacement of mutation.replacements) {
    if (!next.includes(replacement.from)) {
      throw new Error(\`mutation target not found in \${mutation.file}: \${replacement.from}\`);
    }
    next = next.split(replacement.from).join(replacement.to);
  }

  return isString ? next : Buffer.from(next);
};

process.argv.push('${LOCAL_STUDY_CORRUPT_JSON_FOCUS_FLAG}');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

function parseValidationSummary(stdout) {
  const match = stdout.match(/\{[\s\S]*\}/);
  assert.ok(match, 'focused local study corrupt JSON validation should print a JSON summary');
  return JSON.parse(match[0]);
}

function loadPersistenceWarningNoticeModule() {
  return loadTsWithStorage(
    repoRoot,
    'components/storage/PersistenceWarningNotice.tsx',
    {},
    {
      'react-native': () => ({
        Pressable: 'Pressable',
        StyleSheet: {
          create: (styles) => styles,
          hairlineWidth: 1,
        },
        Text: 'Text',
        View: 'View',
      }),
    },
  );
}

function createFailOnceMMKV(message = 'disk full') {
  const storage = createMemoryMMKV();
  let shouldFail = true;

  return {
    ...storage,
    set(key, value) {
      if (shouldFail) {
        shouldFail = false;
        throw new Error(message);
      }

      storage.set(key, value);
    },
  };
}

function runPersistenceWarningScopeMutation(mutations) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      `
const fs = require('node:fs');
const mutations = ${JSON.stringify(mutations)};
const originalReadFileSync = fs.readFileSync;

fs.readFileSync = function readFileSync(filePath, ...args) {
  const contents = originalReadFileSync.call(this, filePath, ...args);
  const normalizedPath = String(filePath).replace(/\\\\/g, '/');
  const mutation = mutations.find((candidate) => normalizedPath.endsWith(candidate.file));

  if (!mutation) return contents;

  const isString = typeof contents === 'string';
  let next = isString ? contents : contents.toString();

  for (const replacement of mutation.replacements) {
    next = next.split(replacement.from).join(replacement.to);
  }

  return isString ? next : Buffer.from(next);
};

process.argv.push('--focus-persistence-warning-scope');
require('./scripts/validate-content.js');
`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
}

function expectPersistenceWarningScopeMutationFailure(testName, mutations, expectedMessage) {
  test(testName, () => {
    const result = runPersistenceWarningScopeMutation(mutations);

    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, expectedMessage);
  });
}

test('progress writes keep in-memory answers and expose recoverable warnings', () => {
  const storage = createFailOnceMMKV();
  const { useProgressStore } = loadTsWithStorage(repoRoot, 'lib/storage/progressStore.ts', {
    progress: storage,
  });

  useProgressStore.getState().recordAnswer('q001', false);

  let state = useProgressStore.getState();
  assert.deepEqual(state.completedQuestionIds, ['q001']);
  assert.equal(state.questionProgress.q001.wrongCount, 1);
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.storageId, 'progress');
  assert.equal(state.persistenceWarning.key, 'progressState');
  assert.equal(state.persistenceWarning.operation, 'write');
  assert.match(state.persistenceWarning.errorMessage, /disk full/);

  state.toggleBookmark('q001');
  state = useProgressStore.getState();
  assert.equal(state.persistenceWarning, null);
  assert.equal(state.questionProgress.q001.bookmarked, true);
  assert.match(storage.values.get('progressState'), /"bookmarked":true/);
});

test('progress corrupt JSON reads fall back with a recoverable read warning', () => {
  const storage = createMemoryMMKV({ progressState: '{broken' });
  const { useProgressStore } = loadTsWithStorage(repoRoot, 'lib/storage/progressStore.ts', {
    progress: storage,
  });

  let state = useProgressStore.getState();
  assert.deepEqual(state.completedQuestionIds, []);
  assert.deepEqual(state.questionProgress, {});
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.operation, 'read');
  assert.equal(state.persistenceWarning.storageId, 'progress');
  assert.equal(state.persistenceWarning.key, 'progressState');
  assert.match(state.persistenceWarning.errorMessage, /JSON|Unexpected|position/i);

  state.recordAnswer('q001', true);
  state = useProgressStore.getState();
  assert.equal(state.persistenceWarning, null);
  assert.equal(
    JSON.parse(storage.values.get('progressState')).questionProgress.q001.correctCount,
    1,
  );
});

test('settings writes keep in-memory choices and clear warnings after a later successful write', () => {
  const storage = createFailOnceMMKV();
  const { useSettingsStore } = loadTsWithStorage(repoRoot, 'lib/storage/settingsStore.ts', {
    settings: storage,
  });

  useSettingsStore.getState().setLanguage('en');

  let state = useSettingsStore.getState();
  assert.equal(state.language, 'en');
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.storageId, 'settings');
  assert.equal(state.persistenceWarning.key, 'language');

  state.setAudioEnabled(false);
  state = useSettingsStore.getState();
  assert.equal(state.audioEnabled, false);
  assert.equal(state.persistenceWarning, null);
  assert.equal(storage.values.get('audioEnabled'), false);
});

test('settings read failures fall back to defaults with a recoverable warning', () => {
  const storage = createThrowingReadMMKV('settings read failed');
  const { useSettingsStore } = loadTsWithStorage(repoRoot, 'lib/storage/settingsStore.ts', {
    settings: storage,
  });

  let state = useSettingsStore.getState();
  assert.equal(state.language, 'sv');
  assert.equal(state.audioEnabled, true);
  assert.equal(state.dailyGoalAnswers, 10);
  assert.equal(state.includeSupplementaryQuestions, false);
  assert.equal(state.hasSeenAboutTheTest, false);
  assert.equal(state.studyPlanTestDateIso, null);
  assert.equal(state.studyPlanIntensity, 'regular');
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.operation, 'read');
  assert.equal(state.persistenceWarning.storageId, 'settings');
  assert.equal(state.persistenceWarning.key, 'language');
  assert.match(state.persistenceWarning.errorMessage, /settings read failed/);

  state.setLanguage('en');
  state = useSettingsStore.getState();
  assert.equal(state.language, 'en');
  assert.equal(state.persistenceWarning, null);
});

test('mistake-review writes keep selected answers and expose dismissible warnings', () => {
  const storage = createThrowingSetMMKV('disk full');
  const { useMistakeReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/mistakeReviewStore.ts',
    {
      'mistake-review': storage,
    },
  );

  useMistakeReviewStore.getState().recordWrongAnswerReview({
    questionId: 'q001',
    selectedOptionTextEn: 'Southern Europe',
    selectedOptionTextSv: 'Södra Europa',
  });

  let state = useMistakeReviewStore.getState();
  assert.equal(state.wrongAnswerReviews.q001.selectedOptionTextEn, 'Southern Europe');
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.storageId, 'mistake-review');
  assert.equal(state.persistenceWarning.key, 'mistakeReviewState');

  state.clearPersistenceWarning();
  state = useMistakeReviewStore.getState();
  assert.equal(state.persistenceWarning, null);
});

test('mistake-review corrupt JSON reads fall back with a recoverable read warning', () => {
  const storage = createMemoryMMKV({ mistakeReviewState: '{broken' });
  const { useMistakeReviewStore } = loadTsWithStorage(
    repoRoot,
    'lib/storage/mistakeReviewStore.ts',
    {
      'mistake-review': storage,
    },
  );

  let state = useMistakeReviewStore.getState();
  assert.deepEqual(state.wrongAnswerReviews, {});
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.operation, 'read');
  assert.equal(state.persistenceWarning.storageId, 'mistake-review');
  assert.equal(state.persistenceWarning.key, 'mistakeReviewState');
  assert.match(state.persistenceWarning.errorMessage, /JSON|Unexpected|position/i);

  state.recordWrongAnswerReview({
    questionId: 'q001',
    selectedOptionTextEn: 'Southern Europe',
    selectedOptionTextSv: 'Södra Europa',
  });
  state = useMistakeReviewStore.getState();
  assert.equal(state.persistenceWarning, null);
  assert.equal(
    JSON.parse(storage.values.get('mistakeReviewState')).wrongAnswerReviews.q001
      .selectedOptionTextEn,
    'Southern Europe',
  );
});

test('highlight corrupt JSON reads fall back with a recoverable read warning', () => {
  const storage = createMemoryMMKV({ 'ebook.highlights.v1': '{broken' });
  const { useHighlightsStore } = loadTsWithStorage(repoRoot, 'lib/storage/highlightsStore.ts', {
    highlights: storage,
  });

  let state = useHighlightsStore.getState();
  assert.deepEqual(state.byChapter, {});
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.operation, 'read');
  assert.equal(state.persistenceWarning.storageId, 'highlights');
  assert.equal(state.persistenceWarning.key, 'ebook.highlights.v1');
  assert.match(state.persistenceWarning.errorMessage, /JSON|Unexpected|position/i);

  const created = state.addHighlight({
    chapterId: 'ch01',
    blockId: 'intro',
    startOffset: 1,
    endOffset: 3,
    color: 'yellow',
  });
  state = useHighlightsStore.getState();
  assert.ok(created);
  assert.equal(state.persistenceWarning, null);
  assert.equal(JSON.parse(storage.values.get('ebook.highlights.v1')).byChapter.ch01.length, 1);
});

test('local study corrupt JSON warnings report focused validator coverage', () => {
  const result = runFocusedLocalStudyCorruptJsonValidation();

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const summary = parseValidationSummary(result.stdout);

  assert.deepEqual(Object.keys(summary).sort(), [...LOCAL_STUDY_CORRUPT_JSON_SUMMARY_KEYS].sort());
  assert.equal(summary.localStudyCorruptJsonStoresValidated, 5);
  assert.equal(summary.localStudyCorruptJsonRecoverableReadWarningTestsValidated, 5);
  assert.equal(summary.localStudyCorruptJsonWarningParityValidated, true);
});

test('local study corrupt JSON focused validator rejects dropped store warning propagation', () => {
  const mutationCases = [
    {
      label: 'progress',
      file: 'lib/storage/progressStore.ts',
      replacements: [{ from: 'parseJsonRecoverably(', to: 'parseJsonWithoutWarning(' }],
      expectedFailure: /progress store corrupt JSON warning path is missing parseJsonRecoverably/,
    },
    {
      label: 'mistake review',
      file: 'lib/storage/mistakeReviewStore.ts',
      replacements: [
        {
          from: 'persistenceWarning: parseResult.warning ?? readResult.warning',
          to: 'persistenceWarning: readResult.warning',
        },
      ],
      expectedFailure:
        /mistake review store corrupt JSON warning path is missing persistenceWarning: parseResult\.warning \?\? readResult\.warning/,
    },
    {
      label: 'review',
      file: 'lib/storage/reviewStore.ts',
      replacements: [{ from: 'parseJsonRecoverably(', to: 'parseJsonWithoutWarning(' }],
      expectedFailure: /review store corrupt JSON warning path is missing parseJsonRecoverably/,
    },
    {
      label: 'highlights',
      file: 'lib/storage/highlightsStore.ts',
      replacements: [
        {
          from: 'persistenceWarning: parsed.warning ?? result.warning',
          to: 'persistenceWarning: result.warning',
        },
      ],
      expectedFailure:
        /highlights store corrupt JSON warning path is missing persistenceWarning: parsed\.warning \?\? result\.warning/,
    },
    {
      label: 'citizenship requirements primary',
      file: 'lib/storage/citizenshipRequirementsStore.ts',
      replacements: [
        {
          from: 'const parseResult = parseJsonRecoverably(',
          to: 'const parseResult = parseJsonWithoutWarning(',
        },
      ],
      expectedFailure:
        /citizenship requirements primary store corrupt JSON warning path is missing parseJsonRecoverably for citizenshipRequirements\.checkedAreaIds\.v1/,
    },
    {
      label: 'citizenship requirements legacy',
      file: 'lib/storage/citizenshipRequirementsStore.ts',
      replacements: [
        {
          from: 'const legacyParseResult = parseJsonRecoverably(',
          to: 'const legacyParseResult = parseJsonWithoutWarning(',
        },
      ],
      expectedFailure:
        /citizenship requirements legacy store corrupt JSON warning path is missing parseJsonRecoverably for citizenshipRequirementsChecklistState/,
    },
  ];

  for (const mutationCase of mutationCases) {
    const result = runFocusedLocalStudyCorruptJsonValidationWithMutations([
      {
        file: mutationCase.file,
        replacements: mutationCase.replacements,
      },
    ]);
    const output = `${result.stdout}\n${result.stderr}`;

    assert.notEqual(result.status, 0, `${mutationCase.label} mutation should fail validation`);
    assert.match(output, mutationCase.expectedFailure, mutationCase.label);
  }
});

test('local study corrupt JSON focused validator rejects missing warning detail assertions', () => {
  const mutationCases = [
    {
      label: 'progress storage id',
      file: 'tests/content-storage-write-fail-soft.test.js',
      replacements: [
        {
          from: "persistenceWarning.storageId, 'progress'",
          to: "persistenceWarning.storageId, 'not-progress'",
        },
      ],
      expectedFailure:
        /progress corrupt JSON warning test is missing persistenceWarning\.storageId, 'progress'/,
    },
    {
      label: 'mistake-review key',
      file: 'tests/content-storage-write-fail-soft.test.js',
      replacements: [
        {
          from: "persistenceWarning.key, 'mistakeReviewState'",
          to: "persistenceWarning.key, 'not-mistakeReviewState'",
        },
      ],
      expectedFailure:
        /mistake review corrupt JSON warning test is missing persistenceWarning\.key, 'mistakeReviewState'/,
    },
    {
      label: 'highlight parse error detail',
      file: 'tests/content-storage-write-fail-soft.test.js',
      replacements: [
        {
          from: "assert.equal(state.persistenceWarning.key, 'ebook.highlights.v1');\n  assert.match(state.persistenceWarning.errorMessage, /JSON|Unexpected|position/i);",
          to: "assert.equal(state.persistenceWarning.key, 'ebook.highlights.v1');\n  assert.equal(state.persistenceWarning.operation, 'read');",
        },
      ],
      expectedFailure:
        /highlights corrupt JSON warning test is missing persistenceWarning\.errorMessage/,
    },
    {
      label: 'review storage id',
      file: 'tests/v1-1-review-store.test.js',
      replacements: [
        {
          from: "persistenceWarning.storageId, 'reviews'",
          to: "persistenceWarning.storageId, 'not-reviews'",
        },
      ],
      expectedFailure:
        /review corrupt JSON warning test is missing persistenceWarning\.storageId, 'reviews'/,
    },
  ];

  for (const mutationCase of mutationCases) {
    const result = runFocusedLocalStudyCorruptJsonValidationWithMutations([
      {
        file: mutationCase.file,
        replacements: mutationCase.replacements,
      },
    ]);
    const output = `${result.stdout}\n${result.stderr}`;

    assert.notEqual(result.status, 0, `${mutationCase.label} mutation should fail validation`);
    assert.match(output, mutationCase.expectedFailure, mutationCase.label);
  }
});

test('local study corrupt JSON focused validator rejects dropped parse error exposure', () => {
  const result = runFocusedLocalStudyCorruptJsonValidationWithMutations([
    {
      file: 'lib/storage/persistenceWarning.ts',
      replacements: [
        {
          from: '...(errorMessage ? { errorMessage } : {})',
          to: '',
        },
      ],
    },
  ]);
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /warnings must expose parse error messages when present/);
});

test('PersistenceWarningNotice copy selector covers warning scope and operation copy', () => {
  const { getPersistenceWarningNoticeCopy } = loadPersistenceWarningNoticeModule();
  const expected = {
    en: {
      accessibilityPreferences: {
        read: {
          accessibilityLabel:
            'Accessibility preferences could not be loaded. The app is using default preferences for this session.',
          body: 'Accessibility preferences could not be loaded. The app is using default theme, text, and audio preferences for this session until storage is available again.',
          dismiss: 'Got it',
          title: 'Accessibility preferences could not be loaded',
        },
        write: {
          accessibilityLabel:
            'Accessibility preferences could not be saved. The change is available temporarily in this session.',
          body: 'The theme, text, or audio change works now, but could not be saved on this device. Try the same change again when storage is available.',
          dismiss: 'Got it',
          title: 'Preference saved only for this session',
        },
      },
      settingsPreferences: {
        read: {
          accessibilityLabel:
            'Settings could not be loaded. The app is using default choices for this session.',
          body: 'Saved settings could not be loaded. The app is using default choices for language, audio, daily goal, and supplementary questions for this session until storage is available again.',
          dismiss: 'Got it',
          title: 'Settings could not be loaded',
        },
        write: {
          accessibilityLabel:
            'The setting could not be saved. The change is available temporarily in this session.',
          body: 'The change works now, but could not be saved on this device. Try the same setting again when storage is available.',
          dismiss: 'Got it',
          title: 'Setting saved only for this session',
        },
      },
      studyData: {
        read: {
          accessibilityLabel:
            'Local study data could not be loaded. The app is using empty in-memory state for this session.',
          body: 'Local study data could not be loaded. The app is using empty in-memory study data for this session until storage is available again.',
          dismiss: 'Got it',
          title: 'Local study data could not be loaded',
        },
        write: {
          accessibilityLabel: 'Saving failed. The change is available temporarily in this session.',
          body: 'The change works now, but could not be saved on this device. Try the same change again when storage is available.',
          dismiss: 'Got it',
          title: 'Saved only for this session',
        },
      },
    },
    sv: {
      accessibilityPreferences: {
        read: {
          accessibilityLabel:
            'Tillgänglighetsinställningar kunde inte läsas. Appen använder standardinställningar i den här sessionen.',
          body: 'Tillgänglighetsinställningar kunde inte läsas. Appen använder standardinställningar för tema, text och ljud i den här sessionen tills lagringen fungerar igen.',
          dismiss: 'Jag förstår',
          title: 'Tillgänglighetsinställningar kunde inte läsas',
        },
        write: {
          accessibilityLabel:
            'Tillgänglighetsinställningar kunde inte sparas. Ändringen fungerar tillfälligt i den här sessionen.',
          body: 'Ändringen för tema, text eller ljud fungerar nu, men kunde inte sparas på enheten. Prova samma ändring igen när lagringen fungerar.',
          dismiss: 'Jag förstår',
          title: 'Inställningen sparades bara tillfälligt',
        },
      },
      settingsPreferences: {
        read: {
          accessibilityLabel:
            'Inställningar kunde inte läsas. Appen använder standardval i den här sessionen.',
          body: 'Sparade inställningar kunde inte läsas. Appen använder standardval för språk, ljud, dagligt mål och kompletterande frågor i den här sessionen tills lagringen fungerar igen.',
          dismiss: 'Jag förstår',
          title: 'Inställningar kunde inte läsas',
        },
        write: {
          accessibilityLabel:
            'Inställningen kunde inte sparas. Ändringen fungerar tillfälligt i den här sessionen.',
          body: 'Ändringen fungerar nu, men kunde inte sparas på enheten. Prova samma inställning igen när lagringen fungerar.',
          dismiss: 'Jag förstår',
          title: 'Inställningen sparades bara tillfälligt',
        },
      },
      studyData: {
        read: {
          accessibilityLabel:
            'Lokal studiedata kunde inte läsas. Appen använder ett tomt tillfälligt läge i den här sessionen.',
          body: 'Lokal studiedata kunde inte läsas. Appen använder ett tomt tillfälligt läge i den här sessionen tills lagringen fungerar igen.',
          dismiss: 'Jag förstår',
          title: 'Lokal studiedata kunde inte läsas',
        },
        write: {
          accessibilityLabel:
            'Sparningen misslyckades. Ändringen fungerar tillfälligt i den här sessionen.',
          body: 'Ändringen fungerar nu, men kunde inte sparas på enheten. Prova samma ändring igen när lagringen fungerar.',
          dismiss: 'Jag förstår',
          title: 'Sparades bara tillfälligt',
        },
      },
    },
  };

  for (const [language, scopedCopy] of Object.entries(expected)) {
    for (const [warningScope, operationCopy] of Object.entries(scopedCopy)) {
      for (const [operation, copy] of Object.entries(operationCopy)) {
        assert.deepEqual(
          getPersistenceWarningNoticeCopy({ language, operation, warningScope }),
          copy,
          `${language} ${warningScope} ${operation} copy should match the scoped warning text`,
        );
      }
    }
  }

  assert.deepEqual(
    getPersistenceWarningNoticeCopy({ language: 'en', operation: 'write' }),
    expected.en.studyData.write,
    'omitting warningScope should keep studyData as the component default',
  );
});

test('routes render localized storage warning notices with dismiss hooks', () => {
  const componentSource = fs.readFileSync(
    path.join(repoRoot, 'components/storage/PersistenceWarningNotice.tsx'),
    'utf8',
  );
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  const settingsSource = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  const mistakesSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');

  assert.match(componentSource, /const persistenceWarningNoticeCopy: Record</);
  assert.match(componentSource, /RecoverablePersistenceWarning\['operation'\]/);
  assert.match(
    componentSource,
    /PersistenceWarningNoticeScope =[\s\S]*'accessibilityPreferences'[\s\S]*'settingsPreferences'[\s\S]*'studyData'/,
  );
  assert.match(componentSource, /Sparades bara tillfälligt/);
  assert.match(componentSource, /Saved only for this session/);
  assert.match(componentSource, /Lokal studiedata kunde inte läsas/);
  assert.match(componentSource, /Local study data could not be loaded/);
  assert.match(componentSource, /tomt tillfälligt läge i den här sessionen/);
  assert.match(componentSource, /empty in-memory study data for this session/);
  assert.match(componentSource, /Tillgänglighetsinställningar kunde inte läsas/);
  assert.match(componentSource, /Accessibility preferences could not be loaded/);
  assert.match(componentSource, /standardinställningar för tema, text och ljud/);
  assert.match(componentSource, /default theme, text, and audio preferences/);
  assert.match(componentSource, /Inställningar kunde inte läsas/);
  assert.match(componentSource, /Sparade inställningar kunde inte läsas/);
  assert.match(componentSource, /Settings could not be loaded/);
  assert.match(componentSource, /Saved settings could not be loaded/);
  assert.match(componentSource, /warningScope = 'studyData'/);
  assert.match(componentSource, /getPersistenceWarningNoticeCopy\(\{/);
  assert.match(componentSource, /warning\.operation/);
  assert.match(componentSource, /accessibilityRole="alert"/);
  assert.match(componentSource, /onPress=\{onDismiss\}/);

  assert.match(practiceSource, /progressPersistenceWarning/);
  assert.match(practiceSource, /clearProgressPersistenceWarning/);
  assert.match(practiceSource, /mistakeReviewPersistenceWarning/);
  assert.match(practiceSource, /clearMistakeReviewPersistenceWarning/);
  assert.match(settingsSource, /persistenceWarning = useSettingsStore/);
  assert.match(settingsSource, /clearPersistenceWarning = useSettingsStore/);
  assert.match(
    settingsSource,
    /warning=\{persistenceWarning\}[\s\S]*warningScope="settingsPreferences"/,
  );
  assert.match(settingsSource, /accessibilityPersistenceWarning = useAccessibilityStore/);
  assert.match(settingsSource, /clearAccessibilityPersistenceWarning = useAccessibilityStore/);
  assert.match(settingsSource, /warning=\{accessibilityPersistenceWarning\}/);
  assert.match(settingsSource, /warningScope="accessibilityPreferences"/);
  assert.match(settingsSource, /onDismiss=\{clearAccessibilityPersistenceWarning\}/);
  assert.match(mistakesSource, /progressPersistenceWarning/);
  assert.match(mistakesSource, /mistakeReviewPersistenceWarning/);
  assert.doesNotMatch(practiceSource, /warningScope="accessibilityPreferences"/);
  assert.doesNotMatch(mistakesSource, /warningScope="accessibilityPreferences"/);
});

expectPersistenceWarningScopeMutationFailure(
  'persistence warning scope validator rejects missing Settings accessibility scope',
  [
    {
      file: '/app/settings.tsx',
      replacements: [
        {
          from: 'warningScope="accessibilityPreferences"',
          to: 'warningScope="studyData"',
        },
      ],
    },
  ],
  /Settings must pass warningScope="accessibilityPreferences" for accessibility warnings/,
);

expectPersistenceWarningScopeMutationFailure(
  'persistence warning scope validator rejects a non-studyData default scope',
  [
    {
      file: '/components/storage/PersistenceWarningNotice.tsx',
      replacements: [
        {
          from: "warningScope = 'studyData'",
          to: "warningScope = 'settingsPreferences'",
        },
      ],
    },
  ],
  /PersistenceWarningNotice must keep studyData as the default warningScope/,
);

expectPersistenceWarningScopeMutationFailure(
  'persistence warning scope validator rejects accessibility scope on Practice warnings',
  [
    {
      file: '/app/(tabs)/practice.tsx',
      replacements: [
        {
          from: 'warning={progressPersistenceWarning}',
          to: 'warning={progressPersistenceWarning}\n        warningScope="accessibilityPreferences"',
        },
      ],
    },
  ],
  /Practice persistence warnings must keep the default studyData scope/,
);

expectPersistenceWarningScopeMutationFailure(
  'persistence warning scope validator rejects accessibility scope on Mistakes warnings',
  [
    {
      file: '/app/(tabs)/mistakes.tsx',
      replacements: [
        {
          from: 'warning={progressPersistenceWarning}',
          to: 'warning={progressPersistenceWarning}\n        warningScope="accessibilityPreferences"',
        },
      ],
    },
  ],
  /Mistakes persistence warnings must keep the default studyData scope/,
);
