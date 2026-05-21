const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');
const {
  checkAssetManifest,
  listIndexAssetReferences,
  writeAssetManifest,
} = require('./update-site-asset-manifest');

function readSiteIndex() {
  return fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
}

test('static site index references only shipped local assets', () => {
  const missingAssets = listIndexAssetReferences(siteRoot).filter(
    (assetPath) => !fs.existsSync(path.join(siteRoot, assetPath)),
  );

  assert.deepEqual(missingAssets, []);
});

test('committed static site asset manifest matches shipped assets', () => {
  const result = checkAssetManifest();

  assert.equal(result.ok, true, result.mismatches.join('\n'));
});

test('committed static site asset manifest includes every local index reference', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(siteRoot, 'asset-manifest.json'), 'utf8'));
  const missingReferences = listIndexAssetReferences(siteRoot).filter(
    (assetPath) => !manifest.assets?.[assetPath],
  );

  assert.deepEqual(missingReferences, []);
});

test('asset manifest check rejects referenced assets omitted by manifest scope', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-asset-reference-'));
  const tempSiteDir = path.join(tempDir, 'site');
  const tempManifestPath = path.join(tempSiteDir, 'asset-manifest.json');
  const omittedReferencedAssets = new Set(['app.js', 'hero@2x.png', 'preload-large.png']);
  const omitReferencedAssets = (assetPath) => !omittedReferencedAssets.has(assetPath);

  try {
    fs.mkdirSync(tempSiteDir, { recursive: true });
    fs.writeFileSync(
      path.join(tempSiteDir, 'index.html'),
      [
        '<!doctype html>',
        '<link rel="stylesheet" href="styles.css">',
        '<link rel="preload" as="image" imagesrcset="preload-small.png 1x, preload-large.png 2x">',
        '<script src="app.js"></script>',
        "<script src='extras.js'></script>",
        '<img src="fallback.png" srcset="hero.png 1x, ./hero@2x.png 2x, https://cdn.example.test/hero.png 3x, data:image/png;base64,AAAA 4x" alt="">',
        '<video poster="intro-poster.png"></video>',
        '<a href="#/practice">Practice</a>',
        '<a href="mailto:support@example.test">Support</a>',
        '<a href="tel:+460000000">Call</a>',
      ].join(''),
    );
    for (const assetPath of [
      'app.js',
      'extras.js',
      'fallback.png',
      'hero.png',
      'hero@2x.png',
      'intro-poster.png',
      'preload-large.png',
      'preload-small.png',
      'styles.css',
    ]) {
      fs.writeFileSync(path.join(tempSiteDir, assetPath), `${assetPath}\n`);
    }

    assert.deepEqual(listIndexAssetReferences(tempSiteDir), [
      'app.js',
      'extras.js',
      'fallback.png',
      'hero.png',
      'hero@2x.png',
      'intro-poster.png',
      'preload-large.png',
      'preload-small.png',
      'styles.css',
    ]);

    writeAssetManifest({
      includeAsset: omitReferencedAssets,
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    const result = checkAssetManifest({
      includeAsset: omitReferencedAssets,
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    assert.equal(result.ok, false);
    assert.match(
      result.mismatches.join('\n'),
      /app\.js: referenced by index\.html but missing from committed manifest/,
    );
    assert.match(
      result.mismatches.join('\n'),
      /hero@2x\.png: referenced by index\.html but missing from committed manifest/,
    );
    assert.match(
      result.mismatches.join('\n'),
      /preload-large\.png: referenced by index\.html but missing from committed manifest/,
    );
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

test('static site index does not depend on runtime CDN transpilation', () => {
  const indexHtml = readSiteIndex();

  assert.doesNotMatch(indexHtml, /https:\/\/unpkg\.com\//);
  assert.doesNotMatch(indexHtml, /@babel\/standalone/);
  assert.doesNotMatch(indexHtml, /type="text\/babel"/);
  assert.doesNotMatch(indexHtml, /\btweaks(?:-panel)?\.jsx\b/);
});
