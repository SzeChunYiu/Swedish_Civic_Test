const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const publicUrls = require('../config/publicUrls.json');

const supportUrl = publicUrls.support;
const privacyUrl = publicUrls.privacy;
const appAdsTxtUrl = publicUrls.appAdsTxt;
const appRepo = 'SzeChunYiu/Swedish_Civic_Test';
const publicSiteRepo = 'SzeChunYiu/Swedish_Civic_Test-public-site';
const currentNativeIdentifier = 'com.billyyiu.almostswedish';
const historicalReleaseIdentityAllowlist = new Set([
  'reports/release-evidence-2026-05-15.md',
  'reports/site-audit-2026-05-18.md',
]);

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function trackedFiles() {
  const result = spawnSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('node_modules/') && !file.startsWith('dist-web/'));
}

function textReleaseArtifactFiles() {
  return trackedFiles().filter((file) => {
    if (!/^(publishing|reports|scripts)\//.test(file)) return false;
    if (file.endsWith('.png')) return false;
    if (/\.test\.js$/.test(file)) return false;
    return true;
  });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function currentPublicUrlRuntimeFiles() {
  return trackedFiles().filter((file) => /^(app|components|lib|scripts|tests)\//.test(file));
}

function assertCurrentPublicUrlsOrSharedConfig(file) {
  const source = read(file);
  if (/^(app|components|lib|scripts|tests)\//.test(file)) {
    assert.match(source, /publicUrls|configuredPublicUrls/);
    assert.match(source, /config\/publicUrls\.json|\.\.\/config\/publicUrls\.json/);
    return;
  }

  assert.match(source, new RegExp(escapeRegExp(supportUrl)));
  assert.match(source, new RegExp(escapeRegExp(privacyUrl)));
}

test('release ownership target is SzeChunYiu and blocks legacy-owner drift', () => {
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(
    packageJson.scripts['test:ownership'],
    'node --test scripts/release-ownership.test.js',
  );
  assert.match(packageJson.scripts['test:all'], /test:ownership/);

  const requiredFiles = [
    'scripts/release-preflight.js',
    'reports/release-gates.json',
    'publishing/app-store-listing.md',
    'publishing/google-play-listing.md',
    'publishing/public-support-and-privacy.md',
    'reports/2026-05-15-public-urls-hosted.md',
  ];

  for (const file of requiredFiles) {
    assertCurrentPublicUrlsOrSharedConfig(file);
  }

  const ownershipDocs = [
    'reports/2026-05-15-github-remote.md',
    'docs/parallel-sessions/VERSION_BOARD.md',
    'reports/2026-05-15-public-urls-hosted.md',
  ]
    .map(read)
    .join('\n');
  assert.match(ownershipDocs, new RegExp(appRepo.replace('/', '\\/')));
  assert.match(ownershipDocs, new RegExp(publicSiteRepo.replace('/', '\\/')));

  const staleReferences = [];
  for (const file of trackedFiles()) {
    const absolute = path.join(repoRoot, file);
    let content;
    try {
      content = fs.readFileSync(absolute, 'utf8');
    } catch (error) {
      continue;
    }
    const legacyOwnerPattern = new RegExp(['bab', 'bloo'].join('') + '|bab' + 'bloo-studio', 'i');
    if (legacyOwnerPattern.test(content)) staleReferences.push(file);
  }
  assert.deepEqual(staleReferences, []);
});

test('current release identity surfaces reject stale native ids and public host URLs', () => {
  const appConfig = JSON.parse(read('app.json')).expo;
  assert.equal(appConfig.ios.bundleIdentifier, currentNativeIdentifier);
  assert.equal(appConfig.android.package, currentNativeIdentifier);

  const currentIdentityFiles = [
    'scripts/release-preflight.js',
    'publishing/build-and-submit-runbook.md',
    'publishing/release-readiness.md',
    'publishing/post-eas-auth-runbook.md',
    'reports/release-evidence-template.md',
    'reports/store-records/store-records.json',
  ];

  for (const file of currentIdentityFiles) {
    const source = read(file);
    assert.match(
      source,
      new RegExp(currentNativeIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
    assertCurrentPublicUrlsOrSharedConfig(file);
  }

  const evidenceStubSource = read('scripts/create-release-evidence-stub.js');
  assert.match(evidenceStubSource, /appConfig\.ios\.bundleIdentifier/);
  assert.match(evidenceStubSource, /appConfig\.android\.package/);
  assert.match(evidenceStubSource, /publicUrls\.support/);
  assert.match(evidenceStubSource, /publicUrls\.privacy/);
  assert.match(evidenceStubSource, /publicUrls\.appAdsTxt/);

  const staleNativeIdPattern = new RegExp(['com', 'billyyiu', 'swedishcivictest'].join('\\.'), 'i');
  const legacyPublicHostPattern =
    /https?:\/\/(?:dist-[^\s/]+|[^\s/]*billy10384[^\s/]*)\.vercel\.app[^\s),;]*/i;
  const staleHits = [];

  for (const file of textReleaseArtifactFiles()) {
    const source = read(file);
    const matches = [
      staleNativeIdPattern.test(source) ? 'stale native id' : '',
      legacyPublicHostPattern.test(source) ? 'legacy Vercel public host' : '',
    ].filter(Boolean);

    if (matches.length > 0 && !historicalReleaseIdentityAllowlist.has(file)) {
      staleHits.push(`${file}: ${matches.join(', ')}`);
    }
  }

  assert.deepEqual(staleHits, []);
});

test('public support, privacy, and app-ads URLs come from shared config in runtime and tests', () => {
  assert.equal(new URL(supportUrl).hostname, 'szechunyiu.github.io');
  assert.equal(new URL(supportUrl).pathname, '/Swedish_Civic_Test-public-site/support/');
  assert.equal(new URL(privacyUrl).pathname, '/Swedish_Civic_Test-public-site/privacy/');
  assert.equal(new URL(appAdsTxtUrl).pathname, '/Swedish_Civic_Test-public-site/app-ads.txt');

  const configSource = read('config/publicUrls.json');
  assert.match(configSource, /"support"/);
  assert.match(configSource, /"privacy"/);
  assert.match(configSource, /"appAdsTxt"/);

  const sharedWrapper = read('lib/scaffold/publicUrls.ts');
  assert.match(sharedWrapper, /\.\.\/\.\.\/config\/publicUrls\.json/);
  assert.doesNotMatch(sharedWrapper, /Swedish_Civic_Test-public-site/);

  const publicUrlPattern = new RegExp(
    [supportUrl, privacyUrl, appAdsTxtUrl].map(escapeRegExp).join('|'),
  );
  const hardCodedHits = currentPublicUrlRuntimeFiles().filter((file) =>
    publicUrlPattern.test(read(file)),
  );

  assert.deepEqual(hardCodedHits, []);
});
