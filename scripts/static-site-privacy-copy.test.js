const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  assertNoUnsupportedStaticReleaseCopy,
  findUnsupportedStaticReleaseCopyInSource,
  formatUnsupportedStaticReleaseCopy,
} = require('./static-site-release-copy-guard');
const {
  findStaticAdSenseSlotStateCopyIssues,
  staticAdSenseSlotsAreConfiguredInSource,
} = require('./check-live-site');

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
    /Google AdSense-ready ad slots/,
    /AdSense-ready web ad slots/,
    /prepared for <b>Google AdSense<\/b>/,
    /annonsytor f[oö]rberedda f[oö]r Google AdSense/,
    /Google Mobile Ads \(AdMob\)/,
    /ad and consent signals/,
    /annons- och samtyckessignaler/,
    /Remove Ads is an optional one-time 29 SEK purchase that removes ads/,
    /Ta bort annonser .*eng[aå]ngsk[oö]p p[aå] 29 SEK som tar bort annonser/,
    /ads never collect study answers or progress/,
    /annonser samlar aldrig in dina studiesvar eller framsteg/,
  ].forEach((pattern) => assert.match(surface, pattern));
});

test('static site privacy copy follows AdSense slot-state gate', () => {
  const indexSource = read('site/index.html');
  const appSource = read('site/app.js');

  assert.equal(staticAdSenseSlotsAreConfiguredInSource(appSource), false);
  assert.deepEqual(findStaticAdSenseSlotStateCopyIssues(indexSource, appSource), []);

  assert.match(indexSource, /This website has Google AdSense-ready ad slots/);
  assert.match(appSource, /This website has Google AdSense-ready ad slots/);
  assert.match(
    appSource,
    /Den h[aä]r webbplatsen har annonsytor f[oö]rberedda f[oö]r Google AdSense/,
  );
  assert.match(
    indexSource,
    /When reviewed web ad slots are configured, Google AdSense can set cookies/,
  );
  assert.match(appSource, /N[aä]r granskade webbaserade annonsytor [aä]r konfigurerade/);

  const staleAppSource = [
    appSource,
    "'privacy.s5.p': 'This website uses Google AdSense.'",
    "'privacy.s5.p': 'Den här webbplatsen använder Google AdSense.'",
    "'consent.body': 'We use Google AdSense to show a couple of ads.'",
    "'consent.body': 'Vi använder Google AdSense för att visa ett par annonser.'",
  ].join('\n');
  const staleIssues = findStaticAdSenseSlotStateCopyIssues(indexSource, staleAppSource);
  assert.ok(staleIssues.length >= 4);
  assert.match(staleIssues.join('\n'), /reviewed web slot IDs are not configured/);

  const configuredAppSource = staleAppSource
    .replace("inline: '',", "inline: '1234567890',")
    .replace("anchor: '',", "anchor: '9876543210',");
  assert.equal(staticAdSenseSlotsAreConfiguredInSource(configuredAppSource), true);
  assert.deepEqual(findStaticAdSenseSlotStateCopyIssues(indexSource, configuredAppSource), []);
});

test('static site public copy does not label the release as MVP', () => {
  const surface = [read('site/app.js'), read('site/index.html')].join('\n');

  assert.equal(assertNoUnsupportedStaticReleaseCopy(repoRoot), 3);
  assert.equal(findUnsupportedStaticReleaseCopyInSource(surface).length, 0);
  assert.match(surface, /No\. You do not need to register\./);
  assert.match(surface, /Nej\. Du behöver inte registrera dig\./);
  assert.match(surface, /The app requires no account/);
  assert.match(surface, /Appen kräver inget konto/);
  assert.match(surface, /data-i18n="privacy\.meta2\.v">1\.0</);

  const mutated = findUnsupportedStaticReleaseCopyInSource(
    `${surface}\nThe MVP needs zero registration.`,
  );
  assert.equal(mutated.length, 1);
  assert.match(formatUnsupportedStaticReleaseCopy(mutated), /MVP release label/);
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

test('static site Swedish grammar and legal tone stay natural', () => {
  const swedishDictionary = staticSiteSwedishDictionary();
  const staleFragments = [
    ['ingen', 'juridiska'].join(' '),
    ['fika', 'stor'].join('-'),
    ['fika', 'skador'].join('-'),
  ];

  staleFragments.forEach((fragment) => {
    assert.doesNotMatch(swedishDictionary, new RegExp(fragment, 'i'));
  });

  assert.match(swedishDictionary, /inget juridiskt kr[aå]ngel/);
  assert.match(swedishDictionary, /en kort studievana/);
  assert.match(
    swedishDictionary,
    /inte ansvariga f[oö]r missade deadlines, avslagna ans[oö]kningar eller beslut/,
  );
});
