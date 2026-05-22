// Tests for ebook highlight local persistence and selectors.
// Run with: node --test tests/v1-1-highlights-store.test.js

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const { loadTsWithStorage } = require('./helpers/storageStoreHarness.cjs');

const repoRoot = path.resolve(__dirname, '..');

function loadTs(rel) {
  return loadTsWithStorage(repoRoot, rel, {});
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
        { ...VALID_HIGHLIGHT, id: 'hl-rollover-created', createdAt: '2026-02-30T00:00:00.000Z' },
        { ...VALID_HIGHLIGHT, id: 'hl-date-only-created', createdAt: '2026-05-19' },
        {
          ...VALID_HIGHLIGHT,
          id: 'hl-offset-updated',
          updatedAt: '2026-05-19T12:05:00.000+00:00',
        },
        {
          ...VALID_HIGHLIGHT,
          id: 'hl-missing-ms-updated',
          updatedAt: '2026-05-19T12:05:00Z',
        },
        { ...VALID_HIGHLIGHT, id: 'hl-too-wide', endOffset: 6003 },
        { ...VALID_HIGHLIGHT, id: 'hl-long-note', note: 'x'.repeat(1200) },
        { ...VALID_HIGHLIGHT, id: 'hl-green-pro', color: 'green', note: undefined },
      ],
    },
  };
}

function unsafeChapterMap(validHighlights = [VALID_HIGHLIGHT]) {
  const byChapter = {
    prototype: [{ ...VALID_HIGHLIGHT, id: 'hl-prototype', chapterId: 'prototype' }],
    constructor: [{ ...VALID_HIGHLIGHT, id: 'hl-constructor', chapterId: 'constructor' }],
    ch01: validHighlights,
  };
  Object.defineProperty(byChapter, '__proto__', {
    value: [{ ...VALID_HIGHLIGHT, id: 'hl-proto', chapterId: '__proto__' }],
    enumerable: true,
  });
  return byChapter;
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

test('normalizeHighlightsState: requires canonical UTC highlight timestamps', () => {
  const { normalizeHighlightsState } = loadTs('lib/storage/highlightsStore.ts');
  const timestampCases = [
    ['canonical createdAt and updatedAt', VALID_HIGHLIGHT, true],
    [
      'missing updatedAt falls back to canonical createdAt',
      { ...VALID_HIGHLIGHT, id: 'hl-no-updated', updatedAt: undefined },
      true,
    ],
    [
      'rollover createdAt',
      { ...VALID_HIGHLIGHT, id: 'hl-rollover', createdAt: '2026-02-30T00:00:00.000Z' },
      false,
    ],
    [
      'date-only createdAt',
      { ...VALID_HIGHLIGHT, id: 'hl-date-only', createdAt: '2026-05-19' },
      false,
    ],
    [
      'timezone-offset updatedAt',
      { ...VALID_HIGHLIGHT, id: 'hl-offset', updatedAt: '2026-05-19T12:05:00.000+00:00' },
      false,
    ],
    [
      'missing-milliseconds updatedAt',
      { ...VALID_HIGHLIGHT, id: 'hl-missing-ms', updatedAt: '2026-05-19T12:05:00Z' },
      false,
    ],
    ['blank updatedAt', { ...VALID_HIGHLIGHT, id: 'hl-blank', updatedAt: '   ' }, false],
    ['numeric createdAt', { ...VALID_HIGHLIGHT, id: 'hl-number', createdAt: 1779192000000 }, false],
  ];

  for (const [label, highlight, shouldKeep] of timestampCases) {
    const normalized = normalizeHighlightsState({
      byChapter: {
        ch01: [highlight],
      },
    });
    assert.equal(
      normalized.byChapter.ch01?.length === 1,
      shouldKeep,
      `${label} should ${shouldKeep ? 'hydrate' : 'be dropped'}`,
    );
  }
});

test('normalizeHighlightsState: drops unsafe persisted chapter keys without prototype pollution', () => {
  const { normalizeHighlightsState } = loadTs('lib/storage/highlightsStore.ts');
  const unsafeByChapter = unsafeChapterMap();
  assert.equal(Object.hasOwn(unsafeByChapter, '__proto__'), true);

  const normalized = normalizeHighlightsState({ byChapter: unsafeByChapter });

  assert.equal(Object.getPrototypeOf(normalized.byChapter), null);
  assert.deepEqual(Object.keys(normalized.byChapter), ['ch01']);
  assert.equal(Object.hasOwn(normalized.byChapter, '__proto__'), false);
  assert.equal(Object.hasOwn(normalized.byChapter, 'prototype'), false);
  assert.equal(Object.hasOwn(normalized.byChapter, 'constructor'), false);
  assert.deepEqual(
    normalized.byChapter.ch01.map((h) => h.id),
    ['hl-valid'],
  );
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
  const { useHighlightsStore, MAX_HIGHLIGHT_NOTE_LENGTH, MAX_HIGHLIGHT_SPAN } = loadTs(
    'lib/storage/highlightsStore.ts',
  );
  const store = useHighlightsStore();
  store.clearAll();

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
        blockId: ' ',
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
        startOffset: 4,
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
        startOffset: 0,
        endOffset: MAX_HIGHLIGHT_SPAN + 1,
        color: 'yellow',
      }),
    /Invalid highlight range/,
  );
  assert.throws(
    () =>
      store.addHighlight({
        chapterId: 'ch01',
        blockId: 'intro',
        startOffset: Number.NaN,
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
        endOffset: -4,
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
        endOffset: 4,
        color: 'orange',
      }),
    /Invalid highlight color/,
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
  assert.equal(before, 0);
  assert.deepEqual(store.byChapter, {});
  for (const unsafeChapterId of ['__proto__', 'prototype', 'constructor']) {
    assert.throws(
      () =>
        store.addHighlight({
          chapterId: unsafeChapterId,
          blockId: 'intro',
          startOffset: 1,
          endOffset: 2,
          color: 'yellow',
        }),
      /Invalid highlight range/,
    );
  }
  assert.equal(Object.getPrototypeOf(store.byChapter), Object.prototype);
  assert.deepEqual(Object.keys(store.byChapter), []);

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

test('clearChapter and selectors ignore unsafe runtime chapter ids', () => {
  const { useHighlightsStore, getHighlightsForChapter } = loadTs('lib/storage/highlightsStore.ts');
  const store = useHighlightsStore();
  store.clearAll();
  store.addHighlight({
    chapterId: 'ch01',
    blockId: 'intro',
    startOffset: 1,
    endOffset: 2,
    color: 'yellow',
  });

  for (const unsafeChapterId of ['__proto__', 'prototype', 'constructor']) {
    store.clearChapter(unsafeChapterId);
    assert.equal(getHighlightsForChapter(store, unsafeChapterId).length, 0);
  }

  assert.deepEqual(Object.keys(store.byChapter), ['ch01']);
  assert.equal(Object.hasOwn(store.byChapter, '__proto__'), false);
  assert.equal(Object.hasOwn(store.byChapter, 'prototype'), false);
  assert.equal(Object.hasOwn(store.byChapter, 'constructor'), false);
  assert.equal(getHighlightCount(store), 1);
});

test('runtime highlight writes drop unsafe chapter keys when copying state', () => {
  const { useHighlightsStore, getHighlightsForChapter } = loadTs('lib/storage/highlightsStore.ts');
  const store = useHighlightsStore();
  store.clearAll();
  store.addHighlight({
    chapterId: 'ch01',
    blockId: 'intro',
    startOffset: 1,
    endOffset: 2,
    color: 'yellow',
  });

  const existingHighlights = getHighlightsForChapter(store, 'ch01');
  useHighlightsStore.setState({ byChapter: unsafeChapterMap(existingHighlights) });
  store.addHighlight({
    chapterId: 'ch02',
    blockId: 'rights',
    startOffset: 3,
    endOffset: 4,
    color: 'yellow',
  });

  assert.equal(Object.getPrototypeOf(store.byChapter), null);
  assert.deepEqual(Object.keys(store.byChapter), ['ch01', 'ch02']);
  assert.equal(Object.hasOwn(store.byChapter, '__proto__'), false);
  assert.equal(Object.hasOwn(store.byChapter, 'prototype'), false);
  assert.equal(Object.hasOwn(store.byChapter, 'constructor'), false);
  assert.equal(getHighlightCount(store), 2);

  useHighlightsStore.setState({ byChapter: unsafeChapterMap(existingHighlights) });
  store.clearChapter('ch01');

  assert.equal(Object.getPrototypeOf(store.byChapter), null);
  assert.deepEqual(Object.keys(store.byChapter), ['ch01']);
  assert.deepEqual(store.byChapter.ch01, []);
  assert.equal(Object.hasOwn(store.byChapter, '__proto__'), false);
  assert.equal(Object.hasOwn(store.byChapter, 'prototype'), false);
  assert.equal(Object.hasOwn(store.byChapter, 'constructor'), false);
});

test('highlight ranges address native ebook sections by static chapter id and block id', () => {
  const { EBOOK_ARTICLES, getEbookArticleSectionByBlockId } = loadTs('lib/content/ebookContent.ts');
  const { useHighlightsStore, getHighlightsForBlock } = loadTs('lib/storage/highlightsStore.ts');
  const store = useHighlightsStore();
  store.clearAll();

  const article = EBOOK_ARTICLES.find((item) => item.staticChapterId === '1');
  assert.ok(article, 'chapter 1 native ebook article should exist');
  const section = getEbookArticleSectionByBlockId(article, 'read-with-focus');
  assert.ok(section, 'chapter 1 read-with-focus block should exist');

  const created = store.addHighlight({
    chapterId: article.staticChapterId,
    blockId: section.blockId,
    startOffset: 0,
    endOffset: 12,
    color: 'yellow',
  });

  assert.ok(created);
  assert.equal(created.chapterId, article.staticChapterId);
  assert.equal(created.blockId, section.blockId);
  assert.deepEqual(Object.keys(store.byChapter), [article.staticChapterId]);
  assert.deepEqual(
    getHighlightsForBlock(store, article.staticChapterId, section.blockId).map((h) => ({
      blockId: h.blockId,
      endOffset: h.endOffset,
      startOffset: h.startOffset,
    })),
    [{ blockId: 'read-with-focus', endOffset: 12, startOffset: 0 }],
  );
  assert.deepEqual(getHighlightsForBlock(store, 'ch01', section.blockId), []);
});

test('updateHighlight: rejects invalid runtime patches without corrupting existing state', () => {
  const { useHighlightsStore, getHighlightsForChapter, MAX_HIGHLIGHT_NOTE_LENGTH } = loadTs(
    'lib/storage/highlightsStore.ts',
  );
  const store = useHighlightsStore();
  store.clearAll();
  const created = store.addHighlight({
    chapterId: 'ch02',
    blockId: 'rights',
    startOffset: 3,
    endOffset: 15,
    color: 'yellow',
    note: 'first note',
  });

  assert.ok(created);
  const before = getHighlightsForChapter(store, 'ch02')[0];

  assert.throws(
    () => store.updateHighlight(created.id, { color: 'purple' }),
    /Invalid highlight color/,
  );
  assert.deepEqual(getHighlightsForChapter(store, 'ch02')[0], before);

  assert.throws(
    () => store.updateHighlight(created.id, { note: 'x'.repeat(MAX_HIGHLIGHT_NOTE_LENGTH + 1) }),
    /Highlight note is too long/,
  );
  assert.deepEqual(getHighlightsForChapter(store, 'ch02')[0], before);

  store.updateHighlight(' ', { color: 'green' });
  assert.deepEqual(getHighlightsForChapter(store, 'ch02')[0], before);

  store.updateHighlight(created.id, { color: 'blue', note: '  trimmed patch  ' });
  const updated = getHighlightsForChapter(store, 'ch02')[0];
  assert.equal(updated.color, 'blue');
  assert.equal(updated.note, 'trimmed patch');

  store.updateHighlight(created.id, { note: '   ' });
  const noteCleared = getHighlightsForChapter(store, 'ch02')[0];
  assert.equal(noteCleared.color, 'blue');
  assert.equal(noteCleared.note, undefined);
});

test('isColorAllowed: keeps yellow free and multi-color Pro contract intact', () => {
  const { isColorAllowed } = loadTs('lib/storage/highlightsStore.ts');
  assert.equal(isColorAllowed('yellow', false), true);
  assert.equal(isColorAllowed('green', false), false);
  assert.equal(isColorAllowed('green', true), true);
  assert.equal(isColorAllowed('blue', true), true);
  assert.equal(isColorAllowed('pink', true), true);
});

test('isColorAllowed: requires strict Pro boolean for paid highlight colors', () => {
  const { isColorAllowed } = loadTs('lib/storage/highlightsStore.ts');

  for (const malformedProFlag of ['yes', 1, {}, [], null]) {
    assert.equal(isColorAllowed('green', malformedProFlag), false);
    assert.equal(isColorAllowed('yellow', malformedProFlag), true);
  }
});

function getHighlightCount(store) {
  return Object.values(store.byChapter).reduce((sum, list) => sum + list.length, 0);
}
