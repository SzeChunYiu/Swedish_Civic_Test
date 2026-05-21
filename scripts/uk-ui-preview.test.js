const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const previewPath = path.join(repoRoot, 'lib/localization/ukUiPreview.ts');
const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function literalRegExp(phrase) {
  return new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('Ukrainian preview follows plain public-service study wording', () => {
  const source = read(previewPath);
  for (const phrase of [
    'Налаштування',
    'Мова запитань',
    'Щоденна мета',
    'Почати тренування',
    'Пробний іспит',
    'Це правильна відповідь.',
    'Цього разу відповідь була неправильною.',
    'Пояснення відповіді',
    'Джерельні матеріали',
    'Переглянути неправильні відповіді',
    'Ваш прогрес',
    'Навчальний шлях',
    'Ця мовна версія готується.',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const mechanicalPhrase of [
    'зробити рішення',
    'фальшивий іспит',
    'Ти правильний',
    'Неправильно!',
    'passport',
  ]) {
    assert.doesNotMatch(source, literalRegExp(mechanicalPhrase));
  }
});

test('Ukrainian preview covers compliance, monetization, onboarding, support, sources, and search', () => {
  const source = read(previewPath);
  for (const phrase of [
    'Правова інформація та джерела',
    'Політика конфіденційності',
    'Прибрати рекламу',
    'Вітаємо',
    'Про тест',
    'Підтримка та відгуки',
    'Джерела для навчання',
    'Шукайте поняття й розділи',
    'Це не офіційний іспит',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of [
    'Отримайте паспорт',
    'Складіть тест завдяки застосунку',
    'гарантує громадянство',
  ]) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Ukrainian preview avoids outcome promises and preserves Swedish civic terms', () => {
  const source = read(previewPath);
  for (const phrase of [
    'шведський парламент (Riksdag)',
    'матеріалів UHR',
    'у Швеції',
    'не передбачає офіційний результат',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['гарантія', 'ви складете іспит', 'отримаєте громадянство', 'паспорт']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Ukrainian preview does not enable runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'uk',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales.uk.appAvailable, false);
  assert.equal(readiness.locales.uk.uiStrings, 'not_started');
  assert.equal(readiness.locales.uk.questionContent, 'pilot_q001_q173_machine_assisted');
  assert.equal(readiness.locales.uk.releaseGate, 'blocked');
});
