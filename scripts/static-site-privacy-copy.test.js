const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  assertNoUnsupportedStaticReleaseCopy,
  findUnsupportedStaticReleaseCopyInSource,
  formatUnsupportedStaticReleaseCopy,
} = require('./static-site-release-copy-guard');

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
const internalMonetizationCopyPatterns = [
  /\badsDisabled(?:\s*=\s*(?:true|false))?\b/i,
  /\bmonetization\.removeAds\.adsDisabled\.v\d+\b/i,
  /\bremove[_-]ads[_-]entitlement\b/i,
  /\bpurchase_fields_rejected\b/i,
  /\b(?:unlimitedMockExams|fullMistakeReview|predictedPassProbability|multiColorHighlights)\b/i,
  /\bentitlement flag\b/i,
];
const adSensePreparedDisabledCopyPatterns = [
  /AdSense-ready ad slots, but they stay disabled until reviewed slot IDs are configured/i,
  /prepared for <b>Google AdSense<\/b>, but the static build does not load AdSense until reviewed web slot IDs are configured/i,
  /When reviewed web ad slots are configured, Google AdSense can set cookies/i,
  /annonsytor förberedda för Google AdSense, men de är avstängda tills granskade annonsplats-ID:n är konfigurerade/i,
  /förberedd för <b>Google AdSense<\/b>, men den statiska versionen laddar inte AdSense förrän granskade annonsplats-ID:n är konfigurerade/i,
  /När granskade webbaserade annonsytor är konfigurerade kan Google AdSense sätta cookies/i,
];
const adSenseCurrentUseCopyPatterns = [
  /This website\s+uses\s+(?:<[^>]+>\s*)?Google AdSense/i,
  /We use\s+(?:<[^>]+>\s*)?Google AdSense to show/i,
  /Google AdSense on the website and Google Mobile Ads/i,
  /Google AdSense web ads/i,
  /Den h[aä]r webbplatsen anv[aä]nder\s+(?:<[^>]+>\s*)?Google AdSense/i,
  /Vi anv[aä]nder\s+(?:<[^>]+>\s*)?Google AdSense f[oö]r att visa/i,
  /Google AdSense p[aå] webbplatsen och Google Mobile Ads/i,
  /Google AdSense-annonser p[aå] webben/i,
];

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function assertNoInternalMonetizationCopy(surface) {
  internalMonetizationCopyPatterns.forEach((pattern) => assert.doesNotMatch(surface, pattern));
}

function readStaticAdSenseStringProperty(source, propertyName) {
  const pattern = new RegExp(`\\b${propertyName}\\s*:\\s*(['"])([\\s\\S]*?)\\1`);
  const match = String(source || '').match(pattern);
  return match ? match[2] : '';
}

function readStaticAdSenseSlotConfig(appSource) {
  const source = String(appSource || '');
  const slotsBlock = source.match(/\bslots\s*:\s*{([\s\S]*?)}/);
  return {
    anchor: slotsBlock ? readStaticAdSenseStringProperty(slotsBlock[1], 'anchor') : '',
    inline: slotsBlock ? readStaticAdSenseStringProperty(slotsBlock[1], 'inline') : '',
    publisherId: readStaticAdSenseStringProperty(source, 'publisherId'),
  };
}

function staticAdSenseSlotsAreConfiguredInSource(appSource) {
  const config = readStaticAdSenseSlotConfig(appSource);
  const isRealSlotId = (slotId) =>
    typeof slotId === 'string' && /^[0-9]{10,}$/.test(slotId) && !/^0+$/.test(slotId);
  return (
    /^ca-pub-[0-9]{16}$/.test(config.publisherId || '') &&
    isRealSlotId(config.inline) &&
    isRealSlotId(config.anchor)
  );
}

function findCurrentUseAdSenseSlotStateCopyIssues(surface, appSource) {
  if (staticAdSenseSlotsAreConfiguredInSource(appSource)) return [];

  return adSenseCurrentUseCopyPatterns
    .filter((pattern) => pattern.test(surface))
    .map(
      (pattern) =>
        `current-use AdSense copy requires reviewed inline and anchor slot IDs: ${pattern.source}`,
    );
}

function configureStaticAdSenseSlots(appSource) {
  return appSource
    .replace(/publisherId:\s*'[^']*'/, "publisherId: 'ca-pub-2451892671779738'")
    .replace(/inline:\s*'[^']*'/, "inline: '1234567890'")
    .replace(/anchor:\s*'[^']*'/, "anchor: '1234567891'");
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

test('static site privacy and consent copy describe unconfigured AdSense slots', () => {
  const appSource = read('site/app.js');
  const surface = [appSource, read('site/index.html')].join('\n');

  assert.equal(staticAdSenseSlotsAreConfiguredInSource(appSource), false);
  adSensePreparedDisabledCopyPatterns.forEach((pattern) => assert.match(surface, pattern));
  assert.deepEqual(findCurrentUseAdSenseSlotStateCopyIssues(surface, appSource), []);
});

test('static site current-use AdSense copy is gated by reviewed slot IDs', () => {
  const appSource = read('site/app.js');
  const staleCurrentUseCopy = [
    "'privacy.s5.p': 'This website uses Google AdSense.';",
    "'consent.body': 'We use Google AdSense to show ads.';",
    "'privacy.s5.p': 'Den här webbplatsen använder Google AdSense.';",
    "'consent.body': 'Vi använder Google AdSense för att visa annonser.';",
  ].join('\n');
  const staleSurface = `${appSource}\n${read('site/index.html')}\n${staleCurrentUseCopy}`;

  const unconfiguredIssues = findCurrentUseAdSenseSlotStateCopyIssues(staleSurface, appSource);
  assert.equal(staticAdSenseSlotsAreConfiguredInSource(appSource), false);
  assert.equal(unconfiguredIssues.length, 4);

  const oneSlotOnlyApp = configureStaticAdSenseSlots(appSource).replace(
    /anchor:\s*'1234567891'/,
    "anchor: ''",
  );
  assert.equal(staticAdSenseSlotsAreConfiguredInSource(oneSlotOnlyApp), false);
  assert.equal(findCurrentUseAdSenseSlotStateCopyIssues(staleSurface, oneSlotOnlyApp).length, 4);

  const configuredApp = configureStaticAdSenseSlots(appSource);
  assert.equal(staticAdSenseSlotsAreConfiguredInSource(configuredApp), true);
  assert.deepEqual(findCurrentUseAdSenseSlotStateCopyIssues(staleSurface, configuredApp), []);
});

test('static site privacy and consent copy hides internal monetization implementation keys', () => {
  const surface = [read('site/app.js'), read('site/index.html')].join('\n');

  assertNoInternalMonetizationCopy(surface);

  const mutated = `${surface}\nRemove Ads sets adsDisabled=true through the entitlement flag.`;
  assert.match(mutated, internalMonetizationCopyPatterns[0]);
  assert.match(mutated, internalMonetizationCopyPatterns[5]);

  const mutatedConsent = `${surface}\nCookie consent stores remove_ads_entitlement state.`;
  assert.match(mutatedConsent, internalMonetizationCopyPatterns[2]);
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
