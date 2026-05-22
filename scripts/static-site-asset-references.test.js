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
  const missingAssets = listIndexAssetReferences(siteRoot).filter(
    (assetPath) => !fs.existsSync(path.join(siteRoot, assetPath)),
  );

  assert.deepEqual(missingAssets, []);
});

test('static sign-in script is an intentional local manifest-backed asset', () => {
  const indexHtml = readSiteIndex();
  const manifest = JSON.parse(fs.readFileSync(path.join(siteRoot, 'asset-manifest.json'), 'utf8'));

  assert.match(indexHtml, /\bsrc=["']signin\.js["']/);
  assert.match(indexHtml, /\bid=["']signin-open["']/);
  assert.equal(fs.existsSync(path.join(siteRoot, 'signin.js')), true);
  assert.ok(manifest.assets?.['signin.js']);
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

test('static PWA shell is installable and covered by the asset manifest', () => {
  const indexHtml = readSiteIndex();
  const assetManifest = JSON.parse(
    fs.readFileSync(path.join(siteRoot, 'asset-manifest.json'), 'utf8'),
  );
  const webManifest = JSON.parse(
    fs.readFileSync(path.join(siteRoot, 'manifest.webmanifest'), 'utf8'),
  );
  const serviceWorker = fs.readFileSync(path.join(siteRoot, 'sw.js'), 'utf8');

  assert.match(indexHtml, /\brel=["']manifest["']\s+href=["']manifest\.webmanifest["']/);
  assert.match(indexHtml, /\bname=["']theme-color["']\s+content=["']#f5f7fa["']/);
  assert.match(
    indexHtml,
    /\brel=["']apple-touch-icon["'][^>]+href=["']icons\/pwa-icon-192\.png["']/,
  );
  assert.match(indexHtml, /navigator\.serviceWorker[\s\S]*\.register\(["']\.\/sw\.js["']/);
  assert.match(indexHtml, /updateViaCache:\s*["']none["']/);

  assert.equal(webManifest.name, 'Almost Swedish');
  assert.equal(webManifest.display, 'standalone');
  assert.equal(webManifest.start_url, '.');
  assert.equal(webManifest.scope, '.');
  assert.equal(webManifest.background_color, '#f5f7fa');
  assert.equal(webManifest.theme_color, '#f5f7fa');
  assert.deepEqual(
    webManifest.icons.map((icon) => `${icon.src}:${icon.sizes}:${icon.purpose}`),
    [
      'icons/pwa-icon-192.png:192x192:any',
      'icons/pwa-icon-512.png:512x512:any',
      'icons/pwa-maskable-512.png:512x512:maskable',
    ],
  );

  for (const assetPath of [
    'manifest.webmanifest',
    'icons/pwa-icon-192.png',
    'icons/pwa-icon-512.png',
    'icons/pwa-maskable-512.png',
    'sw.js',
  ]) {
    assert.ok(assetManifest.assets?.[assetPath], `${assetPath} missing from asset-manifest.json`);
    assert.equal(fs.existsSync(path.join(siteRoot, assetPath)), true);
  }

  assert.match(serviceWorker, /asset-manifest\.json/);
  assert.match(serviceWorker, /cacheNameForManifestText/);
  assert.match(serviceWorker, /crypto\.subtle\.digest\(["']SHA-256["']/);
  assert.match(serviceWorker, /cache\.addAll\(resolvePrecacheUrls\(manifest\)\)/);
  assert.match(serviceWorker, /caches\.keys\(\)/);
  assert.match(serviceWorker, /caches\.delete\(cacheName\)/);
  assert.match(
    serviceWorker,
    /event\.respondWith\(networkFirstWithCacheFallback\(event\.request\)\)/,
  );
  assert.doesNotMatch(serviceWorker, /https?:\/\//);
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
      /app\.js: referenced by index\.html or linked stylesheets but missing from committed manifest/,
    );
    assert.match(
      result.mismatches.join('\n'),
      /hero@2x\.png: referenced by index\.html or linked stylesheets but missing from committed manifest/,
    );
    assert.match(
      result.mismatches.join('\n'),
      /preload-large\.png: referenced by index\.html or linked stylesheets but missing from committed manifest/,
    );
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

test('asset manifest check rejects local CSS url references omitted by manifest scope', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-css-asset-reference-'));
  const tempSiteDir = path.join(tempDir, 'site');
  const tempManifestPath = path.join(tempSiteDir, 'asset-manifest.json');
  const omittedReferences = new Set([
    'hero.png',
    'icons/mask.svg',
    'images/pattern.png',
    'inline-badge.svg',
  ]);
  const omitCssReferences = (assetPath) => !omittedReferences.has(assetPath);

  try {
    fs.mkdirSync(path.join(tempSiteDir, 'css'), { recursive: true });
    fs.mkdirSync(path.join(tempSiteDir, 'icons'), { recursive: true });
    fs.mkdirSync(path.join(tempSiteDir, 'images'), { recursive: true });
    fs.writeFileSync(
      path.join(tempSiteDir, 'index.html'),
      [
        '<!doctype html>',
        '<link rel="stylesheet" href="css/styles.css">',
        '<main style="background-image: url(./hero.png); mask-image: url(\'/inline-badge.svg#badge\')">Practice</main>',
      ].join('\n'),
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'css', 'styles.css'),
      [
        '.hero { background-image: url("../images/pattern.png?v=1#hero"); }',
        '.mask { mask-image: url("/icons/mask.svg#shape"); }',
        '.fragment { clip-path: url(#clip); }',
        '.external { background-image: url("https://example.com/hero.png"); }',
        '.data { cursor: url(data:image/png;base64,AAAA), pointer; }',
        '.variable { background-image: url(var(--hero-image)); }',
        '.gradient { background-image: linear-gradient(#fff, #111); }',
      ].join('\n'),
    );
    fs.writeFileSync(path.join(tempSiteDir, 'hero.png'), 'hero');
    fs.writeFileSync(path.join(tempSiteDir, 'inline-badge.svg'), '<svg />');
    fs.writeFileSync(path.join(tempSiteDir, 'icons', 'mask.svg'), '<svg />');
    fs.writeFileSync(path.join(tempSiteDir, 'images', 'pattern.png'), 'pattern');
    writeAssetManifest({
      includeAsset: omitCssReferences,
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    const result = checkAssetManifest({
      includeAsset: omitCssReferences,
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });
    const mismatchText = result.mismatches.join('\n');

    assert.equal(result.ok, false);
    for (const assetPath of omittedReferences) {
      assert.match(
        mismatchText,
        new RegExp(
          `${assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: referenced by index\\.html or linked stylesheets but missing from committed manifest`,
        ),
      );
    }
    assert.doesNotMatch(mismatchText, /example\.com|data:image|--hero-image|#clip|linear-gradient/);
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

test('asset manifest check follows local CSS imports and ignores commented references', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-css-import-reference-'));
  const tempSiteDir = path.join(tempDir, 'site');
  const tempManifestPath = path.join(tempSiteDir, 'asset-manifest.json');
  const omittedReferences = new Set(['css/theme.css', 'hero.png', 'theme.png']);
  const omitImportedReferences = (assetPath) => !omittedReferences.has(assetPath);

  try {
    fs.mkdirSync(path.join(tempSiteDir, 'css'), { recursive: true });
    fs.writeFileSync(
      path.join(tempSiteDir, 'index.html'),
      '<!doctype html><link rel="stylesheet" href="css/styles.css">',
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'css', 'styles.css'),
      [
        '/* @import "../commented-import.css"; */',
        '/* .old-hero { background-image: url("../commented-hero.png"); } */',
        '@import url("./theme.css");',
        '.hero { background-image: url("../hero.png"); }',
      ].join('\n'),
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'css', 'theme.css'),
      [
        '/* .old-theme { background-image: url("../commented-theme.png"); } */',
        '.theme { background-image: url("../theme.png"); }',
      ].join('\n'),
    );
    fs.writeFileSync(path.join(tempSiteDir, 'hero.png'), 'hero');
    fs.writeFileSync(path.join(tempSiteDir, 'theme.png'), 'theme');
    fs.writeFileSync(path.join(tempSiteDir, 'commented-hero.png'), 'commented hero');
    fs.writeFileSync(path.join(tempSiteDir, 'commented-theme.png'), 'commented theme');
    fs.writeFileSync(path.join(tempSiteDir, 'commented-import.css'), '.old { color: red; }');
    writeAssetManifest({
      includeAsset: omitImportedReferences,
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    const result = checkAssetManifest({
      includeAsset: omitImportedReferences,
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });
    const mismatchText = result.mismatches.join('\n');

    assert.equal(result.ok, false);
    for (const assetPath of omittedReferences) {
      assert.match(
        mismatchText,
        new RegExp(
          `${assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: referenced by index\\.html or linked stylesheets but missing from committed manifest`,
        ),
      );
    }
    assert.doesNotMatch(
      mismatchText,
      /commented-import\.css|commented-hero\.png|commented-theme\.png/,
    );
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

test('asset manifest check follows local CSS imports recursively without leaving the site root', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-css-import-reference-'));
  const tempSiteDir = path.join(tempDir, 'site');

  try {
    fs.mkdirSync(path.join(tempSiteDir, 'css', 'nested'), { recursive: true });
    fs.mkdirSync(path.join(tempSiteDir, 'cursors'), { recursive: true });
    fs.mkdirSync(path.join(tempSiteDir, 'fonts'), { recursive: true });
    fs.mkdirSync(path.join(tempSiteDir, 'images'), { recursive: true });
    fs.writeFileSync(
      path.join(tempSiteDir, 'index.html'),
      '<!doctype html><link rel="stylesheet" href="css/site.css?version=1">',
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'css', 'site.css'),
      [
        '@import "./theme.css";',
        '@import url("./nested/buttons.css");',
        '@import url("https://example.com/remote.css");',
        '@import url("data:text/css,body{}");',
        '@import url(var(--runtime-sheet));',
        '.site { background-image: url("../images/site-bg.png#hero"); }',
      ].join('\n'),
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'css', 'theme.css'),
      [
        '@import url("./nested/tokens.css");',
        '.theme { background-image: url("../images/theme-bg.svg"); }',
      ].join('\n'),
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'css', 'nested', 'buttons.css'),
      [
        '@import "../theme.css";',
        '.button { cursor: url("../../cursors/button.cur"), pointer; }',
      ].join('\n'),
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'css', 'nested', 'tokens.css'),
      [
        '@import "../site.css";',
        '@font-face { src: url("../../fonts/site.woff2") format("woff2"); }',
      ].join('\n'),
    );
    fs.writeFileSync(path.join(tempSiteDir, 'cursors', 'button.cur'), 'cursor');
    fs.writeFileSync(path.join(tempSiteDir, 'fonts', 'site.woff2'), 'font');
    fs.writeFileSync(path.join(tempSiteDir, 'images', 'site-bg.png'), 'site');
    fs.writeFileSync(path.join(tempSiteDir, 'images', 'theme-bg.svg'), '<svg />');

    assert.deepEqual(listIndexAssetReferences(tempSiteDir), [
      'css/nested/buttons.css',
      'css/nested/tokens.css',
      'css/site.css',
      'css/theme.css',
      'cursors/button.cur',
      'fonts/site.woff2',
      'images/site-bg.png',
      'images/theme-bg.svg',
    ]);
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

test('asset manifest check reports escaped CSS imports without reading outside site root', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-css-import-escape-'));
  const tempSiteDir = path.join(tempDir, 'site');
  const tempManifestPath = path.join(tempSiteDir, 'asset-manifest.json');

  try {
    fs.mkdirSync(tempSiteDir, { recursive: true });
    fs.writeFileSync(
      path.join(tempSiteDir, 'index.html'),
      '<!doctype html><link rel="stylesheet" href="styles.css">',
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'styles.css'),
      ['@import "../outside.css";', '.inside { background-image: url("inside.png"); }'].join('\n'),
    );
    fs.writeFileSync(path.join(tempSiteDir, 'inside.png'), 'inside');
    fs.writeFileSync(path.join(tempDir, 'outside.css'), '.leak { background: url("leak.png"); }');
    fs.writeFileSync(path.join(tempDir, 'leak.png'), 'leak');
    writeAssetManifest({
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    const result = checkAssetManifest({
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });
    const references = listIndexAssetReferences(tempSiteDir);
    const mismatchText = result.mismatches.join('\n');

    assert.deepEqual(references.includes('../outside.css'), true);
    assert.deepEqual(references.includes('leak.png'), false);
    assert.equal(result.ok, false);
    assert.match(
      mismatchText,
      /\.\.\/outside\.css: referenced by index\.html or linked stylesheets but missing from committed manifest/,
    );
    assert.doesNotMatch(mismatchText, /leak\.png/);
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

test('asset manifest check reports symlinked CSS without reading outside site root', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-css-import-symlink-'));
  const tempSiteDir = path.join(tempDir, 'site');
  const tempManifestPath = path.join(tempSiteDir, 'asset-manifest.json');

  try {
    fs.mkdirSync(tempSiteDir, { recursive: true });
    fs.writeFileSync(
      path.join(tempSiteDir, 'index.html'),
      '<!doctype html><link rel="stylesheet" href="styles.css">',
    );
    fs.writeFileSync(path.join(tempDir, 'outside.css'), '.leak { background: url("leak.png"); }');
    fs.writeFileSync(path.join(tempDir, 'leak.png'), 'leak');

    try {
      fs.symlinkSync(path.join(tempDir, 'outside.css'), path.join(tempSiteDir, 'styles.css'));
    } catch (error) {
      if (error && (error.code === 'EPERM' || error.code === 'EACCES')) {
        return;
      }
      throw error;
    }

    writeAssetManifest({
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    const result = checkAssetManifest({
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });
    const references = listIndexAssetReferences(tempSiteDir);
    const mismatchText = result.mismatches.join('\n');

    assert.deepEqual(references, ['styles.css']);
    assert.equal(result.ok, false);
    assert.match(
      mismatchText,
      /styles\.css: referenced by index\.html or linked stylesheets but missing from committed manifest/,
    );
    assert.doesNotMatch(mismatchText, /leak\.png/);
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

test('static site asset extractor covers local URLs inside inline style blocks', () => {
  const indexHtml = `
    <style>
      .hero { background-image: url("./images/hero.webp#top"); }
      .mask { mask-image: url('/icons/mask.svg?version=1'); }
      /* .old { background-image: url("./old-hero.webp"); } */
      .fragment { clip-path: url(#clip); }
      .external { background-image: url("https://example.com/hero.webp"); }
      .data { cursor: url(data:image/png;base64,AAAA), pointer; }
      .variable { background-image: url(var(--runtime-image)); }
    </style>
  `;

  assert.deepEqual(localAssetReferences(indexHtml), ['images/hero.webp', 'icons/mask.svg']);
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
  const omittedCssAssets = new Set([
    'images/inline-style-bg.svg',
    'images/logo.svg',
    'styles/fonts/app.woff2',
  ]);
  const omitCssReferencedAssets = (assetPath) => !omittedCssAssets.has(assetPath);

  try {
    fs.mkdirSync(path.join(tempSiteDir, 'images'), { recursive: true });
    fs.mkdirSync(path.join(tempSiteDir, 'styles', 'fonts'), { recursive: true });
    fs.writeFileSync(
      path.join(tempSiteDir, 'index.html'),
      [
        '<!doctype html>',
        '<link rel="stylesheet" href="styles/main.css">',
        '<style>.inline { background-image: url("./images/inline-style-bg.svg"); }</style>',
        '<script src="app.js"></script>',
      ].join(''),
    );
    fs.writeFileSync(path.join(tempSiteDir, 'app.js'), 'console.log("ready");\n');
    fs.writeFileSync(path.join(tempSiteDir, 'images', 'inline-style-bg.svg'), '<svg></svg>\n');
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
      /images\/inline-style-bg\.svg: referenced by index\.html or linked stylesheets but missing from committed manifest/,
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
