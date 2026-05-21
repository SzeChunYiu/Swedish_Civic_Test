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

function localAssetReferences(indexHtml, options) {
  return extractLocalAssetReferences(indexHtml, options);
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

test('static site asset extractor covers inline and stylesheet CSS urls', () => {
  const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'static-css-assets-'));
  fs.mkdirSync(path.join(tmpDir, 'css'), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, 'css', 'site.css'),
    [
      '.hero { background-image: url("../img/hero.webp?v=1#hero"); }',
      '.icon { mask-image: url("/icons/mask.svg#mask"); }',
      '.ignored-fragment { filter: url(#drop-shadow); }',
      '.ignored-data { background-image: url("data:image/svg+xml,%3Csvg%3E%3C/svg%3E"); }',
      '.ignored-external { cursor: url(https://cdn.example.com/cursor.cur), auto; }',
      '.ignored-variable { background-image: url(var(--site-pattern)); }',
    ].join('\n'),
  );

  const indexHtml = `
    <link rel="stylesheet" href="./css/site.css?version=1" />
    <div style="background-image: url('hero-inline.png#top'); mask-image: url(/icons/inline-mask.svg); filter: url(#inline-filter); background: linear-gradient(red, blue);"></div>
  `;

  assert.deepEqual(localAssetReferences(indexHtml, { siteDir: tmpDir }), [
    'css/site.css',
    'hero-inline.png',
    'icons/inline-mask.svg',
    'img/hero.webp',
    'icons/mask.svg',
  ]);
});

test('static site asset extractor follows local stylesheet imports', () => {
  const tmpDir = fs.mkdtempSync(
    path.join(require('node:os').tmpdir(), 'static-css-import-assets-'),
  );
  fs.mkdirSync(path.join(tmpDir, 'css', 'fonts'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'css', 'img'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'css', 'nested'), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, 'css', 'site.css'),
    [
      '@import "theme.css";',
      '@import url("./nested/panel.css") screen and (min-width: 1px);',
      '@import url("https://cdn.example.com/remote.css");',
      '@import url("data:text/css,body%7Bcolor:red%7D");',
      '.hero { background-image: url("../img/hero.webp?v=1#hero"); }',
    ].join('\n'),
  );
  fs.writeFileSync(
    path.join(tmpDir, 'css', 'theme.css'),
    [
      '@import url("./site.css");',
      '@import url(var(--ignored-theme-import));',
      '.font { src: url("./fonts/display.woff2#font"); }',
    ].join('\n'),
  );
  fs.writeFileSync(
    path.join(tmpDir, 'css', 'nested', 'panel.css'),
    '.panel { background-image: url("../img/panel.svg"); }',
  );

  const indexHtml = '<link rel="stylesheet" href="./css/site.css" />';

  assert.deepEqual(localAssetReferences(indexHtml, { siteDir: tmpDir }), [
    'css/site.css',
    'css/theme.css',
    'css/fonts/display.woff2',
    'css/nested/panel.css',
    'css/img/panel.svg',
    'img/hero.webp',
  ]);
});

test('static site asset extractor fails imported CSS references omitted from the manifest', () => {
  const tmpDir = fs.mkdtempSync(
    path.join(require('node:os').tmpdir(), 'static-css-import-manifest-'),
  );
  fs.mkdirSync(path.join(tmpDir, 'css'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'css', 'site.css'), '@import "theme.css";');
  fs.writeFileSync(
    path.join(tmpDir, 'css', 'theme.css'),
    '.theme { background: url("./theme-bg.png"); }',
  );
  const indexHtml = '<link rel="stylesheet" href="css/site.css" />';
  const manifest = {
    version: 1,
    algorithm: 'sha256',
    assets: {
      'index.html': { bytes: indexHtml.length, sha256: 'stub' },
      'css/site.css': { bytes: 0, sha256: 'stub' },
    },
  };

  assert.deepEqual(
    findAssetReferencesMissingFromManifest(indexHtml, manifest, { siteDir: tmpDir }),
    ['css/theme.css', 'css/theme-bg.png'],
  );
});

test('static site asset extractor rejects excessive stylesheet import depth', () => {
  const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'static-css-import-depth-'));
  fs.mkdirSync(path.join(tmpDir, 'css'), { recursive: true });
  for (let index = 0; index < 18; index += 1) {
    fs.writeFileSync(path.join(tmpDir, 'css', `${index}.css`), `@import "${index + 1}.css";`);
  }
  fs.writeFileSync(
    path.join(tmpDir, 'css', '18.css'),
    '.too-deep { background: url("./late.png"); }',
  );
  const indexHtml = '<link rel="stylesheet" href="css/0.css" />';

  assert.throws(
    () => localAssetReferences(indexHtml, { siteDir: tmpDir }),
    /CSS import depth exceeded/,
  );
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

test('static site asset extractor fails CSS url references omitted from the manifest', () => {
  const tmpDir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'static-css-manifest-'));
  fs.writeFileSync(path.join(tmpDir, 'styles.css'), '.hero { background: url("hero.css.png"); }');
  const indexHtml = `
    <link rel="stylesheet" href="styles.css" />
    <div style="background-image: url('hero-inline.png')"></div>
  `;
  const manifest = {
    version: 1,
    algorithm: 'sha256',
    assets: {
      'index.html': { bytes: indexHtml.length, sha256: 'stub' },
      'styles.css': { bytes: 0, sha256: 'stub' },
    },
  };

  assert.deepEqual(
    findAssetReferencesMissingFromManifest(indexHtml, manifest, { siteDir: tmpDir }),
    ['hero-inline.png', 'hero.css.png'],
  );
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
