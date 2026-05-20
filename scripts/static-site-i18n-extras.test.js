const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

const somaliHighFrequencyKeys = [
  'hero.eyebrow',
  'hero.lede',
  'hero.cta1',
  'hero.cta2',
  'consent.title',
  'consent.body',
  'consent.min',
  'consent.all',
  'settings.title',
  'settings.theme',
  'settings.theme.light',
  'settings.theme.dark',
  'settings.theme.auto',
  'settings.language',
  'settings.text',
  'settings.misc',
  'settings.consent.reset',
  'settings.savedHint',
  'settings.done',
  'footer.t1',
  'footer.t2',
  'footer.h.study',
  'footer.h.legal',
  'footer.h.about',
  'footer.h.fika',
];

const expectedSomaliCopy = {
  'hero.h1a': 'Gudub imtixaanka.',
  'hero.lede':
    'App barasho deggan oo aan rasmi ahayn oo loogu talagalay imtixaanka muwaadinnimada Iswiidhan. Cutubyo gaagaaban, tababar caqli leh, iyo imtixaan tijaabo ah oo maalinta imtixaanka ka dhigaya mid ka cabsi yar sheeko yar oo deriska lala yeesho.',
  'consent.body':
    'Waxaan isticmaalnaa Google AdSense si aan u muujinno xayaysiisyo kooban. AdSense waxay isticmaashaa cookies, waxaana laga yaabaa inay u adeegsato xayaysiisyo la shakhsiyeeyay. Aqbal dhammaan, kaliya kuwa lagama maarmaanka ah, ama akhri <a href="#/privacy">bogga asturnaanta</a>.',
  'settings.title': 'Dejinta',
  'settings.theme.auto': 'Si otomaatig ah',
  'settings.done': 'Dhammay',
};

const forbiddenSomaliFragments = [
  'Goobinta',
  'Toosan',
  'Gudaha',
  'qaab gaar ah',
  'ka yaraan cabsida ka yaraan',
];

const englishFallbacksByKey = {
  'hero.lede': "A friendly, unofficial study app for Sweden's medborgarskapsprov.",
  'consent.body': 'We use Google AdSense',
  'settings.title': 'Settings',
  'settings.theme': 'Theme',
  'settings.theme.auto': 'Auto',
  'settings.done': 'Done',
};

function loadExtraI18n() {
  const source = fs.readFileSync(path.join(repoRoot, 'site/i18n-extras.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 3000 });
  return sandbox.window.__i18n_extra;
}

test('Somali static-site high-frequency labels use reviewed local copy', () => {
  const extra = loadExtraI18n();
  const somali = extra?.so;

  assert.equal(typeof somali, 'object');
  for (const [key, expected] of Object.entries(expectedSomaliCopy)) {
    assert.equal(somali[key], expected, `Somali ${key} should use reviewed copy`);
  }
});

test('Somali static-site labels reject known machine-like strings and English fallback', () => {
  const extra = loadExtraI18n();
  const somali = extra?.so;

  assert.equal(typeof somali, 'object');
  for (const key of somaliHighFrequencyKeys) {
    const value = somali[key];
    assert.equal(typeof value, 'string', `Somali ${key} must be a string`);
    assert.notEqual(value.trim(), '', `Somali ${key} must not be empty`);

    const englishFallback = englishFallbacksByKey[key];
    if (englishFallback) {
      assert.doesNotMatch(value, new RegExp(englishFallback, 'i'), `${key} uses English fallback`);
    }
  }

  const serializedSomali = Object.values(somali).join('\n');
  for (const fragment of forbiddenSomaliFragments) {
    assert.doesNotMatch(
      serializedSomali,
      new RegExp(fragment, 'i'),
      `Somali dictionary still contains ${fragment}`,
    );
  }
});
