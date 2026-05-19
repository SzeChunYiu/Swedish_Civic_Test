const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function staticChapterCount() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(read('site/questions.js'), context, { timeout: 3000 });
  return context.window.SMT_CHAPTERS_META.length;
}

function homeChapterListCount(indexHtml) {
  const listMatch = indexHtml.match(/<ol class="list-quiet">([\s\S]*?)<\/ol>/);
  assert.ok(listMatch, 'home chapter list should be present');
  return (listMatch[1].match(/<li>/g) ?? []).length;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ');
}

test('static site chapter-count copy rejects stale twelve-chapter claims', () => {
  const chapterCount = staticChapterCount();
  const indexHtml = read('site/index.html');
  const surface = [indexHtml, read('site/app.js'), read('site/i18n-extras.js')].join('\n');

  assert.equal(chapterCount, 13, 'static chapter metadata should expose 13 chapters');
  assert.equal(homeChapterListCount(indexHtml), chapterCount);

  [
    /\bTwelve\s+(?:short\s+)?chapters\b/i,
    /\b12\s+(?:short\s+)?chapters\b/i,
    /\bTolv\s+kapitel\b/i,
    /十二个(?:简短)?章节/,
    /十二個(?:簡短)?章節/,
    /اثنا عشر فصلاً/,
    /Laba iyo toban cutub/i,
  ].forEach((pattern) => assert.doesNotMatch(surface, pattern));
});

test('static site chapter-count copy has non-numeric localized chapter wording', () => {
  const surface = [read('site/index.html'), read('site/app.js'), read('site/i18n-extras.js')].join(
    '\n',
  );
  const normalizedSurface = normalizeWhitespace(surface);

  [
    /Short study chapters/,
    /Compact chapters, lagom-sized/,
    /Korta kapitel, lagom stora/,
    /简短章节/,
    /簡短章節/,
    /فصول قصيرة/,
    /Cutubyo gaaban/,
    /data-i18n="chap\.13\.t">Traditions, holidays &amp; everyday culture/,
  ].forEach((pattern) => assert.match(normalizedSurface, pattern));
});
