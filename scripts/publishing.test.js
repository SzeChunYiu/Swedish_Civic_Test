const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function staleWords(...words) {
  return new RegExp(words.join('\\s+'), 'i');
}

function staleToken(...parts) {
  return new RegExp(parts.join('_'), 'i');
}

function staleSeparatedWords(...words) {
  return new RegExp(words.join('[\\s_-]+'), 'i');
function staleNativeIdentifierPattern() {
  return new RegExp(['com', 'billyyiu', 'swedishcivictest'].join('\\.'), 'i');
}

function disabledGoogleMobileAdsPattern() {
  return new RegExp(['disabled', 'Google Mobile Ads'].join('\\s+'), 'i');
}

function deferredRealAdsDisabledPattern() {
  return new RegExp(['deferred', 'real', 'ads', 'disabled'].join('[-\\s]+'), 'i');
}

function oldRealAdsDisabledFlagPattern() {
  return new RegExp(['REAL_ADS', 'ENABLED_FOR_V1=false'].join('_'), 'i');
}

function assertNoLegacyAdsPosture(source) {
  [
    oldRealAdsDisabledFlagPattern(),
    deferredRealAdsDisabledPattern(),
    staleWords('real', 'ads', 'disabled'),
    staleWords('real', 'ads', 'remain', 'disabled'),
    staleWords('AdMob', 'is', 'deferred'),
    disabledGoogleMobileAdsPattern(),
  ].forEach((pattern) => assert.doesNotMatch(source, pattern));
}

function assertNoStalePublicPrivacyPosture(source) {
  [
    staleWords('no', 'user', 'data', 'is', 'collected'),
    staleWords('no', 'user', 'data', 'is', 'shared'),
    staleWords('no', 'user', 'data', 'collected'),
    staleWords('no', 'user', 'data', 'shared'),
    staleWords('real', 'ad', 'rendering', 'is', 'disabled'),
    staleWords('real', 'ads', 'disabled'),
    staleWords('Data', 'Not', 'Collected'),
    staleToken('REAL_ADS', 'ENABLED_FOR_V1'),
  ].forEach((pattern) => assert.doesNotMatch(source, pattern));
}

function assertNoStaleReleaseInstructionPosture(source) {
  [
    staleSeparatedWords('real', 'ads', 'disabled'),
    staleSeparatedWords('deferred', 'real', 'ads', 'disabled'),
    staleWords('disabled', 'Google', 'Mobile', 'Ads'),
    new RegExp(`${['REAL_ADS', 'ENABLED_FOR_V1'].join('_')}\\s*=\\s*false`, 'i'),
  ].forEach((pattern) => assert.doesNotMatch(source, pattern));
}

function assertCurrentPublicPrivacyPosture(source, options = {}) {
  const requiresAtt = options.requiresAtt ?? true;

  assert.match(source, /Google Mobile Ads|AdMob/i);
  assert.match(source, /Remove Ads/i);
  assert.match(source, /29 SEK/i);
  if (requiresAtt) {
    assert.match(source, /App Tracking Transparency|ATT/i);
  }
  assert.match(source, /Google UMP consent|UMP consent/i);
  assert.match(source, /local[\s\S]{0,80}device|stored locally on the device/i);
  assertNoStalePublicPrivacyPosture(source);
}

function parseExternalBlockerRows(markdown) {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('| `'))
    .map((line) => {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim());
      assert.equal(cells.length, 4, `unexpected blocker row shape: ${line}`);

      const gateMatch = cells[0].match(/^`([^`]+)`$/);
      assert.ok(gateMatch, `gate cell must be backtick-wrapped: ${cells[0]}`);

      return {
        gate: gateMatch[1],
        requiredEvidence: cells[1],
        whereToRecord: cells[2],
        status: cells[3],
      };
    });
}

test('store publishing metadata is prepared', () => {
  const appConfig = JSON.parse(read('app.json')).expo;
  const iosRemoveAdsProductId = `${appConfig.ios.bundleIdentifier}.removeads`;
  const androidRemoveAdsProductId = 'removeads';
  const staleRemoveAdsProductId = ['com', 'billyyiu', 'swedishcivictest', 'removeads'].join('.');
  assert.equal(appConfig.name, 'Almost Swedish');
  assert.equal(appConfig.slug, 'almost-swedish');
  assert.equal(appConfig.ios.bundleIdentifier, 'com.billyyiu.almostswedish');
  assert.equal(appConfig.android.package, 'com.billyyiu.almostswedish');
  assert.match(
    appStoreIdentitySource,
    new RegExp(escapeRegExp(appConfig.ios.bundleIdentifier), 'i'),
  );
  assert.match(appStoreIdentitySource, /proLifetime:\s*`\$\{APP_NATIVE_IDENTIFIER\}\.prolifetime`/);
  assert.match(proLifetimeSource, /appStoreProductIds\.proLifetime/);
  assert.doesNotMatch(proLifetimeSource, staleNativeIdentifierPattern());
  assert.doesNotMatch(appStoreIdentitySource, staleNativeIdentifierPattern());

  for (const productSetupCopy of [
    read('publishing/admob-iap-setup-runbook.md'),
    read('publishing/operator-todo.md'),
  ]) {
    assert.match(productSetupCopy, /Pro Lifetime/i);
    assert.match(productSetupCopy, new RegExp(escapeRegExp(proLifetimeProductId), 'i'));
    assert.match(productSetupCopy, /59 SEK/i);
  }

  const appStoreListing = read('publishing/app-store-listing.md');
  assert.match(appStoreListing, /Sweden Citizenship Test Prep/);
  assert.match(appStoreListing, /not official/i);
  assert.match(appStoreListing, /UHR/i);

  const googlePlayListing = read('publishing/google-play-listing.md');
  assert.match(googlePlayListing, /Sweden Citizenship Test Prep/);
  assert.match(googlePlayListing, /not official/i);
  assert.match(googlePlayListing, /Data safety/i);
  assertCurrentPublicPrivacyPosture(googlePlayListing, { requiresAtt: false });

  for (const filePath of [
    'publishing/admob-iap-setup-runbook.md',
    'publishing/admob-progress.md',
    'publishing/operator-todo.md',
    'publishing/privacy-labels.md',
  ]) {
    const source = read(filePath);
    assert.match(source, new RegExp(iosRemoveAdsProductId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(
      source,
      new RegExp(staleRemoveAdsProductId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assert.match(source, new RegExp(`\\b${androidRemoveAdsProductId}\\b`));
  }
});

test('release evidence template matches ad-supported app store posture', () => {
  const appConfig = JSON.parse(read('app.json')).expo;
  const template = read('reports/release-evidence-template.md');

  assert.match(template, new RegExp(appConfig.ios.bundleIdentifier, 'i'));
  assert.match(template, new RegExp(appConfig.android.package, 'i'));
  assert.match(template, /AdMob app ID/i);
  assert.match(template, /app-ads\.txt/i);
  assert.match(template, /adMob\.realAdsEnabled:\s*true/i);
  assert.match(template, /adMob\.appAdsTxtReviewed:\s*true/i);
  assert.match(template, /EXPO_PUBLIC_REAL_ADS_ENABLED=true/i);
  assert.match(template, /Remove Ads/i);
  assert.match(template, /29 SEK/i);
  assert.match(template, /non-consumable/i);
  assert.match(template, /generated binary\/build|generated binary/i);
  assert.match(template, /App Tracking Transparency|ATT/i);
  assert.match(template, /Google UMP|UMP consent/i);

  assert.doesNotMatch(template, staleNativeIdentifierPattern());
  assert.doesNotMatch(template, staleToken('REAL_ADS', 'ENABLED_FOR_V1'));
  assert.doesNotMatch(template, staleWords('real', 'ads', 'disabled'));
  assert.doesNotMatch(template, disabledGoogleMobileAdsPattern());
});

test('privacy labels and data safety answers match ad-supported release practices', () => {
  const privacyLabels = read('publishing/privacy-labels.md');
  assert.match(privacyLabels, /Apple App Privacy/i);
  assert.match(privacyLabels, /Yes, data is collected from this app/i);
  assert.match(privacyLabels, /Google Mobile Ads/i);
  assert.match(privacyLabels, /EXPO_PUBLIC_REAL_ADS_ENABLED/i);
  assert.match(privacyLabels, /Remove Ads/i);
  assert.match(privacyLabels, /29 SEK/i);
  assert.match(privacyLabels, /non-consumable/i);
  assert.match(privacyLabels, /App Tracking Transparency|ATT/i);
  assert.match(privacyLabels, /Google UMP consent/i);
  assert.match(privacyLabels, /Device ID/i);
  assert.match(privacyLabels, /Product Interaction/i);
  assert.match(privacyLabels, /Advertising Data/i);
  assert.match(privacyLabels, /Diagnostics/i);
  assert.match(privacyLabels, /Purchases/i);
  assert.match(privacyLabels, /local device/i);
  assert.doesNotMatch(privacyLabels, staleWords('Data', 'Not', 'Collected'));
  assert.doesNotMatch(privacyLabels, staleToken('REAL_ADS', 'ENABLED_FOR_V1'));
  assert.doesNotMatch(privacyLabels, staleWords('real', 'ads', 'disabled'));
  assert.doesNotMatch(privacyLabels, staleWords('test', 'app', 'IDs'));

  const dataSafety = read('publishing/google-play-data-safety.md');
  assert.match(dataSafety, /Yes, data is collected/i);
  assert.match(dataSafety, /Yes, data is shared/i);
  assert.match(dataSafety, /local device/i);
  assert.match(dataSafety, /Google Mobile Ads/i);
  assert.match(dataSafety, /Google UMP consent/i);
  assert.match(dataSafety, /Remove Ads/i);
  assert.match(dataSafety, /29 SEK/i);
  assert.match(dataSafety, /non-consumable/i);
  assert.match(dataSafety, /approximate location/i);
  assert.match(dataSafety, /app interactions/i);
  assert.match(dataSafety, /diagnostics/i);
  assert.match(dataSafety, /Device or other IDs/i);
  assert.match(dataSafety, /purchase history/i);
  assert.match(dataSafety, /Advertising or marketing/i);
  assert.match(dataSafety, /Analytics/i);
  assert.match(dataSafety, /Fraud prevention/i);
  assert.match(dataSafety, /encrypted in transit/i);
  assert.doesNotMatch(dataSafety, staleWords('No', 'user', 'data', 'collected'));
  assert.doesNotMatch(dataSafety, staleWords('No', 'user', 'data', 'shared'));
  assert.doesNotMatch(dataSafety, staleToken('REAL_ADS', 'ENABLED_FOR_V1'));
  assert.doesNotMatch(dataSafety, staleWords('real', 'ads', 'disabled'));
  assert.doesNotMatch(dataSafety, staleWords('test', 'app', 'IDs'));
});

test('public support and privacy URL copy is ready for hosting', () => {
  const publicCopy = read('publishing/public-support-and-privacy.md');
  assert.match(publicCopy, /Support URL/i);
  assert.match(publicCopy, /Privacy Policy URL/i);
  assert.match(publicCopy, /no personal data/i);
  assert.match(publicCopy, /no account/i);
  assert.match(publicCopy, /not affiliated/i);
});

test('hostable public support and privacy pages are prepared', () => {
  const support = read('publishing/public-site/support/index.html');
  const privacy = read('publishing/public-site/privacy/index.html');

  assert.match(support, /Sweden Citizenship Test Prep support/i);
  assert.match(support, /content issue/i);
  assert.match(support, /no personal data/i);
  assert.match(support, /not affiliated/i);
  assert.match(support, /<html lang="en">/i);

  assert.match(privacy, /Sweden Citizenship Test Prep privacy policy/i);
  assert.match(privacy, /no account/i);
  assert.match(privacy, /stored locally on the device/i);
  assert.match(privacy, /no user data is collected/i);
  assert.match(privacy, /<html lang="en">/i);
});

test('post-EAS-auth runbook covers build, device, and store evidence sequence', () => {
  const runbook = read('publishing/post-eas-auth-runbook.md');
  assert.match(runbook, /npx --yes eas-cli@18\.13\.0 whoami/);
  assert.match(runbook, /npm run release:preflight/);
  assert.match(runbook, /npm run release:eas-preview-dispatch/);
  assert.match(runbook, /npm run build:preview/);
  assert.match(runbook, /Android physical-device audio/i);
  assert.match(runbook, /iOS physical-device audio/i);
  assert.match(runbook, /TestFlight/i);
  assert.match(runbook, /Google Play internal/i);
  assert.match(runbook, /reports\/release-evidence-YYYY-MM-DD\.md/);
  assert.match(runbook, /scripts\/update-release-gate\.js/);
  assert.match(runbook, /--gate android-device-audio/);
});

test('active release instructions describe the ad-supported Remove Ads posture', () => {
  const activeReleaseInstructions = [
    read('publishing/post-eas-auth-runbook.md'),
    read('reports/external-release-blockers.md'),
    read('scripts/write-release-owner-action-packet.js'),
  ].join('\n');

  assert.match(activeReleaseInstructions, /AdMob app (record|readiness)/i);
  assert.match(activeReleaseInstructions, /Google Mobile Ads/i);
  assert.match(activeReleaseInstructions, /EXPO_PUBLIC_REAL_ADS_ENABLED=true/i);
  assert.match(activeReleaseInstructions, /Remove Ads/i);
  assert.match(activeReleaseInstructions, /29 SEK/i);
  assert.match(activeReleaseInstructions, /App Tracking Transparency|ATT/i);
  assert.match(activeReleaseInstructions, /Google UMP|UMP consent|ATT\/UMP/i);
  assertNoStaleReleaseInstructionPosture(activeReleaseInstructions);
});

test('external release blocker checklist is tied to SzeChunYiu tracker', () => {
  const checklist = read('reports/external-release-blockers.md');
  assert.match(checklist, /https:\/\/github\.com\/SzeChunYiu\/Swedish_Civic_Test\/issues\/11/);

  for (const gate of [
    'eas-auth',
    'eas-build-artifacts',
    'android-device-audio',
    'ios-device-audio',
    'store-records',
    'store-credentials',
    'store-policy-questionnaires',
    'privacy-review',
    'release-owner-approval',
    'device-screenshots',
    'submission',
  ]) {
    assert.match(checklist, new RegExp(`\\b${gate}\\b`));
  }

  assert.match(checklist, /npx --yes eas-cli@18\.13\.0 whoami/);
  assert.match(checklist, /npm run release:external-blocker-loop/);
  assert.match(checklist, /npm run release:external-loop-dispatch/);
  assert.match(checklist, /External release blocker loop/);
  assert.match(checklist, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(checklist, /actions: write/);
  assert.match(checklist, /npm run release:preflight/);
  assert.match(checklist, /npm run release:github-secrets-check/);
  assert.match(checklist, /injected EXPO_TOKEN environment variable/);
  assert.match(checklist, /npm run release:set-expo-token-secret/);
  assert.match(checklist, /npm run release:expo-token-bootstrap/);
  assert.match(checklist, /macOS Keychain service `EXPO_TOKEN`/);
  assert.match(checklist, /npm run release:eas-preview-dispatch/);
  assert.match(checklist, /npm run release:evidence-index/);
  assert.match(checklist, /update-release-gate/);
});

test('external release blocker checklist stays synchronized with release gates', () => {
  const rows = parseExternalBlockerRows(read('reports/external-release-blockers.md'));
  const releaseGates = JSON.parse(read('reports/release-gates.json')).gates;
  const rowsByGate = new Map(rows.map((row) => [row.gate, row]));
  const blockedReleaseGates = Object.entries(releaseGates)
    .filter(([, gate]) => gate.status === 'BLOCKED')
    .map(([gate]) => gate);

  assert.deepEqual(
    rows.map((row) => row.gate),
    ['eas-auth', ...blockedReleaseGates],
  );
  assert.equal(rowsByGate.has('public-urls'), false);

  for (const gate of blockedReleaseGates) {
    assert.equal(rowsByGate.get(gate)?.status, 'BLOCKED', gate);
  }

  assert.equal(rowsByGate.get('eas-auth')?.status, 'BLOCKED');

  for (const row of rows) {
    if (row.gate !== 'eas-auth') {
      assert.ok(releaseGates[row.gate], `${row.gate} is not in release-gates.json`);
    }
    assert.ok(row.requiredEvidence.length > 0, `${row.gate} missing evidence`);
    assert.ok(row.whereToRecord.length > 0, `${row.gate} missing record location`);
  }
});
