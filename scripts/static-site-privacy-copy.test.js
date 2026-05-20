const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const staticPrivacyCopyFiles = Object.freeze([
  'site/app.js',
  'site/index.html',
  'site/i18n-extras.js',
  'site/buddies.js',
  'site/tweaks.jsx',
]);

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function staticPrivacySurface() {
  return staticPrivacyCopyFiles.map(read).join('\n');
}

function staticSiteSwedishDictionary() {
  const source = read('site/app.js');
  const match = source.match(/\n  sv: \{([\s\S]*?)\n  \}\n\};/);
  assert.ok(match, 'site/app.js Swedish dictionary block stays parseable');
  return match[1];
}

test('static site privacy copy rejects stale monetization claims', () => {
  const surface = staticPrivacySurface();

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
    /\bNo tracking\b/i,
    /\bzero tracking\b/i,
    /\btrack(?:s|ing)? nothing\b/i,
    /\bIngen spårning\b/i,
    /\bspårar inte\b/i,
    /No third-party trackers/i,
    /Inga tredjepartssp[aå]rare/i,
  ].forEach((pattern) => assert.doesNotMatch(surface, pattern));
});

test('static site privacy copy names current ads, consent, and Remove Ads behavior', () => {
  const surface = staticPrivacySurface();

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

test('static site home privacy shorthand is scoped to local study progress', () => {
  const surface = staticPrivacySurface();

  assert.match(surface, /Study progress stays local/);
  assert.match(surface, /Studieframsteg sparas lokalt/);
  assert.match(surface, /No login/);
  assert.match(surface, /Ingen inloggning/);
  assert.doesNotMatch(surface, /\bNo tracking\b/i);
  assert.doesNotMatch(surface, /\bIngen spårning\b/i);
});

test('static site Swedish study copy uses natural Swedish study terms', () => {
  const swedishDictionary = staticSiteSwedishDictionary();

  [/Spaced repetition/i, /\bquiz\b/i, /\btiming\b/i, /litet quiz/i, /riktig timing/i].forEach(
    (pattern) => assert.doesNotMatch(swedishDictionary, pattern),
  );

  [/Repetition med intervall/, /kort övning/, /realistisk tidskänsla/].forEach((pattern) =>
    assert.match(swedishDictionary, pattern),
  );
});
