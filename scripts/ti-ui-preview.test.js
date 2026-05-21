const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const previewPath = path.join(repoRoot, 'lib/localization/tiUiPreview.ts');
const settingsStorePath = path.join(repoRoot, 'lib/storage/settingsStore.ts');
const localesPath = path.join(repoRoot, 'lib/i18n/locales.ts');
const readinessPath = path.join(repoRoot, 'docs/localization/readiness.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function literalRegExp(phrase) {
  return new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

test('Tigrinya preview follows public-information study wording', () => {
  const source = read(previewPath);
  for (const phrase of [
    'ቅጥዕታት',
    'ቋንቋ ሕቶታት',
    'ዕላማ መዓልታዊ',
    'ልምምድ ጀምር',
    'ፈተና ልምምድ',
    'መልስኻ ትኽክል እዩ።',
    'ኣብዚ ግዜ መልስኻ ትኽክል ኣይነበረን።',
    'መብርሂ መልሲ',
    'መወከሲ ጽሑፍ',
    'ጌጋታትካ መርምር',
    'ምዕባለኻ',
    'መንገዲ ምምሃር',
    'እዚ ቋንቋ ገና ይዳሎ ኣሎ።',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const mechanicalPhrase of ['ናይ ልምምድ ክፍለ ግዜ', 'ትኽክል ኢኻ', 'ጌጋ ኢኻ', 'ምንጪ ንብረት', 'passport']) {
    assert.doesNotMatch(source, literalRegExp(mechanicalPhrase));
  }
});

test('Tigrinya preview covers compliance, monetization, onboarding, support, sources, and search', () => {
  const source = read(previewPath);
  for (const phrase of [
    'ሕጋዊ ሓበሬታን ምንጭታትን',
    'ፖሊሲ ምስጢርነት',
    'ምልክታታት ኣልግስ',
    'እንቋዕ ብደሓን መጻእካ',
    'ብዛዕባ ፈተና',
    'ደገፍን ርእይቶን',
    'ምንጭታት ምምሃር',
    'ሓሳባትን ክፍልታትን ድለ',
    'ናይ መንግስቲ ፈተና ኣይኮነን',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['ፓስፖርት ትረክብ', 'ምዕዋት ይውሕስ', 'ዜግነት ይውሕስ']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Tigrinya preview avoids outcome promises and preserves Swedish civic terms', () => {
  const source = read(previewPath);
  for (const phrase of [
    'ፓርላማ ሽወደን (Riksdag)',
    'ኣብ መወከሲ ጽሑፍ UHR ተመርኲሱ',
    'ኣብ ሽወደን',
    'ናይ መንግስቲ ውጽኢት ኣይግምትን',
  ]) {
    assert.match(source, literalRegExp(phrase));
  }

  for (const forbidden of ['ይውሕስ', 'ክትዕወት ኢኻ', 'ዜግነት ትረክብ', 'ፓስፖርት']) {
    assert.doesNotMatch(source, literalRegExp(forbidden));
  }
});

test('Tigrinya preview does not enable runtime release', () => {
  const settingsStore = read(settingsStorePath);
  const locales = read(localesPath);
  const readiness = JSON.parse(read(readinessPath));

  assert.match(settingsStore, /export type AppLanguage = 'sv' \| 'en';/);
  assert.match(locales, /code: 'ti',[\s\S]*available: false,[\s\S]*fallback: 'en'/);
  assert.equal(readiness.locales.ti.appAvailable, false);
  assert.equal(readiness.locales.ti.uiStrings, 'not_started');
  assert.equal(readiness.locales.ti.questionContent, 'pilot_q001_q179_machine_assisted');
  assert.equal(readiness.locales.ti.releaseGate, 'blocked');
});
