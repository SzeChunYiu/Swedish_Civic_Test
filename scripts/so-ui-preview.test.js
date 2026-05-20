const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const previewPath = path.join(repoRoot, 'lib/localization/soUiPreview.ts');
const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('Somali preview uses public-information study wording from the style guide', () => {
  const source = read(previewPath);
  for (const phrase of [
    'Dejinta',
    'Luqadda su’aalaha',
    'Hadafka maalinta',
    'Bilow layliga',
    'imtixaan tijaabo ah',
    'Waa sax.',
    'Markan jawaabtu ma saxna.',
    'Sharaxaadda jawaabta',
    'Ilaha macluumaadka',
    'Noocan luqadeed weli waa la diyaarinayaa.',
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[{}]/g, '\\$&')));
  }

  for (const mechanicalPhrase of [
    'session-ka',
    'fake ah',
    'Panel sharaxaad',
    'Samee bilow',
    'waad khaldan tahay',
    'passport',
  ]) {
    assert.doesNotMatch(source, new RegExp(mechanicalPhrase));
  }
});

test('Somali preview avoids outcome promises and keeps local privacy wording', () => {
  const source = read(previewPath);
  for (const forbidden of ['baasaboor', 'dammaanad', 'waad gudbaysaa', 'muwaadinimo ayaad helaysaa']) {
    assert.doesNotMatch(source, new RegExp(forbidden));
  }
  assert.match(source, /qalabkan/);
  assert.match(source, /tixraaca UHR/);
});

test('Somali preview does not enable runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'so',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales.so.appAvailable, false);
  assert.equal(readiness.locales.so.uiStrings, 'not_started');
  assert.equal(readiness.locales.so.questionContent, 'not_started');
  assert.equal(readiness.locales.so.releaseGate, 'blocked');
});
