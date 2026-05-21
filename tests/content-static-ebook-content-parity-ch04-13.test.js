const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const targetChapters = ['4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
const translatedLanguages = ['zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk'];

function readSiteFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createEbookHarness() {
  const reader = { innerHTML: '', scrollTop: 0 };
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
      return selector === '.ebook__nav a[data-eb]' ? [] : [];
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

function semanticBlockCount(html) {
  return (html.match(/<h2\b|<p\b|<li\b/g) || []).length;
}

function visibleTextLength(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

test('translated static ebook chapters 4-13 keep full English/Swedish semantic depth', () => {
  const harness = createEbookHarness();

  for (const chapterId of targetChapters) {
    const englishHtml = renderChapter(harness, 'en', chapterId);
    const swedishHtml = renderChapter(harness, 'sv', chapterId);
    const minimumBlocks = Math.max(
      semanticBlockCount(englishHtml),
      semanticBlockCount(swedishHtml),
    );

    for (const lang of translatedLanguages) {
      const html = renderChapter(harness, lang, chapterId);
      const blocks = semanticBlockCount(html);
      const visibleLength = visibleTextLength(html);

      assert.ok(
        blocks >= minimumBlocks,
        `${lang} chapter ${chapterId} has ${blocks} semantic blocks; expected at least ${minimumBlocks}`,
      );
      assert.ok(
        visibleLength >= 1000,
        `${lang} chapter ${chapterId} has unexpectedly short visible text (${visibleLength} chars)`,
      );
      assert.doesNotMatch(
        html,
        /ZXQ(?:EXPR|FACTBOX)|__EXPR|PLACEHOLDER/i,
        `${lang} chapter ${chapterId} should not render translation placeholder tokens`,
      );
      assert.doesNotMatch(
        html,
        />undefined|undefined\s*→/i,
        `${lang} chapter ${chapterId} should not render missing localized UI labels`,
      );
    }
  }
});
