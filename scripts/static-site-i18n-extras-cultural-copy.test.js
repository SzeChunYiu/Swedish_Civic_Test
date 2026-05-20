const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(repoRoot, 'site/i18n-extras.js'), 'utf8');
const expectedHomepageSlogans = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'data/homepage_slogans_v6.json'), 'utf8'),
).exactReplacementKeys;

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
    /آزمون را قبول شوید/i,
    /گذرنامه بگیرید/i,
    /zdasz egzamin/i,
    /dostaniesz paszport/i,
    /ፓስፖርት ትወስድ/,
    /ዜግነት ትረክብ/,
    /складете іспит/i,
    /отримаєте паспорт/i,
    /پاسپۆرت دەست دەکەوێت/,
    /هاووڵاتیبوون دەست دەکەوێت/,
  ];

  for (const locale of ['zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk']) {
    const joined = valuesFor(locale).join('\n');
    for (const pattern of forbidden) {
      assert.doesNotMatch(joined, pattern, `${locale} contains unsupported outcome promise`);
    }
  }
});

test('extra-language homepage slogan copy matches reviewed v6 local phrasing', () => {
  const extras = loadExtras();
  for (const locale of ['zh-Hans', 'zh-Hant', 'ar', 'ckb', 'fa', 'pl', 'so', 'ti', 'tr', 'uk']) {
    for (const key of ['hero.h1a', 'hero.h1b', 'hero.cta1', 'demo.h1', 'demo.h2', 'footer.t1']) {
      assert.equal(extras[locale][key], expectedHomepageSlogans[locale][key], `${locale}.${key}`);
    }
  }
});

test('Chinese homepage copy keeps Mainland Simplified and Taiwan Traditional choices distinct', () => {
  const extras = loadExtras();

  assert.match(extras['zh-Hans']['hero.eyebrow'], /无需账号/);
  assert.match(extras['zh-Hans']['footer.t1'], /备考/);
  assert.doesNotMatch(extras['zh-Hans']['hero.eyebrow'], /不用帳號/);
  assert.doesNotMatch(extras['zh-Hans']['hero.lede'], /步調/);

  assert.match(extras['zh-Hant']['hero.eyebrow'], /不用帳號/);
  assert.match(extras['zh-Hant']['footer.t1'], /準備/);
  assert.doesNotMatch(extras['zh-Hant']['hero.eyebrow'], /无需账号/);
  assert.doesNotMatch(extras['zh-Hant']['hero.lede'], /步调/);
});

test('Chinese i18n extras use CJK punctuation in prose', () => {
  const cjkTextWithAsciiPunctuation = /[\u3400-\u9fff][,?]|[,?][\u3400-\u9fff]/;

  for (const locale of ['zh-Hans', 'zh-Hant']) {
    for (const [key, value] of Object.entries(loadExtras()[locale])) {
      assert.doesNotMatch(
        value,
        cjkTextWithAsciiPunctuation,
        `${locale}.${key} uses ASCII punctuation near CJK text`,
      );
    }
  }
});
