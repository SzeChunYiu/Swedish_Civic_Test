const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(repoRoot, 'site/i18n-extras.js'), 'utf8');

function loadExtras() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 3000 });
  return sandbox.window.__i18n_extra;
}

function valuesFor(locale) {
  return Object.values(loadExtras()[locale]);
}

test('extra-language i18n copy avoids pass/passport promises', () => {
  const forbidden = [
    /通过测试。/,
    /拿到护照。/,
    /通過測試。/,
    /拿到護照。/,
    /اجتز الاختبار\./,
    /احصل على الجواز\./,
    /Imtixaanka uga gud\./,
    /Hel baasaboorka\./,
    /Sınavı geç\./i,
    /Pasaportu al\./i,
  ];

  for (const locale of ['zh-Hans', 'zh-Hant', 'ar', 'so', 'tr']) {
    const joined = valuesFor(locale).join('\n');
    for (const pattern of forbidden) {
      assert.doesNotMatch(joined, pattern, `${locale} contains unsupported outcome promise`);
    }
  }
});

test('Chinese hero and demo copy uses native study-app phrasing', () => {
  const extras = loadExtras();

  assert.equal(extras['zh-Hans']['hero.h1a'], '练瑞典公民知识。');
  assert.equal(extras['zh-Hans']['hero.h1b'], '按自己的节奏准备。');
  assert.equal(extras['zh-Hans']['hero.cta2'], '先试一道题');
  assert.equal(extras['zh-Hans']['demo.h2'], '从一道题开始。');
  assert.equal(extras['zh-Hans']['footer.t1'], '认真准备。');

  assert.equal(extras['zh-Hant']['hero.h1a'], '練習瑞典公民知識。');
  assert.equal(extras['zh-Hant']['hero.h1b'], '照自己的步調準備。');
  assert.equal(extras['zh-Hant']['hero.cta2'], '先試一題');
  assert.equal(extras['zh-Hant']['demo.h2'], '從一題開始。');
  assert.equal(extras['zh-Hant']['footer.t1'], '認真準備。');
});



test('Arabic, Somali, and Turkish hero copy uses study-oriented wording', () => {
  const extras = loadExtras();

  assert.equal(extras.ar['hero.h1a'], 'تدرّب على معرفة المجتمع السويدي.');
  assert.equal(extras.ar['hero.h1b'], 'استعدّ بخطوات واضحة.');
  assert.equal(extras.ar['hero.cta1'], 'ابدأ التدريب ←');
  assert.equal(extras.ar['footer.t1'], 'استعدّ بهدوء.');

  assert.equal(extras.so['hero.h1a'], 'Baro aqoonta bulshada Iswiidhan.');
  assert.equal(extras.so['hero.h1b'], 'Isu diyaari tallaabo-tallaabo.');
  assert.equal(extras.so['hero.cta1'], 'Bilow tababarka →');
  assert.equal(extras.so['settings.title'], 'Dejinta');
  assert.equal(extras.so['footer.t1'], 'Si deggan isu diyaari.');

  assert.equal(extras.tr['hero.h1a'], 'İsveç toplumunu öğrenin.');
  assert.equal(extras.tr['hero.h1b'], 'Kaynaklara göre çalışın.');
  assert.equal(extras.tr['hero.cta1'], 'Alıştırmaya başlayın →');
  assert.equal(extras.tr['settings.title'], 'Ayarlar');
  assert.equal(extras.tr['footer.t1'], 'Sakin çalışın.');
});

test('Chinese i18n extras use CJK punctuation in prose', () => {
  const cjkTextWithAsciiPunctuation = /[\u3400-\u9fff][,?]|[,?][\u3400-\u9fff]/;

  for (const locale of ['zh-Hans', 'zh-Hant']) {
    for (const [key, value] of Object.entries(loadExtras()[locale])) {
      assert.doesNotMatch(value, cjkTextWithAsciiPunctuation, `${locale}.${key} uses ASCII punctuation near CJK text`);
    }
  }
});
