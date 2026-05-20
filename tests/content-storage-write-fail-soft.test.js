const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const {
  createMemoryMMKV,
  createThrowingSetMMKV,
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

  assert.match(componentSource, /const persistenceWarningNoticeCopy: Record<AppLanguage/);
  assert.match(componentSource, /Sparades bara tillfälligt/);
  assert.match(componentSource, /Saved only for this session/);
  assert.match(componentSource, /accessibilityRole="alert"/);
  assert.match(componentSource, /onPress=\{onDismiss\}/);

  assert.match(practiceSource, /progressPersistenceWarning/);
  assert.match(practiceSource, /clearProgressPersistenceWarning/);
  assert.match(practiceSource, /mistakeReviewPersistenceWarning/);
  assert.match(practiceSource, /clearMistakeReviewPersistenceWarning/);
  assert.match(settingsSource, /persistenceWarning = useSettingsStore/);
  assert.match(settingsSource, /clearPersistenceWarning = useSettingsStore/);
  assert.match(mistakesSource, /progressPersistenceWarning/);
  assert.match(mistakesSource, /mistakeReviewPersistenceWarning/);
});
