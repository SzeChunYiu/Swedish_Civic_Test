const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const previewPath = path.join(repoRoot, 'lib/localization/plUiPreview.ts');
const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function literalRegExp(phrase) {
  return new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('Polish preview follows plain public-service study wording', () => {
  const source = read(previewPath);
  for (const phrase of [
    'Ustawienia',
    'Język pytań',
    'Cel dzienny',
    'Rozpocznij ćwiczenie',
    'Egzamin próbny',
    'To prawidłowa odpowiedź.',
    'Tym razem odpowiedź nie była poprawna.',
    'Wyjaśnienie odpowiedzi',
    'Materiały źródłowe',
    'Przejrzyj błędne odpowiedzi',
    'Twój postęp',
    'Ścieżka nauki',
    'Ta wersja językowa jest w przygotowaniu.',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const mechanicalPhrase of [
    'zrobić decyzję',
    'sesja praktyki',
    'fałszywy egzamin',
    'Jesteś poprawny',
    'Źle!',
    'passport',
  ]) {
    assert.doesNotMatch(source, literalRegExp(mechanicalPhrase));
  }
});

test('Polish preview covers compliance, monetization, onboarding, support, sources, and search', () => {
  const source = read(previewPath);
  for (const phrase of [
    'Informacje prawne i źródła',
    'Polityka prywatności',
    'Usuń reklamy',
    'Witamy',
    'O teście',
    'Pomoc i opinie',
    'Źródła do nauki',
    'Szukaj pojęć i rozdziałów',
    'To nie jest oficjalny egzamin',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of [
    'Zdobądź paszport',
    'Zdaj test dzięki aplikacji',
    'gwarantuje obywatelstwo',
  ]) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Polish preview avoids outcome promises and preserves Swedish civic terms', () => {
  const source = read(previewPath);
  for (const phrase of [
    'szwedzki parlament (Riksdag)',
    'materiałów UHR',
    'w Szwecji',
    'nie przewiduje wyniku oficjalnego',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['gwarancja', 'zdasz egzamin', 'otrzymasz obywatelstwo', 'paszport']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Polish preview does not enable runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'pl',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales.pl.appAvailable, false);
  assert.equal(readiness.locales.pl.uiStrings, 'not_started');
  assert.equal(readiness.locales.pl.questionContent, 'pilot_q001_q175_machine_assisted');
  assert.equal(readiness.locales.pl.releaseGate, 'blocked');
});
