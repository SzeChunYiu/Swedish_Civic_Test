const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '..');

require.extensions['.ts'] = function tsLoader(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  module._compile(transpiled, filename);
};

function loadTs(relativePath) {
  return require(path.join(repoRoot, relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function pngDimensions(relativePath) {
  const buffer = fs.readFileSync(path.join(repoRoot, relativePath));
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('release app assets are configured and present at store-safe sizes', () => {
  const app = readJson('app.json').expo;
  assert.equal(app.icon, './assets/icon.png');
  assert.equal(app.splash.image, './assets/splash-icon.png');
  assert.equal(app.android.adaptiveIcon.foregroundImage, './assets/adaptive-icon.png');
  assert.equal(app.android.adaptiveIcon.backgroundColor, '#005293');

  assert.deepEqual(pngDimensions('assets/icon.png'), { width: 1024, height: 1024 });
  assert.deepEqual(pngDimensions('assets/adaptive-icon.png'), { width: 1024, height: 1024 });
  assert.deepEqual(pngDimensions('assets/splash-icon.png'), { width: 1242, height: 2436 });
});

test('mascot catalog assets are committed as small local SVG files', () => {
  const { MASCOT_CATALOG, MASCOT_EXPRESSIONS, mascotAssetPath } = loadTs('lib/mascot/catalog.ts');
  let assetCount = 0;

  for (const mascot of MASCOT_CATALOG) {
    for (const expression of MASCOT_EXPRESSIONS) {
      const relativeAssetPath = mascotAssetPath(mascot.id, expression);
      assert.equal(relativeAssetPath, `assets/mascot/${mascot.id}/${expression}.svg`);

      const absoluteAssetPath = path.join(repoRoot, relativeAssetPath);
      const stat = fs.statSync(absoluteAssetPath);
      assert.equal(stat.isFile(), true, `${relativeAssetPath} must exist`);
      assert.ok(stat.size > 0 && stat.size <= 8192, `${relativeAssetPath} is ${stat.size} bytes`);

      const svg = fs.readFileSync(absoluteAssetPath, 'utf8');
      assert.match(svg, /^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      assert.doesNotMatch(svg, /<image\b|\b(?:href|xlink:href)=|url\(/i);
      assetCount += 1;
    }
  }

  assert.equal(assetCount, 50);
});
