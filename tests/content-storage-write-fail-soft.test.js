const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const {
  createMemoryMMKV,
  createThrowingSetMMKV,
  loadTsWithStorage,
} = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function compileTsModule(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
}

require.extensions['.ts'] = compileTsModule;
require.extensions['.tsx'] = compileTsModule;

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

function loadPersistenceWarningNoticeModule() {
  const componentPath = path.join(repoRoot, 'components/storage/PersistenceWarningNotice.tsx');
  delete require.cache[componentPath];

  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === 'react-native') {
      return {
        Pressable: 'Pressable',
        StyleSheet: { create: (styles) => styles, hairlineWidth: 1 },
        Text: 'Text',
        View: 'View',
      };
    }

    if (request === '../../lib/theme' && parent?.filename === componentPath) {
      return {
        colors: {
          surface: '#ffffff',
          text: '#111111',
          textSecondary: '#333333',
          warning: '#c77700',
          warningSoft: '#fff7e6',
        },
        radius: { card: 8, pill: 999 },
        space: { 0.75: 6, 1: 8, 1.5: 12, 6: 48 },
        typography: {
          body: { fontSize: 16 },
          bodyBold: { fontWeight: '600' },
          bodyTight: { lineHeight: 20 },
          caption: { fontSize: 12, lineHeight: 16 },
          navButton: { fontWeight: '600' },
        },
      };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return require(componentPath);
  } finally {
    Module._load = originalLoad;
  }
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

test('routes render localized storage warning notices with dismiss hooks', () => {
  const componentSource = fs.readFileSync(
    path.join(repoRoot, 'components/storage/PersistenceWarningNotice.tsx'),
    'utf8',
  );
  const practiceSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/practice.tsx'), 'utf8');
  const settingsSource = fs.readFileSync(path.join(repoRoot, 'app/settings.tsx'), 'utf8');
  const mistakesSource = fs.readFileSync(path.join(repoRoot, 'app/(tabs)/mistakes.tsx'), 'utf8');

  assert.match(componentSource, /const persistenceWarningNoticeCopy: Record</);
  assert.match(componentSource, /type PersistenceWarningNoticeScope/);
  assert.match(componentSource, /getPersistenceWarningNoticeCopy/);
  assert.match(componentSource, /RecoverablePersistenceWarning\['operation'\]/);
  assert.match(componentSource, /Sparades bara tillfälligt/);
  assert.match(componentSource, /Saved only for this session/);
  assert.match(componentSource, /Lokal studiedata kunde inte läsas/);
  assert.match(componentSource, /Local study data could not be loaded/);
  assert.match(componentSource, /Tillgänglighetsinställningar kunde inte läsas/);
  assert.match(componentSource, /Accessibility preferences could not be loaded/);
  assert.match(componentSource, /tomt tillfälligt läge i den här sessionen/);
  assert.match(componentSource, /empty in-memory study data for this session/);
  assert.match(componentSource, /warningScope = defaultPersistenceWarningNoticeScope/);
  assert.match(componentSource, /accessibilityRole="alert"/);
  assert.match(componentSource, /onPress=\{onDismiss\}/);

  assert.match(practiceSource, /progressPersistenceWarning/);
  assert.match(practiceSource, /clearProgressPersistenceWarning/);
  assert.match(practiceSource, /mistakeReviewPersistenceWarning/);
  assert.match(practiceSource, /clearMistakeReviewPersistenceWarning/);
  assert.match(settingsSource, /persistenceWarning = useSettingsStore/);
  assert.match(settingsSource, /clearPersistenceWarning = useSettingsStore/);
  assert.match(settingsSource, /accessibilityPersistenceWarning = useAccessibilityStore/);
  assert.match(settingsSource, /clearAccessibilityPersistenceWarning = useAccessibilityStore/);
  assert.match(settingsSource, /warning=\{accessibilityPersistenceWarning\}/);
  assert.match(settingsSource, /onDismiss=\{clearAccessibilityPersistenceWarning\}/);
  assert.match(settingsSource, /warningScope="accessibilityPreferences"/);
  assert.match(mistakesSource, /progressPersistenceWarning/);
  assert.match(mistakesSource, /mistakeReviewPersistenceWarning/);
});

test('PersistenceWarningNotice copy selector returns scoped read and write copy', () => {
  const { getPersistenceWarningNoticeCopy } = loadPersistenceWarningNoticeModule();

  const cases = [
    {
      body: /Lokal studiedata kunde inte läsas/,
      dismiss: 'Jag förstår',
      label: /Lokal studiedata kunde inte läsas/,
      language: 'sv',
      operation: 'read',
      scope: 'studyData',
      title: /Lokal studiedata kunde inte läsas/,
    },
    {
      body: /kunde inte sparas på enheten/,
      dismiss: 'Jag förstår',
      label: /Sparningen misslyckades/,
      language: 'sv',
      operation: 'write',
      scope: 'studyData',
      title: /Sparades bara tillfälligt/,
    },
    {
      body: /Tillgänglighetsinställningar kunde inte läsas/,
      dismiss: 'Jag förstår',
      label: /Tillgänglighetsinställningar kunde inte läsas/,
      language: 'sv',
      operation: 'read',
      scope: 'accessibilityPreferences',
      title: /Tillgänglighetsinställningar kunde inte läsas/,
    },
    {
      body: /tillgänglighetsinställningen kunde inte sparas/,
      dismiss: 'Jag förstår',
      label: /Tillgänglighetsinställningen kunde inte sparas/,
      language: 'sv',
      operation: 'write',
      scope: 'accessibilityPreferences',
      title: /Sparades bara tillfälligt/,
    },
    {
      body: /Local study data could not be loaded/,
      dismiss: 'Got it',
      label: /Local study data could not be loaded/,
      language: 'en',
      operation: 'read',
      scope: 'studyData',
      title: /Local study data could not be loaded/,
    },
    {
      body: /could not be saved on this device/,
      dismiss: 'Got it',
      label: /Saving failed/,
      language: 'en',
      operation: 'write',
      scope: 'studyData',
      title: /Saved only for this session/,
    },
    {
      body: /Accessibility preferences could not be loaded/,
      dismiss: 'Got it',
      label: /Accessibility preferences could not be loaded/,
      language: 'en',
      operation: 'read',
      scope: 'accessibilityPreferences',
      title: /Accessibility preferences could not be loaded/,
    },
    {
      body: /accessibility preference could not be saved/,
      dismiss: 'Got it',
      label: /Accessibility preference saving failed/,
      language: 'en',
      operation: 'write',
      scope: 'accessibilityPreferences',
      title: /Saved only for this session/,
    },
  ];

  for (const { body, dismiss, label, language, operation, scope, title } of cases) {
    const copy = getPersistenceWarningNoticeCopy(language, operation, scope);
    assert.equal(copy.dismiss, dismiss);
    assert.match(copy.accessibilityLabel, label);
    assert.match(copy.body, body);
    assert.match(copy.title, title);
  }

  assert.deepEqual(
    getPersistenceWarningNoticeCopy('sv', 'read'),
    getPersistenceWarningNoticeCopy('sv', 'read', 'studyData'),
  );
  assert.doesNotMatch(
    getPersistenceWarningNoticeCopy('en', 'read', 'accessibilityPreferences').body,
    /study data/i,
  );
  assert.doesNotMatch(
    getPersistenceWarningNoticeCopy('sv', 'read', 'accessibilityPreferences').body,
    /studiedata/i,
  );
});
