const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const previewPath = path.join(repoRoot, 'lib/localization/arUiPreview.ts');
const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function literalRegExp(phrase) {
  return new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('Arabic preview follows Modern Standard Arabic public-information wording', () => {
  const source = read(previewPath);
  for (const phrase of [
    'الإعدادات',
    'لغة الأسئلة',
    'الهدف اليومي',
    'ابدأ التدريب',
    'اختبار تجريبي',
    'إجابة صحيحة.',
    'لم تكن الإجابة صحيحة هذه المرة.',
    'شرح الإجابة',
    'مادة مرجعية',
    'راجع الأخطاء',
    'تقدمك',
    'مسار التعلم',
    'هذا الإصدار قيد الإعداد.',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const mechanicalPhrase of [
    'اصنع قرارًا',
    'السؤال حول عن',
    'جلسة ممارسة',
    'الامتحان المزيف',
    'أنت صحيح',
    'خطأ!',
    'مرر الاختبار',
  ]) {
    assert.doesNotMatch(source, literalRegExp(mechanicalPhrase));
  }
});

test('Arabic preview covers compliance, monetization, onboarding, support, sources, and search', () => {
  const source = read(previewPath);
  for (const phrase of [
    'معلومات قانونية ومصادر',
    'سياسة الخصوصية',
    'إزالة الإعلانات',
    'مرحبًا بك',
    'عن الاختبار',
    'الدعم والملاحظات',
    'مصادر التعلم',
    'ابحث عن المفاهيم والأقسام',
    'ليس اختبارًا رسميًا',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['احصل على جواز سفر', 'يضمن اجتياز الاختبار', 'يضمن الجنسية']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Arabic preview avoids outcome promises and preserves Swedish civic terms', () => {
  const source = read(previewPath);
  for (const phrase of [
    'البرلمان السويدي (الريكسداغ)',
    'بالاستناد إلى مادة UHR المرجعية',
    'في السويد',
    'لا يتنبأ بنتيجة رسمية',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['يضمن', 'ستجتاز الاختبار', 'ستحصل على الجنسية', 'جواز سفر']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Arabic preview does not enable runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'ar',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales.ar.appAvailable, false);
  assert.equal(readiness.locales.ar.uiStrings, 'not_started');
  assert.equal(readiness.locales.ar.questionContent, 'pilot_q001_q175_machine_assisted');
  assert.equal(readiness.locales.ar.releaseGate, 'blocked');
});
