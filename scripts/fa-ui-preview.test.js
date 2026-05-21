const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const previewPath = path.join(repoRoot, 'lib/localization/faUiPreview.ts');
const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function literalRegExp(phrase) {
  return new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('Persian preview follows clear public-information study wording', () => {
  const source = read(previewPath);
  for (const phrase of [
    'تنظیمات',
    'زبان سؤال‌ها',
    'هدف روزانه',
    'تمرین را شروع کنید',
    'آزمون آزمایشی',
    'درست است.',
    'این بار پاسخ درست نبود.',
    'توضیح پاسخ',
    'مطالب مرجع',
    'مرور اشتباهات',
    'پیشرفت شما',
    'مسیر یادگیری',
    'این نسخه در حال آماده‌سازی است.',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const mechanicalPhrase of [
    'یک تصمیم بسازید',
    'سوال درباره است',
    'جلسه تمرین',
    'امتحان جعلی',
    'شما صحیح هستید',
    'غلط!',
    'سویدن',
  ]) {
    assert.doesNotMatch(source, literalRegExp(mechanicalPhrase));
  }
});

test('Persian preview covers compliance, monetization, onboarding, support, sources, and search', () => {
  const source = read(previewPath);
  for (const phrase of [
    'اطلاعات حقوقی و منابع',
    'سیاست حریم خصوصی',
    'حذف تبلیغات',
    'خوش آمدید',
    'درباره آزمون',
    'پشتیبانی و بازخورد',
    'منابع یادگیری',
    'جست‌وجوی مفهوم‌ها و بخش‌ها',
    'آزمون رسمی نیست',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['گذرنامه بگیرید', 'قبولی را تضمین می‌کند', 'شهروندی را تضمین می‌کند']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Persian preview avoids outcome promises and preserves Swedish civic terms', () => {
  const source = read(previewPath);
  for (const phrase of [
    'پارلمان سوئد (ریسکداگ)',
    'بر اساس مطالب مرجع UHR تهیه شده است',
    'در سوئد',
    'نتیجه رسمی را پیش‌بینی نمی‌کند',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['تضمین', 'حتماً قبول می‌شوید', 'شهروندی می‌گیرید', 'گذرنامه']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Persian preview does not enable runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'fa',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales.fa.appAvailable, false);
  assert.equal(readiness.locales.fa.uiStrings, 'not_started');
  assert.equal(readiness.locales.fa.questionContent, 'pilot_q001_q173_machine_assisted');
  assert.equal(readiness.locales.fa.releaseGate, 'blocked');
});
