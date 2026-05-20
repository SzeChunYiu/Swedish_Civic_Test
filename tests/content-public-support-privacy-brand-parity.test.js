const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadFixtures(overrides = {}) {
  return {
    appJson: JSON.parse(overrides['app.json'] ?? read('app.json')),
    publicCopy:
      overrides['publishing/public-support-and-privacy.md'] ??
      read('publishing/public-support-and-privacy.md'),
    supportHtml:
      overrides['publishing/public-site/support/index.html'] ??
      read('publishing/public-site/support/index.html'),
    privacyHtml:
      overrides['publishing/public-site/privacy/index.html'] ??
      read('publishing/public-site/privacy/index.html'),
  };
}

function extractSingleTag(html, tagName, label) {
  const matches = [
    ...html.matchAll(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi')),
  ];
  assert.equal(matches.length, 1, `${label} must have exactly one <${tagName}>`);
  return matches[0][1].replace(/\s+/g, ' ').trim();
}

function assertPublicSupportPrivacyBrandParity(fixtures = loadFixtures()) {
  const appName = fixtures.appJson.expo?.name;
  assert.equal(typeof appName, 'string', 'app.json expo.name must be readable');
  assert.notEqual(appName.trim(), '', 'app.json expo.name must not be empty');

  const expectedSupportHeading = `${appName} support`;
  const expectedPrivacyHeading = `${appName} privacy policy`;

  assert.equal(
    extractSingleTag(fixtures.supportHtml, 'title', 'public support page'),
    expectedSupportHeading,
    'public support <title> must use the canonical app.json name',
  );
  assert.equal(
    extractSingleTag(fixtures.supportHtml, 'h1', 'public support page'),
    expectedSupportHeading,
    'public support <h1> must use the canonical app.json name',
  );
  assert.equal(
    extractSingleTag(fixtures.privacyHtml, 'title', 'public privacy page'),
    expectedPrivacyHeading,
    'public privacy <title> must use the canonical app.json name',
  );
  assert.equal(
    extractSingleTag(fixtures.privacyHtml, 'h1', 'public privacy page'),
    expectedPrivacyHeading,
    'public privacy <h1> must use the canonical app.json name',
  );

  assert.match(
    fixtures.publicCopy,
    new RegExp(`^# ${escapeRegExp(expectedSupportHeading)}$`, 'm'),
    'publishing support copy heading must use the canonical app.json name',
  );
  assert.match(
    fixtures.publicCopy,
    new RegExp(`^# ${escapeRegExp(expectedPrivacyHeading)}$`, 'm'),
    'publishing privacy copy heading must use the canonical app.json name',
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('public support/privacy pages use the canonical app brand', () => {
  assertPublicSupportPrivacyBrandParity();
});

test('public support/privacy brand parity rejects stale page titles', () => {
  const fixtures = loadFixtures({
    'publishing/public-site/support/index.html': read(
      'publishing/public-site/support/index.html',
    ).replaceAll('Almost Swedish support', 'Swedish Civic Test support'),
  });

  assert.throws(
    () => assertPublicSupportPrivacyBrandParity(fixtures),
    /public support <title> must use the canonical app\.json name/,
  );
});

test('public support/privacy brand parity rejects missing canonical app names', () => {
  const fixtures = loadFixtures({
    'app.json': JSON.stringify({
      expo: {
        name: 'New Civic Study App',
      },
    }),
  });

  assert.throws(
    () => assertPublicSupportPrivacyBrandParity(fixtures),
    /public support <title> must use the canonical app\.json name/,
  );
});

test('publishing support/privacy copy keeps the same canonical page headings', () => {
  const fixtures = loadFixtures({
    'publishing/public-support-and-privacy.md': read(
      'publishing/public-support-and-privacy.md',
    ).replace('# Almost Swedish privacy policy', '# Privacy policy'),
  });

  assert.throws(
    () => assertPublicSupportPrivacyBrandParity(fixtures),
    /publishing privacy copy heading must use the canonical app\.json name/,
  );
});
