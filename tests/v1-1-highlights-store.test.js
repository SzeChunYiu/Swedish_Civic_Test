// Tests for ebook highlight local persistence and selectors.
// Run with: node --test tests/v1-1-highlights-store.test.js

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

const origResolve = Module._resolveFilename;
const origLoad = Module._load;
let mockHighlightsStorage = null;

function installStubs() {
  const stubs = {
    'react-native-mmkv': () => ({ createMMKV: () => mockHighlightsStorage }),
    zustand: () => ({
      create: (factory) => {
        const setFn = (partial) =>
          Object.assign(state, typeof partial === 'function' ? partial(state) : partial);
        const getFn = () => state;
        const state = factory(setFn, getFn);
        return () => state;
      },
    }),
  };
  Module._resolveFilename = function patchedResolve(request, ...args) {
    if (stubs[request]) return `__stub__:${request}`;
    return origResolve.call(this, request, ...args);
  };
  Module._load = function patchedLoad(request, ...args) {
    if (stubs[request]) return stubs[request]();
    return origLoad.call(this, request, ...args);
  };
}

installStubs();

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function loadTs(rel) {
  return require(path.join(repoRoot, rel));
}

function loadFreshHighlightsStore(storage = null) {
  mockHighlightsStorage = storage;
  const modulePath = path.join(repoRoot, 'lib/storage/highlightsStore.ts');
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

const VALID_HIGHLIGHT = {
  id: 'hl-valid',
  chapterId: 'ch01',
  blockId: 'intro',
  startOffset: 2,
  endOffset: 18,
  color: 'yellow',
  note: 'Kom ihåg detta.',
  createdAt: '2026-05-19T12:00:00.000Z',
  updatedAt: '2026-05-19T12:05:00.000Z',
};

function corruptHighlights() {
  return {
    byChapter: {
      '': [
        {
          ...VALID_HIGHLIGHT,
          id: '',
          chapterId: '',
          blockId: '',
          startOffset: -5,
          createdAt: 'not-a-date',
          note: 'x'.repeat(1200),
        },
      ],
      ch01: [
        VALID_HIGHLIGHT,
        { ...VALID_HIGHLIGHT, id: 'hl-mismatch', chapterId: 'ch02' },
        { ...VALID_HIGHLIGHT, id: 'hl-reversed', startOffset: 10, endOffset: 4 },
        { ...VALID_HIGHLIGHT, id: 'hl-fractional', startOffset: 2.5 },
        { ...VALID_HIGHLIGHT, id: 'hl-infinite', endOffset: Number.POSITIVE_INFINITY },
        { ...VALID_HIGHLIGHT, id: 'hl-bad-created', createdAt: 'not-a-date' },
        { ...VALID_HIGHLIGHT, id: 'hl-bad-updated', updatedAt: 'not-a-date' },
        { ...VALID_HIGHLIGHT, id: 'hl-too-wide', endOffset: 6003 },
        { ...VALID_HIGHLIGHT, id: 'hl-long-note', note: 'x'.repeat(1200) },
        { ...VALID_HIGHLIGHT, id: 'hl-green-pro', color: 'green', note: undefined },
      ],
    },
  };
}

test('normalizeHighlightsState: drops corrupt persisted highlights and keeps valid free/pro colors', () => {
  const { normalizeHighlightsState } = loadTs('lib/storage/highlightsStore.ts');
  const normalized = normalizeHighlightsState(corruptHighlights());

  assert.deepEqual(Object.keys(normalized.byChapter), ['ch01']);
  assert.deepEqual(
    normalized.byChapter.ch01.map((h) => h.id),
    ['hl-valid', 'hl-long-note', 'hl-green-pro'],
  );
  assert.equal(normalized.byChapter.ch01[0].note, 'Kom ihåg detta.');
  assert.equal(normalized.byChapter.ch01[1].note, undefined);
  assert.equal(normalized.byChapter.ch01[2].color, 'green');
});

test('getHighlightsForChapter: does not return corrupt in-memory entries', () => {
  const { getHighlightsForChapter } = loadTs('lib/storage/highlightsStore.ts');
  const state = corruptHighlights();
  const highlights = getHighlightsForChapter(state, 'ch01');

  assert.deepEqual(
    highlights.map((h) => h.id),
    ['hl-valid', 'hl-long-note', 'hl-green-pro'],
  );
  assert.equal(highlights[1].note, undefined);
});

test('addHighlight: rejects invalid ranges, ids and oversized notes before writing state', () => {
  const { useHighlightsStore, MAX_HIGHLIGHT_NOTE_LENGTH } = loadTs(
    'lib/storage/highlightsStore.ts',
  );
  const store = useHighlightsStore();

  assert.throws(
    () =>
      store.addHighlight({
        chapterId: '',
        blockId: 'intro',
        startOffset: 1,
        endOffset: 2,
        color: 'yellow',
      }),
    /Invalid highlight range/,
  );
  assert.throws(
    () =>
      store.addHighlight({
        chapterId: 'ch01',
        blockId: 'intro',
        startOffset: 1.5,
        endOffset: 4,
        color: 'yellow',
      }),
    /Invalid highlight range/,
  );
  assert.throws(
    () =>
      store.addHighlight({
        chapterId: 'ch01',
        blockId: 'intro',
        startOffset: 8,
        endOffset: 4,
        color: 'yellow',
      }),
    /Invalid highlight range/,
  );
  assert.throws(
    () =>
      store.addHighlight({
        chapterId: 'ch01',
        blockId: 'intro',
        startOffset: 1,
        endOffset: 2,
        color: 'yellow',
        note: 'x'.repeat(MAX_HIGHLIGHT_NOTE_LENGTH + 1),
      }),
    /Highlight note is too long/,
  );

  const before = getHighlightCount(store);
  const created = store.addHighlight({
    chapterId: 'ch01',
    blockId: 'intro',
    startOffset: 1,
    endOffset: 2,
    color: 'pink',
    note: '  source note  ',
  });

  assert.equal(created.note, 'source note');
  assert.equal(getHighlightCount(store), before + 1);
});

test('isColorAllowed: keeps yellow free and multi-color Pro contract intact', () => {
  const { isColorAllowed } = loadTs('lib/storage/highlightsStore.ts');
  assert.equal(isColorAllowed('yellow', false), true);
  assert.equal(isColorAllowed('green', false), false);
  assert.equal(isColorAllowed('green', true), true);
  assert.equal(isColorAllowed('blue', true), true);
  assert.equal(isColorAllowed('pink', true), true);
});

function getHighlightCount(store) {
  return Object.values(store.byChapter).reduce((sum, list) => sum + list.length, 0);
}

function addTestHighlight(store, chapterId, blockId = 'intro') {
  const highlight = store.addHighlight({
    chapterId,
    blockId,
    startOffset: 1,
    endOffset: 4,
    color: 'yellow',
  });
  assert.ok(highlight, 'expected test highlight to be created');
  return highlight;
}

test('removeHighlight: ignores invalid ids and prunes empty chapter buckets after removal', () => {
  const { useHighlightsStore } = loadFreshHighlightsStore();
  const store = useHighlightsStore();
  store.clearAll();
  const ch01 = addTestHighlight(store, 'ch01');
  const ch02 = addTestHighlight(store, 'ch02');
  const initial = JSON.stringify(store.byChapter);

  store.removeHighlight('');
  store.removeHighlight(' ');
  store.removeHighlight('missing-highlight');

  assert.equal(JSON.stringify(store.byChapter), initial);

  store.removeHighlight(ch01.id);

  assert.equal(store.byChapter.ch01, undefined);
  assert.deepEqual(Object.keys(store.byChapter), ['ch02']);
  assert.deepEqual(
    store.byChapter.ch02.map((h) => h.id),
    [ch02.id],
  );

  store.removeHighlight(ch02.id);

  assert.deepEqual(store.byChapter, {});
});

test('clearChapter: ignores invalid ids and removes chapter buckets instead of leaving empty arrays', () => {
  const { useHighlightsStore } = loadFreshHighlightsStore();
  const store = useHighlightsStore();
  store.clearAll();
  addTestHighlight(store, 'ch01');
  addTestHighlight(store, 'ch02');
  const initial = JSON.stringify(store.byChapter);

  store.clearChapter('');
  store.clearChapter(' ');
  store.clearChapter('missing-chapter');

  assert.equal(JSON.stringify(store.byChapter), initial);

  store.clearChapter('ch01');

  assert.equal(store.byChapter.ch01, undefined);
  assert.deepEqual(Object.keys(store.byChapter), ['ch02']);

  store.byChapter.ch03 = [];
  store.clearChapter('ch03');

  assert.deepEqual(Object.keys(store.byChapter), ['ch02']);

  store.clearChapter('ch02');

  assert.deepEqual(store.byChapter, {});
});

test('clear/remove real mutations preserve recoverable write warnings', () => {
  const writes = [];
  const storage = {
    getString: () => undefined,
    set: (key, value) => {
      writes.push({ key, value });
      throw new Error('disk full');
    },
  };
  const { useHighlightsStore } = loadFreshHighlightsStore(storage);
  const store = useHighlightsStore();
  const ch01 = addTestHighlight(store, 'ch01');

  assert.equal(store.persistenceWarning?.operation, 'write');
  store.clearPersistenceWarning();

  const writesBeforeInvalidInputs = writes.length;
  store.removeHighlight(' ');
  store.removeHighlight('missing-highlight');
  store.clearChapter(' ');
  store.clearChapter('missing-chapter');

  assert.equal(writes.length, writesBeforeInvalidInputs);
  assert.equal(store.persistenceWarning, null);

  store.removeHighlight(ch01.id);

  assert.equal(store.persistenceWarning?.operation, 'write');
  assert.match(store.persistenceWarning?.errorMessage ?? '', /disk full/);
  assert.equal(store.byChapter.ch01, undefined);

  store.clearPersistenceWarning();
  addTestHighlight(store, 'ch02');
  store.clearPersistenceWarning();

  store.clearChapter('ch02');

  assert.equal(store.persistenceWarning?.operation, 'write');
  assert.match(store.persistenceWarning?.errorMessage ?? '', /disk full/);
  assert.equal(store.byChapter.ch02, undefined);
});
