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
  findCurrentUseAdSenseSlotStateCopyIssues,
  staticAdSenseCanLoadInSource,
  staticAdSenseSlotsAreConfiguredInSource,
} = require('./static-adsense-slot-state');

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
  /website uses Google AdSense auto ads after your cookie choice/i,
  /Manual in-content panels in Practice and Ebook stay as reserved spaces until reviewed slot IDs are configured/i,
  /Google AdSense can set cookies after you choose/i,
  /webbplatsen använder automatiska Google AdSense-annonser efter ditt cookieval/i,
  /Manuella annonsytor i övning och e-bok visas som reserverade ytor tills granskade annonsplats-ID:n är konfigurerade/i,
  /Google AdSense kan sätta cookies efter ditt val/i,
];

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

function assertNoInternalMonetizationCopy(surface) {
  internalMonetizationCopyPatterns.forEach((pattern) => assert.doesNotMatch(surface, pattern));
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
  assert.match(surface, /Core study works without sign-in\./);
  assert.match(surface, /K[aä]rn[oö]vningen fungerar utan inloggning/);
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

test('static site privacy and consent copy describe auto ads and manual slot state', () => {
  const appSource = read('site/app.js');
  const surface = [appSource, read('site/index.html')].join('\n');

  assert.equal(staticAdSenseCanLoadInSource(appSource), true);
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
  assert.equal(staticAdSenseCanLoadInSource(appSource), true);
  assert.equal(unconfiguredIssues.length, 0);

  const autoAdsDisabledApp = appSource.replace(/\bautoAds:\s*true/, 'autoAds: false');
  assert.equal(staticAdSenseCanLoadInSource(autoAdsDisabledApp), false);
  assert.ok(findCurrentUseAdSenseSlotStateCopyIssues(staleSurface, autoAdsDisabledApp).length >= 4);

  const oneSlotOnlyApp = configureStaticAdSenseSlots(autoAdsDisabledApp).replace(
    /anchor:\s*'1234567891'/,
    "anchor: ''",
  );
  assert.equal(staticAdSenseSlotsAreConfiguredInSource(oneSlotOnlyApp), false);
  assert.ok(findCurrentUseAdSenseSlotStateCopyIssues(staleSurface, oneSlotOnlyApp).length >= 4);

  const configuredApp = configureStaticAdSenseSlots(autoAdsDisabledApp);
  assert.equal(staticAdSenseSlotsAreConfiguredInSource(configuredApp), true);
  assert.deepEqual(findCurrentUseAdSenseSlotStateCopyIssues(staleSurface, configuredApp), []);
});

test('static privacy browser spec covers unconfigured AdSense slot-state copy', () => {
  const browserSpec = read('tests/e2e/static-site-network-privacy.spec.ts');

  assert.match(
    browserSpec,
    /privacy and consent copy describe AdSense auto ads in both languages/,
    'static privacy browser spec should cover rendered privacy and consent AdSense copy',
  );
  assert.match(
    browserSpec,
    /function expectAdSenseWaitsForConsent\(page: Page\)[\s\S]*data-smt-ad-placement/,
    'static privacy browser spec should inspect rendered ad slot attributes before consent',
  );
  assert.match(
    browserSpec,
    /await expectAutoAdSenseCopy\(page, 'en'\);[\s\S]*await setStaticSiteLanguage\(page, 'sv'\);[\s\S]*await expectAutoAdSenseCopy\(page, 'sv'\);/,
    'static privacy browser spec should prove AdSense auto ads copy in English and Swedish',
  );
});

test('static AdSense slot-state checks use the shared helper', () => {
  const ownSource = read('scripts/static-site-privacy-copy.test.js');
  const liveSiteSource = read('scripts/check-live-site.js');
  const forbiddenParserName = ['readStatic', 'AdSenseStringProperty'].join('');
  const forbiddenPatternListName = ['adSense', 'CurrentUseCopyPatterns'].join('');

  assert.match(
    ownSource,
    /require\('\.\/static-adsense-slot-state'\)/,
    'static privacy copy test should import the shared AdSense slot-state helper',
  );
  assert.match(
    liveSiteSource,
    /require\('\.\/static-adsense-slot-state'\)/,
    'live-site check should import the shared AdSense slot-state helper',
  );

  for (const source of [ownSource, liveSiteSource]) {
    assert.doesNotMatch(source, new RegExp(`function\\s+${forbiddenParserName}\\b`));
    assert.doesNotMatch(source, new RegExp(`const\\s+${forbiddenPatternListName}\\b`));
  }
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
  [
    /No account required/i,
    /The app requires no account/i,
    /without registering/i,
    /no account, email address, phone number, or profile registration/i,
    /Inget konto krävs/i,
    /Appen kräver inget konto/i,
    /utan att registrera dig/i,
  ].forEach((pattern) => assert.doesNotMatch(surface, pattern));
  assert.match(surface, /Core study works without sign-in/);
  assert.match(surface, /K[aä]rn[oö]vningen fungerar utan inloggning/);
  assert.match(surface, /Account optional/);
  assert.match(surface, /Konto [aä]r valfritt/);
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
