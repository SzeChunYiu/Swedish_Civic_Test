const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const supportUrl = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/support/';
const privacyUrl = 'https://szechunyiu.github.io/Swedish_Civic_Test-public-site/privacy/';
const appRepo = 'SzeChunYiu/Swedish_Civic_Test';
const publicSiteRepo = 'SzeChunYiu/Swedish_Civic_Test-public-site';

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

test('release ownership target is SzeChunYiu and blocks legacy-owner drift', () => {
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(
    packageJson.scripts['test:ownership'],
    'node --test scripts/release-ownership.test.js',
  );
  assert.match(packageJson.scripts.test, /test:ownership/);

  const requiredFiles = [
    'scripts/release-preflight.js',
    'reports/release-gates.json',
    'publishing/app-store-listing.md',
    'publishing/google-play-listing.md',
    'publishing/public-support-and-privacy.md',
    'reports/2026-05-15-public-urls-hosted.md',
  ];

  for (const file of requiredFiles) {
    const content = read(file);
    assert.match(content, new RegExp(supportUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(content, new RegExp(privacyUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
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
