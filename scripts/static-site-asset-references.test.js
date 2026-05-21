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
      /app\.js: referenced by index\.html but missing from committed manifest/,
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
          `${assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: referenced by index\\.html but missing from committed manifest`,
        ),
      );
    }
    assert.doesNotMatch(mismatchText, /example\.com|data:image|--hero-image|#clip|linear-gradient/);
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

test('asset manifest check follows local CSS imports recursively', () => {
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

test('asset manifest check reports but does not read CSS imports outside site root', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'site-css-import-root-'));
  const tempSiteDir = path.join(tempDir, 'site');
  const tempManifestPath = path.join(tempSiteDir, 'asset-manifest.json');

  try {
    fs.mkdirSync(path.join(tempSiteDir, 'css'), { recursive: true });
    fs.mkdirSync(path.join(tempSiteDir, 'img'), { recursive: true });
    fs.writeFileSync(
      path.join(tempSiteDir, 'index.html'),
      '<!doctype html><link rel="stylesheet" href="./site.css">',
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'site.css'),
      [
        '@import "./css/theme.css";',
        '@import "../outside.css";',
        '.site { background-image: url("./img/site-bg.webp"); }',
      ].join('\n'),
    );
    fs.writeFileSync(
      path.join(tempSiteDir, 'css', 'theme.css'),
      '.theme { background-image: url("../img/theme-bg.svg"); }',
    );
    fs.writeFileSync(
      path.join(tempDir, 'outside.css'),
      '.leaked { background-image: url("./leaked-secret.png"); }',
    );
    fs.writeFileSync(path.join(tempDir, 'leaked-secret.png'), 'secret');
    fs.writeFileSync(path.join(tempSiteDir, 'img', 'site-bg.webp'), 'site');
    fs.writeFileSync(path.join(tempSiteDir, 'img', 'theme-bg.svg'), '<svg />');
    writeAssetManifest({
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });

    assert.deepEqual(listIndexAssetReferences(tempSiteDir), [
      '../outside.css',
      'css/theme.css',
      'img/site-bg.webp',
      'img/theme-bg.svg',
      'site.css',
    ]);

    const result = checkAssetManifest({
      manifestPath: tempManifestPath,
      siteDir: tempSiteDir,
    });
    const mismatchText = result.mismatches.join('\n');

    assert.equal(result.ok, false);
    assert.match(
      mismatchText,
      /\.\.\/outside\.css: referenced by index\.html but missing from committed manifest/,
    );
    assert.doesNotMatch(mismatchText, /leaked-secret/);
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
