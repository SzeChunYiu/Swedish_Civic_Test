const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const previewPath = path.join(repoRoot, 'lib/localization/ckbUiPreview.ts');
const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function literalRegExp(phrase) {
  return new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('Sorani preview follows plain public-service study wording', () => {
  const source = read(previewPath);
  for (const phrase of [
    'ڕێکخستنەکان',
    'زمانی پرسیارەکان',
    'ئامانجی ڕۆژانە',
    'دەست بە ڕاهێنان بکە',
    'تاقیکردنەوەی ئەزموونی',
    'ئەمە وەڵامی ڕاستە.',
    'ئەم جارە وەڵامەکە ڕاست نەبوو.',
    'ڕوونکردنەوەی وەڵام',
    'سەرچاوەکانی خوێندن',
    'پێداچوونەوە بە وەڵامە هەڵەکان',
    'پێشکەوتنت',
    'ڕێگای فێربوون',
    'ئەم وەشانی زمانە ئامادە دەکرێت.',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const mechanicalPhrase of [
    'دروستکردنی بڕیار',
    'تاقیکردنەوەی ساختە',
    'تۆ ڕاستیت',
    'هەڵە!',
    'passport',
  ]) {
    assert.doesNotMatch(source, literalRegExp(mechanicalPhrase));
  }
});

test('Sorani preview covers compliance, monetization, onboarding, support, sources, and search', () => {
  const source = read(previewPath);
  for (const phrase of [
    'زانیاری یاسایی و سەرچاوەکان',
    'سیاسەتی تایبەتمەندی',
    'ڕیکلامەکان لاببە',
    'بەخێربێیت',
    'دەربارەی تاقیکردنەوەکە',
    'پشتیوانی و بۆچوون',
    'سەرچاوەکانی فێربوون',
    'بگەڕێ بۆ چەمک و بەشەکان',
    'ئەمە تاقیکردنەوەی فەرمی نییە',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of [
    'پاسپۆرت وەربگرە',
    'بەم ئەپە تاقیکردنەوەکە تێپەڕ بکە',
    'هاووڵاتیبوون مسۆگەر دەکات',
  ]) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Sorani preview avoids outcome promises and preserves Swedish civic terms', () => {
  const source = read(previewPath);
  for (const phrase of [
    'پەرلەمانی سوێد (Riksdag)',
    'ماددەکانی UHR',
    'لە سوێد',
    'ئەنجامی فەرمی پێشبینی ناکات',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of [
    'مسۆگەر',
    'تاقیکردنەوەکە تێپەڕ دەکەیت',
    'هاووڵاتیبوون وەردەگریت',
    'پاسپۆرت',
  ]) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Sorani preview does not enable runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'ckb',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales.ckb.appAvailable, false);
  assert.equal(readiness.locales.ckb.uiStrings, 'not_started');
  assert.equal(readiness.locales.ckb.questionContent, 'pilot_q001_q180_machine_assisted');
  assert.equal(readiness.locales.ckb.releaseGate, 'blocked');
});
