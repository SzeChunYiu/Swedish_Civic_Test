const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
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

  const dataSafety = read('publishing/google-play-data-safety.md');
  assert.match(dataSafety, /No user data collected/i);
  assert.match(dataSafety, /No user data shared/i);
  assert.match(dataSafety, /local device/i);
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
  assert.match(runbook, /npm run build:preview/);
  assert.match(runbook, /Android physical-device audio/i);
  assert.match(runbook, /iOS physical-device audio/i);
  assert.match(runbook, /TestFlight/i);
  assert.match(runbook, /Google Play internal/i);
  assert.match(runbook, /reports\/release-evidence-YYYY-MM-DD\.md/);
});
