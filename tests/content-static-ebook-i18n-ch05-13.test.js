const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const targetChapters = ['5', '6', '7', '8', '9', '10', '11', '12', '13'];
const extraLanguages = ['zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk'];
const bareCivicTermPattern = /(^|[^\p{L}\p{N}_-])(region|kommun)(?=$|[^\p{L}\p{N}_-])/giu;
const englishFallbackSnippets = [
  'Equality and the modern household.',
  'Society, school, and healthcare.',
  'Nature, climate, and allemansrätten.',
  'Culture, traditions, and the Swedish calendar.',
  'Money, banks, and BankID.',
  'Sweden, the EU, and the world.',
  'Migration, residence, and citizenship.',
  'Mock exam and current test status.',
  'Traditions, holidays, and change.',
  'Read with focus',
  'Review close to the source',
  'Facts to review',
];

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

function assertNoBareCivicTerms(html, label) {
  const offenders = Array.from(html.matchAll(bareCivicTermPattern), (match) => ({
    context: civicTermContext(html, match.index ?? 0),
    term: match[2],
  }));
  assert.deepEqual(offenders, [], `${label} should localize kommun/region civic terms`);
}

function civicTermContext(html, index) {
  return html
    .slice(Math.max(0, index - 90), index + 150)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('static ebook chapters 5-13 do not fall back to English for non-English reader languages', () => {
  const harness = createEbookHarness();

  for (const chapterId of targetChapters) {
    for (const lang of extraLanguages) {
      const html = renderChapter(harness, lang, chapterId);

      assert.match(
        html,
        /class="ebook__h1"/,
        `${lang} chapter ${chapterId} should render a localized title`,
      );
      assert.match(
        html,
        /data-source-scope="ebook"/,
        `${lang} chapter ${chapterId} should keep source footnotes`,
      );
      assert.match(
        html,
        /ebook__factbox/,
        `${lang} chapter ${chapterId} should render localized study facts`,
      );
      for (const snippet of englishFallbackSnippets) {
        assert.doesNotMatch(
          html,
          new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
          `${lang} chapter ${chapterId} should not show English fallback copy: ${snippet}`,
        );
      }
    }
  }
});

test('static ebook chapters 5-13 localize kommun and region civic terms for extra languages', () => {
  const harness = createEbookHarness();

  for (const chapterId of targetChapters) {
    for (const lang of extraLanguages) {
      const html = renderChapter(harness, lang, chapterId);
      assertNoBareCivicTerms(html, `${lang} chapter ${chapterId}`);
    }
  }
});
