const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const chapterIds = ['intro', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const staleEbookCopyPatterns = [
  /Svenska [oö]vers[aä]ttningen kommer/i,
  /p[aå] engelska tills vidare/i,
  /kommer i v1\.1/i,
  /friendly stubs/i,
  /We're writing this chapter now/i,
  /Coming soon/i,
  /Kommer snart/i,
];

function readSiteFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createEbookHarness() {
  const reader = { innerHTML: '', scrollTop: 0 };
  const navAnchors = chapterIds.map((id) => ({
    dataset: { eb: id },
    classList: { toggle() {} },
  }));
  const localStorageValues = new Map();
  const localStorage = {
    getItem(key) {
      return localStorageValues.has(key) ? localStorageValues.get(key) : null;
    },
    setItem(key, value) {
      localStorageValues.set(key, String(value));
    },
  };
  const location = { hash: '#/ebook' };
  const document = {
    addEventListener() {},
    getElementById(id) {
      return id === 'ebook-reader' ? reader : null;
    },
    querySelectorAll(selector) {
      return selector === '.ebook__nav a[data-eb]' ? navAnchors : [];
    },
  };
  const window = {
    addEventListener() {},
    localStorage,
    location,
    smtApplyEbookHighlights() {},
  };
  const context = {
    console,
    document,
    localStorage,
    location,
    setTimeout(callback) {
      callback();
      return 0;
    },
    window,
  };
  context.globalThis = context;

  vm.runInNewContext(readSiteFile('site/ebook.js'), context, { filename: 'site/ebook.js' });

  return { localStorage, location, reader, window };
}

function renderChapter(harness, lang, chapterId) {
  harness.localStorage.setItem('smt_lang', lang);
  harness.location.hash = `#/ebook?c=${chapterId}`;
  harness.reader.innerHTML = '';
  harness.window.smtEbookRender();
  return harness.reader.innerHTML;
}

function assertNoStaleEbookCopy(value) {
  for (const pattern of staleEbookCopyPatterns) {
    assert.doesNotMatch(value, pattern);
  }
}

test('static ebook source contains no stale untranslated placeholder copy', () => {
  const source = `${readSiteFile('site/ebook.js')}\n${readSiteFile('site/index.html')}`;

  assertNoStaleEbookCopy(source);
});

test('static ebook renders every chapter with Swedish and English body parity', () => {
  const harness = createEbookHarness();

  for (const chapterId of chapterIds) {
    const englishHtml = renderChapter(harness, 'en', chapterId);
    const swedishHtml = renderChapter(harness, 'sv', chapterId);

    assertNoStaleEbookCopy(englishHtml);
    assertNoStaleEbookCopy(swedishHtml);

    assert.match(englishHtml, /ebook__study-actions/);
    assert.match(swedishHtml, /ebook__study-actions/);
    assert.match(englishHtml, /href="#\/mock"/);
    assert.match(swedishHtml, /href="#\/mock"/);
    assert.match(englishHtml, /href="#\/sources"/);
    assert.match(swedishHtml, /href="#\/sources"/);

    if (chapterId === 'intro') {
      assert.match(englishHtml, /What this book is/);
      assert.match(swedishHtml, /Vad den h[aä]r boken [aä]r/);
    } else {
      assert.match(englishHtml, /Facts you'll see on the test/);
      assert.match(swedishHtml, /Det viktigaste/);
      assert.match(swedishHtml, /Plugga smart/);
      assert.match(swedishHtml, /Fakta att kunna/);
    }

    assert.doesNotMatch(swedishHtml, /Facts you'll see on the test/);
    assert.doesNotMatch(swedishHtml, /Practice chapter/);
    assert.doesNotMatch(swedishHtml, /Chapter highlights/);
    assert.doesNotMatch(swedishHtml, /Next study steps/);
  }
});
