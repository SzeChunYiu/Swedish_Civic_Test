const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const previewPath = path.join(repoRoot, 'lib/localization/trUiPreview.ts');
const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function literalRegExp(phrase) {
  return new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('Turkish preview follows formal public-service study wording', () => {
  const source = read(previewPath);
  for (const phrase of [
    'Ayarlar',
    'Soru dili',
    'Günlük hedef',
    'Alıştırmaya başlayın',
    'Deneme sınavı',
    'Doğru.',
    'Tam doğru değil.',
    'Cevap açıklaması',
    'Kaynak materyal',
    'Yanlış yaptığınız soruları gözden geçirin',
    'İlerlemeniz',
    'Öğrenme yolu',
    'Bu dil sürümü hazırlanıyor.',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const mechanicalPhrase of [
    'karar yapmak',
    "Session'a",
    'sahte sınav',
    'Sen doğrusun',
    'Yanlış!',
    'passport',
  ]) {
    assert.doesNotMatch(source, literalRegExp(mechanicalPhrase));
  }
});

test('Turkish preview covers compliance, monetization, onboarding, support, sources, and search', () => {
  const source = read(previewPath);
  for (const phrase of [
    'Yasal bilgiler ve kaynaklar',
    'Gizlilik politikası',
    'Reklamları kaldırın',
    'Hoş geldiniz',
    'Sınav hakkında',
    'Destek ve geri bildirim',
    'Öğrenme kaynakları',
    'Kavram ve bölüm arayın',
    'Resmî bir sınav değildir',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of [
    'Pasaport alın',
    'Bu uygulamayla sınavı geçin',
    'vatandaşlığı garanti eder',
  ]) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Turkish preview avoids outcome promises and preserves Swedish civic terms', () => {
  const source = read(previewPath);
  for (const phrase of [
    'İsveç Parlamentosu (Riksdag)',
    'UHR kaynak materyaline göre hazırlanmıştır',
    "İsveç'te",
    'resmî sonucu öngörmez',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['garanti', 'sınavı geçeceksiniz', 'vatandaşlık alırsınız', 'pasaport']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Turkish preview does not enable runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'tr',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales.tr.appAvailable, false);
  assert.equal(readiness.locales.tr.uiStrings, 'not_started');
  assert.equal(readiness.locales.tr.questionContent, 'pilot_q001_q180_machine_assisted');
  assert.equal(readiness.locales.tr.releaseGate, 'blocked');
});
