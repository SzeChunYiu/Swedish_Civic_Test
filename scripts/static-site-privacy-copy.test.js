const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const unqualifiedNoTrackingPatterns = [
  /\bNo tracking\b/i,
  /\bzero tracking\b/i,
  /\btrack(?:s|ing)? nothing\b/i,
  /\bNo third-party trackers\b/i,
  /\bIngen spårning\b/i,
  /\bspårar inte\b/i,
  /\bInga tredjepartssp[aå]rare\b/i,
];

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function staticSiteSwedishDictionary() {
  const source = read('site/app.js');
  const match = source.match(/\n  sv: \{([\s\S]*?)\n  \}\n\};/);
  assert.ok(match, 'site/app.js Swedish dictionary block stays parseable');
  return match[1];
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

test('static site privacy copy avoids unqualified no-tracking claims', () => {
  const surface = [read('site/app.js'), read('site/index.html')].join('\n');

  unqualifiedNoTrackingPatterns.forEach((pattern) => assert.doesNotMatch(surface, pattern));
  assert.match(surface, /No login\. Study progress stays local\./);
  assert.match(surface, /Ingen inloggning\. Dina framsteg sparas lokalt\./);
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

test('static site Swedish study copy uses natural Swedish study terms', () => {
  const swedishDictionary = staticSiteSwedishDictionary();

  [/Spaced repetition/i, /\bquiz\b/i, /\btiming\b/i, /litet quiz/i, /riktig timing/i].forEach(
    (pattern) => assert.doesNotMatch(swedishDictionary, pattern),
  );

  [/Repetition med intervall/, /kort övning/, /tidsatt övning/].forEach((pattern) =>
    assert.match(swedishDictionary, pattern),
  );
});
