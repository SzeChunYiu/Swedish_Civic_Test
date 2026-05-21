const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');
const {
  checkAssetManifest,
  extractLocalAssetReferences,
  findAssetReferencesMissingFromManifest,
  listIndexAssetReferences,
  writeAssetManifest,
} = require('./update-site-asset-manifest');

function readSiteIndex() {
  return fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
}

function localAssetReferences(indexHtml, options) {
  return extractLocalAssetReferences(indexHtml, options);
}

test('static site index references only shipped local assets', () => {
  const indexHtml = readSiteIndex();
  const missingAssets = listIndexAssetReferences(siteRoot).filter(
    (assetPath) => !fs.existsSync(path.join(siteRoot, assetPath)),
  );

  assert.deepEqual(missingAssets, []);
  assert.doesNotMatch(indexHtml, /signin\.js/);
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
  const omitReferencedScript = (assetPath) => assetPath !== 'app.js';

  try {
    fs.mkdirSync(tempSiteDir, { recursive: true });
    fs.writeFileSync(
      path.join(tempSiteDir, 'index.html'),
      '<!doctype html><link rel="stylesheet" href="styles.css"><script src="app.js"></script><script src=\'extras.js\'></script><a href="#/practice">Practice</a>',
    );
    fs.writeFileSync(path.join(tempSiteDir, 'styles.css'), 'body { color: #111; }\n');
    fs.writeFileSync(path.join(tempSiteDir, 'app.js'), 'console.log("ready");\n');
    fs.writeFileSync(path.join(tempSiteDir, 'extras.js'), 'console.log("extras");\n');
    writeAssetManifest({
      includeAsset: omitReferencedScript,
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    const result = checkAssetManifest({
      includeAsset: omitReferencedScript,
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    assert.equal(result.ok, false);
    assert.match(
      result.mismatches.join('\n'),
      /app\.js: referenced by index\.html or linked stylesheets but missing from committed manifest/,
    );
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
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

test('static site asset extractor follows linked CSS imports and url assets', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-css-asset-reference-'));

  try {
    fs.mkdirSync(path.join(tempDir, 'images'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'styles', 'fonts'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'styles', 'nested'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, 'styles', 'main.css'),
      [
        '@import "./theme.css";',
        '.hero { background-image: url("../images/hero.svg?cache=1#hero"); }',
        '.remote { background-image: url("https://example.com/remote.svg"); }',
        '.ignored-variable { background-image: url(var(--site-pattern)); }',
      ].join('\n'),
    );
    fs.writeFileSync(
      path.join(tempDir, 'styles', 'theme.css'),
      [
        '@import url("./nested/fonts.css") screen;',
        ".logo { background-image: url('/images/logo.svg#icon'); }",
      ].join('\n'),
    );
    fs.writeFileSync(
      path.join(tempDir, 'styles', 'nested', 'fonts.css'),
      [
        '@import "../theme.css";',
        '@font-face { src: url("../fonts/app.woff2") format("woff2"); }',
      ].join('\n'),
    );

    const indexHtml = `
      <link rel="stylesheet" href="styles/main.css?version=1" />
      <div style="background-image: url('inline.png#top'); mask-image: url(/icons/inline-mask.svg); filter: url(#inline-filter);"></div>
    `;

    assert.deepEqual(localAssetReferences(indexHtml, { siteDir: tempDir }), [
      'styles/main.css',
      'inline.png',
      'icons/inline-mask.svg',
      'styles/theme.css',
      'styles/nested/fonts.css',
      'styles/fonts/app.woff2',
      'images/logo.svg',
      'images/hero.svg',
    ]);
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

test('asset manifest check rejects CSS import and url assets omitted by manifest scope', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-css-manifest-reference-'));
  const tempSiteDir = path.join(tempDir, 'site');
  const tempManifestPath = path.join(tempSiteDir, 'asset-manifest.json');
  const omittedCssAssets = new Set(['images/logo.svg', 'styles/fonts/app.woff2']);
  const omitCssReferencedAssets = (assetPath) => !omittedCssAssets.has(assetPath);

  try {
    fs.mkdirSync(path.join(tempSiteDir, 'images'), { recursive: true });
    fs.mkdirSync(path.join(tempSiteDir, 'styles', 'fonts'), { recursive: true });
    fs.writeFileSync(
      path.join(tempSiteDir, 'index.html'),
      '<!doctype html><link rel="stylesheet" href="styles/main.css"><script src="app.js"></script>',
    );
    fs.writeFileSync(path.join(tempSiteDir, 'app.js'), 'console.log("ready");\n');
    fs.writeFileSync(path.join(tempSiteDir, 'images', 'logo.svg'), '<svg></svg>\n');
    fs.writeFileSync(path.join(tempSiteDir, 'styles', 'fonts', 'app.woff2'), 'font\n');
    fs.writeFileSync(
      path.join(tempSiteDir, 'styles', 'main.css'),
      '@import "./theme.css";\n.logo { background-image: url("../images/logo.svg"); }\n',
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'styles', 'theme.css'),
      '@font-face { src: url("./fonts/app.woff2") format("woff2"); }\n',
    );

    writeAssetManifest({
      includeAsset: omitCssReferencedAssets,
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    const result = checkAssetManifest({
      includeAsset: omitCssReferencedAssets,
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    assert.equal(result.ok, false);
    assert.match(
      result.mismatches.join('\n'),
      /images\/logo\.svg: referenced by index\.html or linked stylesheets but missing from committed manifest/,
    );
    assert.match(
      result.mismatches.join('\n'),
      /styles\/fonts\/app\.woff2: referenced by index\.html or linked stylesheets but missing from committed manifest/,
    );
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
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

test('static site index does not depend on runtime CDN transpilation', () => {
  const indexHtml = readSiteIndex();

  assert.doesNotMatch(indexHtml, /https:\/\/unpkg\.com\//);
  assert.doesNotMatch(indexHtml, /@babel\/standalone/);
  assert.doesNotMatch(indexHtml, /type="text\/babel"/);
  assert.doesNotMatch(indexHtml, /\btweaks(?:-panel)?\.jsx\b/);
});
