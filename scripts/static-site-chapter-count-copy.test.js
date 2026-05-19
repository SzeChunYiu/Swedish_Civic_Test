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
  return (homeChapterListHtml(indexHtml).match(/<li>/g) ?? []).length;
}

function homeChapterListHtml(indexHtml) {
  const listMatch = indexHtml.match(/<ol class="list-quiet">([\s\S]*?)<\/ol>/);
  assert.ok(listMatch, 'home chapter list should be present');
  return listMatch[1];
}

function homeChapterListMetaKeys(indexHtml) {
  return Array.from(
    homeChapterListHtml(indexHtml).matchAll(
      /<span class="list-quiet__meta" data-i18n="(chap\.\d+\.m1)"><\/span\s*>/g,
    ),
    (match) => match[1],
  );
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

test('static site chapter-card question counts are derived from generated bank metadata', () => {
  const chapterMeta = staticChapterMeta();
  const indexHtml = read('site/index.html');
  const chapterListHtml = homeChapterListHtml(indexHtml);
  const appSource = read('site/app.js');
  const i18nElements = chapterMeta.map((chapter) => ({
    dataset: { i18n: `chap.${chapter.id}.m1` },
    innerHTML: '',
  }));
  const context = loadStaticAppContext(chapterMeta, i18nElements);

  assert.doesNotMatch(appSource, /"chap\.\d+\.m1"\s*:/);
  assert.deepEqual(
    homeChapterListMetaKeys(indexHtml),
    Array.from(chapterMeta, (chapter) => `chap.${chapter.id}.m1`),
  );
  assert.doesNotMatch(chapterListHtml, /\b\d+\s+(?:questions|frågor|full mocks)\b/i);

  context.window.applyLang('en');
  assert.deepEqual(
    Array.from(i18nElements, (element) => String(element.innerHTML)),
    Array.from(chapterMeta, (chapter) => `${chapter.questionCount} questions`),
  );

  context.window.applyLang('sv');
  assert.deepEqual(
    Array.from(i18nElements, (element) => String(element.innerHTML)),
    Array.from(chapterMeta, (chapter) => `${chapter.questionCount} frågor`),
  );

  assert.equal(context.window.smtChapterQuestionCountLabel(12, 'en'), '105 questions');
  assert.equal(context.window.smtChapterQuestionCountLabel(12, 'sv'), '105 frågor');
});
