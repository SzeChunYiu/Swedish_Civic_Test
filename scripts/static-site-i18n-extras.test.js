const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const ARABIC_SCRIPT_PATTERN = /[\u0600-\u06ff]/;
const REQUIRED_ARABIC_STATIC_UI_KEYS = [
  'nav.home',
  'nav.practice',
  'nav.mock',
  'nav.ebook',
  'nav.support',
  'nav.privacy',
  'nav.terms',
  'nav.sources',
  'nav.cta',
  'hero.eyebrow',
  'hero.h1a',
  'hero.h1b',
  'hero.h1c',
  'hero.lede',
  'hero.cta1',
  'hero.cta2',
  'consent.title',
  'consent.body',
  'consent.min',
  'consent.all',
  'settings.title',
  'settings.theme',
  'settings.theme.light',
  'settings.theme.dark',
  'settings.theme.auto',
  'settings.palette',
  'settings.palette.sub',
  'settings.buddy',
  'settings.buddy.sub',
  'settings.buddy.show',
  'settings.language',
  'settings.text',
  'settings.text.s',
  'settings.text.m',
  'settings.text.l',
  'settings.misc',
  'settings.motion',
  'settings.aurora',
  'settings.flag',
  'settings.consent.reset',
  'settings.savedHint',
  'settings.done',
  'footer.t1',
  'footer.t2',
  'footer.h.study',
  'footer.h.legal',
  'footer.h.about',
  'footer.about.p',
  'footer.h.fika',
  'footer.fika.p',
  'footer.honest.p',
  'footer.copyright',
  'footer.fika',
];
const BANNED_ARABIC_STATIC_UI_VALUES = new Map([
  [
    'hero.lede',
    'تطبيق دراسة هادئ وغير رسمي لاختبار المواطنة السويدي. فصول قصيرة، ووضع تدريب ذكي، واختبار وهمي يجعل يوم الامتحان أقل رعباً.',
  ],
  ['settings.consent.reset', 'إعادة ضبط موافقة الكوكيز / الإعلانات…'],
  ['footer.fika', 'صُنع باعتدال · مُختبر بالقهوة.'],
  ['nav.ebook', 'كتاب'],
  ['settings.theme', 'السمة'],
]);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadExtrasDictionary() {
  const window = { i18n: {} };
  const source = read('site/i18n-extras.js');
  return new Function('window', `${source}\nreturn window.i18n || window.__i18n_extra;`)(window);
}

test('Arabic static-site extras cover high-frequency UI without English fallbacks', () => {
  const extras = loadExtrasDictionary();
  const arabic = extras.ar;

  assert.equal(typeof arabic, 'object');

  for (const key of REQUIRED_ARABIC_STATIC_UI_KEYS) {
    const value = arabic[key];
    assert.equal(typeof value, 'string', `${key} should have Arabic copy`);
    assert.equal(value, value.trim().replace(/\s+/g, ' '), `${key} should be normalized`);
    assert.match(value, ARABIC_SCRIPT_PATTERN, `${key} should not fall back to English`);
  }
});

test('Arabic static-site extras avoid known machine-like labels', () => {
  const { ar: arabic } = loadExtrasDictionary();

  for (const [key, value] of BANNED_ARABIC_STATIC_UI_VALUES) {
    assert.notEqual(arabic[key], value, `${key} should avoid literal machine-like Arabic`);
  }

  assert.match(arabic['hero.lede'], /اختبار تجريبي/);
  assert.match(arabic['settings.consent.reset'], /ملفات تعريف الارتباط/);
  assert.match(arabic['nav.ebook'], /دليل/);
  assert.equal(arabic['settings.theme'], 'المظهر');
});
