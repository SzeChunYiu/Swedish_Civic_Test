const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
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
  assert.equal(appConfig.name, 'Sweden Citizenship Test Prep');
  assert.equal(appConfig.slug, 'swedish-civic-test');
  assert.equal(appConfig.ios.bundleIdentifier, 'com.billyyiu.swedishcivictest');
  assert.equal(appConfig.android.package, 'com.billyyiu.swedishcivictest');

  const appStoreListing = read('publishing/app-store-listing.md');
  assert.match(appStoreListing, /Sweden Citizenship Test Prep/);
  assert.match(appStoreListing, /not official/i);
  assert.match(appStoreListing, /UHR/i);

  const googlePlayListing = read('publishing/google-play-listing.md');
  assert.match(googlePlayListing, /Sweden Citizenship Test Prep/);
  assert.match(googlePlayListing, /not official/i);
  assert.match(googlePlayListing, /Data safety/i);
});

test('privacy labels and data safety answers match current MVP data practices', () => {
  const privacyLabels = read('publishing/privacy-labels.md');
  assert.match(privacyLabels, /Apple App Privacy/i);
  assert.match(privacyLabels, /Data Not Collected/i);
  assert.match(privacyLabels, /local/i);
  assert.match(privacyLabels, /react-native-google-mobile-ads/i);
  assert.match(privacyLabels, /REAL_ADS_ENABLED_FOR_V1.*false/i);
  assert.match(privacyLabels, /test app IDs/i);

  const dataSafety = read('publishing/google-play-data-safety.md');
  assert.match(dataSafety, /No user data collected/i);
  assert.match(dataSafety, /No user data shared/i);
  assert.match(dataSafety, /local device/i);
  assert.match(dataSafety, /Google Mobile Ads SDK/i);
  assert.match(dataSafety, /real ads disabled/i);
  assert.match(dataSafety, /test app IDs/i);
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
  assert.match(checklist, /External release blocker loop/);
  assert.match(checklist, /npm run release:preflight/);
  assert.match(checklist, /npm run release:github-secrets-check/);
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
