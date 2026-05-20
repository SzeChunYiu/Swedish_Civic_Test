// Tests for v1.1 ebook highlights store (blueprint 15).
// Run with: node --test tests/v1-1-highlights-store.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const {
  createMemoryMMKV,
  createThrowingGetMMKV,
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

function loadHighlightsStore(storageById = {}) {
  return loadTsWithStorage(repoRoot, 'lib/storage/highlightsStore.ts', storageById);
}

function makeHighlight(extra = {}) {
  return {
    id: 'hl_1',
    chapterId: 'ch01',
    blockId: 'b1',
    startOffset: 0,
    endOffset: 12,
    color: 'yellow',
    createdAt: '2026-05-19T12:00:00.000Z',
    updatedAt: '2026-05-19T12:00:00.000Z',
    ...extra,
  };
}

test('highlight selectors return chapter and block-scoped highlights', () => {
  const { getHighlightsForBlock, getHighlightsForChapter } = loadHighlightsStore();
  const state = {
    byChapter: {
      ch01: [makeHighlight(), makeHighlight({ id: 'hl_2', blockId: 'b2' })],
      ch02: [makeHighlight({ id: 'hl_3', chapterId: 'ch02', blockId: 'b1' })],
    },
  };

  assert.deepEqual(
    getHighlightsForChapter(state, 'ch01').map((highlight) => highlight.id),
    ['hl_1', 'hl_2'],
  );
  assert.deepEqual(
    getHighlightsForBlock(state, 'ch01', 'b1').map((highlight) => highlight.id),
    ['hl_1'],
  );
});

test('highlight colors keep free yellow-only and Pro expanded palette', () => {
  const { isColorAllowed } = loadHighlightsStore();

  assert.equal(isColorAllowed('yellow', false), true);
  assert.equal(isColorAllowed('green', false), false);
  assert.equal(isColorAllowed('blue', true), true);
  assert.equal(isColorAllowed('pink', true), true);
});

test('highlights store: throwing MMKV writes keep highlight in memory and record warning', () => {
  const storage = createThrowingSetMMKV('highlights disk full');
  const { useHighlightsStore } = loadHighlightsStore({
    'ebook-highlights': storage,
  });

  const highlight = useHighlightsStore.getState().addHighlight({
    chapterId: 'ch01',
    blockId: 'b1',
    startOffset: 3,
    endOffset: 9,
    color: 'yellow',
  });
  const state = useHighlightsStore.getState();

  assert.equal(state.byChapter.ch01[0].id, highlight.id);
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.storageId, 'ebook-highlights');
  assert.equal(state.persistenceWarning.key, 'ebook.highlights.v1');
  assert.match(state.persistenceWarning.errorMessage, /disk full/);
});

test('highlights store: throwing MMKV reads fall back to empty state and record warning', () => {
  const storage = createThrowingGetMMKV('highlights read failed');
  const { useHighlightsStore } = loadHighlightsStore({
    'ebook-highlights': storage,
  });
  const state = useHighlightsStore.getState();

  assert.deepEqual(state.byChapter, {});
  assert.equal(state.persistenceWarning.recoverable, true);
  assert.equal(state.persistenceWarning.operation, 'read');
  assert.equal(state.persistenceWarning.storageId, 'ebook-highlights');
  assert.equal(state.persistenceWarning.key, 'ebook.highlights.v1');
  assert.match(state.persistenceWarning.errorMessage, /read failed/);
});

test('highlights store: corrupt persisted highlight rows are dropped on hydration', () => {
  const persisted = {
    byChapter: {
      '': [makeHighlight({ id: 'blank-chapter' })],
      ch01: [
        makeHighlight({ id: 'valid-green', color: 'green', note: 'Keep this note' }),
        makeHighlight({ id: '', color: 'yellow' }),
        makeHighlight({ id: 'blank-block', blockId: '' }),
        makeHighlight({ id: 'negative-start', startOffset: -1 }),
        makeHighlight({ id: 'fractional-start', startOffset: 1.5 }),
        makeHighlight({ id: 'reversed-range', startOffset: 12, endOffset: 3 }),
        makeHighlight({ id: 'infinite-end', endOffset: Number.POSITIVE_INFINITY }),
        makeHighlight({ id: 'bad-color', color: 'orange' }),
        makeHighlight({ id: 'bad-created-at', createdAt: '2026-05-19' }),
        makeHighlight({ id: 'bad-updated-at', updatedAt: 'not-a-date' }),
        makeHighlight({ id: 'oversized-note', note: 'A'.repeat(2001) }),
      ],
      ch02: [
        makeHighlight({
          id: 'valid-pink',
          blockId: 'b2',
          color: 'pink',
          note: 'Short note',
          updatedAt: undefined,
        }),
      ],
      ch03: 'not-an-array',
    },
  };
  const storage = createMemoryMMKV({ 'ebook.highlights.v1': JSON.stringify(persisted) });
  const { useHighlightsStore } = loadHighlightsStore({
    'ebook-highlights': storage,
  });
  const state = useHighlightsStore.getState();

  assert.deepEqual(Object.keys(state.byChapter), ['ch01', 'ch02']);
  assert.deepEqual(
    state.byChapter.ch01.map((highlight) => highlight.id),
    ['valid-green'],
  );
  assert.equal(state.byChapter.ch01[0].chapterId, 'ch01');
  assert.equal(state.byChapter.ch01[0].note, 'Keep this note');
  assert.deepEqual(
    state.byChapter.ch02.map((highlight) => highlight.id),
    ['valid-pink'],
  );
  assert.equal(state.byChapter.ch02[0].chapterId, 'ch02');
  assert.equal(state.byChapter.ch02[0].updatedAt, state.byChapter.ch02[0].createdAt);
});

test('highlights store: successful writes persist JSON and corrupt reads still fall back', () => {
  const storage = createMemoryMMKV();
  const { useHighlightsStore } = loadHighlightsStore({
    'ebook-highlights': storage,
  });

  useHighlightsStore.getState().addHighlight({
    chapterId: 'ch01',
    blockId: 'b1',
    startOffset: 3,
    endOffset: 9,
    color: 'yellow',
    note: 'Important',
  });

  assert.equal(useHighlightsStore.getState().persistenceWarning, null);
  const persisted = JSON.parse(storage.values.get('ebook.highlights.v1'));
  assert.equal(persisted.byChapter.ch01[0].note, 'Important');

  const corruptStorage = createMemoryMMKV({ 'ebook.highlights.v1': '{not-json' });
  const { useHighlightsStore: useCorruptHighlightsStore } = loadHighlightsStore({
    'ebook-highlights': corruptStorage,
  });

  assert.deepEqual(useCorruptHighlightsStore.getState().byChapter, {});
});
