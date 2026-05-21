const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');
const {
  checkAssetManifest,
  extractLocalAssetReferences,
  findAssetReferencesMissingFromManifest,
} = require('./update-site-asset-manifest');

function readSiteIndex() {
  return fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
}

function readSiteManifest() {
  return JSON.parse(fs.readFileSync(path.join(siteRoot, 'asset-manifest.json'), 'utf8'));
}

function localAssetReferences(indexHtml) {
  return extractLocalAssetReferences(indexHtml);
}

test('static site index references only shipped local assets', () => {
  const indexHtml = readSiteIndex();
  const missingAssets = localAssetReferences(indexHtml).filter(
    (assetPath) => !fs.existsSync(path.join(siteRoot, assetPath)),
  );

  assert.deepEqual(missingAssets, []);
  assert.deepEqual(findAssetReferencesMissingFromManifest(indexHtml, readSiteManifest()), []);
  assert.doesNotMatch(indexHtml, /signin\.js/);
});

test('static site asset extractor covers responsive images and media posters', () => {
  const indexHtml = `
    <img src="hero.png?cache=1" srcset="hero.png 1x, ./hero@2x.png 2x, /img/hero-wide.png 1280w" />
    <link rel="preload" as="image" imagesrcset="preload.png 1x, preload@2x.png 2x" />
    <video poster="intro.png#t=0"></video>
    <img srcset="https://cdn.example.com/remote.png 1x, data:image/png;base64,abc123 2x, #sprite 3x" />
    <source srcset="//cdn.example.com/remote.webp 1x, mailto:support@example.com 2x, tel:+460000000 3x" />
  `;

  assert.deepEqual(localAssetReferences(indexHtml), [
    'hero.png',
    'hero@2x.png',
    'img/hero-wide.png',
    'preload.png',
    'preload@2x.png',
    'intro.png',
  ]);
});

test('static site asset extractor covers quote variants and mixed-case asset attributes', () => {
  const indexHtml = `
    <IMG SRC='hero-single.png?cache=1'>
    <link HREF=styles/site.css>
    <video POSTER=media/intro-poster.png#t=0></video>
    <source SRCSET='hero-small.png 1x, ./hero@2x.png 2x, /img/hero-wide.png 1280w'>
    <link rel="preload" as="image" ImageSrcSet=preload-unquoted.png>
    <img SrcSet='https://cdn.example.com/remote.png 1x, data:image/png;base64,abc123 2x, #sprite 3x'>
  `;

  assert.deepEqual(localAssetReferences(indexHtml), [
    'hero-single.png',
    'styles/site.css',
    'media/intro-poster.png',
    'hero-small.png',
    'hero@2x.png',
    'img/hero-wide.png',
    'preload-unquoted.png',
  ]);
});

test('static site asset extractor fails responsive and poster references when files are not shipped', () => {
  const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'static-assets-'));
  const indexHtml = `
    <img srcset="hero.png 1x, hero@2x.png 2x" />
    <link rel="preload" as="image" imagesrcset="preload.png 1x, preload@2x.png 2x" />
    <video poster="intro.png"></video>
  `;
  fs.writeFileSync(path.join(tmpDir, 'index.html'), indexHtml);
  fs.writeFileSync(path.join(tmpDir, 'hero.png'), '');

  const missingAssets = localAssetReferences(indexHtml).filter(
    (assetPath) => !fs.existsSync(path.join(tmpDir, assetPath)),
  );

  assert.deepEqual(missingAssets, ['hero@2x.png', 'preload.png', 'preload@2x.png', 'intro.png']);
});

test('static site asset manifest check covers quote variants and mixed-case attributes', () => {
  const indexHtml = `
    <IMG SRC='hero-single.png'>
    <link HREF=styles/site.css>
    <video POSTER=media/intro-poster.png></video>
    <source SRCSET='hero-small.png 1x, ./hero@2x.png 2x'>
    <link rel="preload" as="image" ImageSrcSet=preload-unquoted.png>
  `;
  const manifest = {
    version: 1,
    algorithm: 'sha256',
    assets: {
      'hero-single.png': { bytes: 0, sha256: 'stub' },
      'styles/site.css': { bytes: 0, sha256: 'stub' },
      'index.html': { bytes: indexHtml.length, sha256: 'stub' },
    },
  };

  assert.deepEqual(findAssetReferencesMissingFromManifest(indexHtml, manifest), [
    'media/intro-poster.png',
    'hero-small.png',
    'hero@2x.png',
    'preload-unquoted.png',
  ]);
});

test('static site asset extractor fails responsive and poster references omitted from the manifest', () => {
  const indexHtml = `
    <img src="hero.png" srcset="hero.png 1x, hero@2x.png 2x" />
    <link rel="preload" as="image" imagesrcset="preload.png 1x, preload@2x.png 2x" />
    <video poster="intro.png"></video>
  `;
  const manifest = {
    version: 1,
    algorithm: 'sha256',
    assets: {
      'hero.png': { bytes: 0, sha256: 'stub' },
      'index.html': { bytes: indexHtml.length, sha256: 'stub' },
    },
  };

  assert.deepEqual(findAssetReferencesMissingFromManifest(indexHtml, manifest), [
    'hero@2x.png',
    'preload.png',
    'preload@2x.png',
    'intro.png',
  ]);
});

test('committed static site asset manifest matches shipped assets', () => {
  const result = checkAssetManifest();

  assert.equal(result.ok, true, result.mismatches.join('\n'));
});

test('static site index does not depend on runtime CDN transpilation', () => {
  const indexHtml = readSiteIndex();

  assert.doesNotMatch(indexHtml, /https:\/\/unpkg\.com\//);
  assert.doesNotMatch(indexHtml, /@babel\/standalone/);
  assert.doesNotMatch(indexHtml, /type="text\/babel"/);
  assert.doesNotMatch(indexHtml, /\btweaks(?:-panel)?\.jsx\b/);
});
