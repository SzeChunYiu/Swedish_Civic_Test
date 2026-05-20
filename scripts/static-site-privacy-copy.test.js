const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

test('static site privacy copy rejects stale monetization claims', () => {
  const surface = [read('site/app.js'), read('site/index.html')].join('\n');

  [
    /real ad rendering is disabled/i,
    /avst[aä]ngd f[oö]r v1\.0/i,
    /If we ever add premium/i,
    /Om vi n[aå]gonsin l[aä]gger till premium/i,
    /we don't sell anything/i,
    /s[aä]ljer ingenting/i,
    /collects nothing and shares nothing/i,
    /samlar inget och delar inget/i,
    /collects no user data and shares no user data/i,
    /samlar inga anv[aä]ndardata och delar inga anv[aä]ndardata/i,
    /No third-party trackers/i,
    /Inga tredjepartssp[aå]rare/i,
  ].forEach((pattern) => assert.doesNotMatch(surface, pattern));
});

test('static site privacy copy names current ads, consent, and Remove Ads behavior', () => {
  const surface = [read('site/app.js'), read('site/index.html')].join('\n');

  [
    /Google AdSense/,
    /Google Mobile Ads \(AdMob\)/,
    /ad and consent signals/,
    /annons- och samtyckessignaler/,
    /Remove Ads is an optional one-time 29 SEK purchase that removes ads/,
    /Ta bort annonser .*eng[aå]ngsk[oö]p p[aå] 29 SEK som tar bort annonser/,
    /ads never collect study answers or progress/,
    /annonser samlar aldrig in dina studiesvar eller framsteg/,
  ].forEach((pattern) => assert.match(surface, pattern));
});

test('static home privacy microcopy scopes local study data without denying ad tracking', () => {
  const appSource = read('site/app.js');
  const surface = staticPublicPrivacySurface();
  const noTrackingRegression = surface
    .replace('Study progress stays local.', 'No tracking.')
    .replace('Studieframsteg stannar lokalt.', 'Ingen spårning.');

  assertNoUnqualifiedNoTrackingClaims(surface);
  assert.throws(
    () => assertNoUnqualifiedNoTrackingClaims(noTrackingRegression),
    /No tracking|Ingen spårning/,
  );
  assert.match(appSource, /"numbers\.4": "to start\. No login\. Study progress stays local\."/);
  assert.match(appSource, /"numbers\.4": "att börja\. Ingen inloggning\. Ingen spårning\."/);
  assert.match(surface, /Google AdSense/);
  assert.match(surface, /reviewed web slot IDs are configured/);
  assert.match(surface, /granskade webbplats-ID:n [aä]r konfigurerade/);
  assert.match(surface, /Google Mobile Ads \(AdMob\)/);
  assert.match(surface, /ad and consent signals/);
  assert.match(surface, /annons- och samtyckessignaler/);
});

test('static site Swedish privacy copy uses natural study-streak wording', () => {
  const appSource = read('site/app.js');
  const privacyParagraphs = [
    ...staticDictionaryValues(appSource, 'privacy.s3.p'),
    ...staticDictionaryValues(appSource, 'privacy.s4.p'),
  ];
  const swedishPrivacyParagraphs = privacyParagraphs.filter((paragraph) =>
    /\b(?:lagras|skickar|annonsleverantörer|studiesvar)\b/i.test(paragraph),
  );
  const englishPrivacyParagraphs = privacyParagraphs.filter((paragraph) =>
    /\b(?:stored locally|ad providers)\b/i.test(paragraph),
  );

  assert.equal(swedishPrivacyParagraphs.length, 2);
  assert.equal(englishPrivacyParagraphs.length, 2);

  swedishPrivacyParagraphs.forEach((paragraph) => {
    assert.doesNotMatch(
      paragraph,
      /\bstreaks\b/i,
      'Swedish static privacy copy must not use the English plural "streaks"',
    );
    assert.match(
      paragraph,
      /\bstudiesviter\b/i,
      'Swedish static privacy copy should name locally stored study streaks naturally',
    );
  });

  englishPrivacyParagraphs.forEach((paragraph) => {
    assert.match(paragraph, /\bstreaks\b/i);
  });
});

test('static Swedish dictionary rejects grammar and tone artifacts', () => {
  const source = read('site/app.js');
  const blockedPhrases = [
    ['ingen', 'juridiska'].join(' '),
    ['fika', 'stor'].join('-'),
    ['fika', 'skador'].join('-'),
  ];

  blockedPhrases.forEach((phrase) => {
    assert.doesNotMatch(source, new RegExp(phrase, 'i'));
  });

  [
    /inget juridiskt kr[aå]ngel/,
    /en kort studievana/,
    /inte ansvariga f[oö]r missade deadlines, avslagna ans[oö]kningar eller beslut/,
  ].forEach((pattern) => assert.match(source, pattern));
});
