const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');
const productionTextExtensions = new Set(['.css', '.html', '.js', '.jsx']);
const googleFontsEndpointPattern = /\b(?:https?:)?\/\/fonts\.(?:googleapis|gstatic)\.com\b/i;

function readSiteIndex() {
  return fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
}

function isExternalReference(value) {
  return /^(?:https?:|data:|mailto:|tel:|#|javascript:)/i.test(value);
}

function normalizeAssetPath(value) {
  return value.replace(/[?#].*$/, '').replace(/^\.?\//, '');
}

function localAssetReferences(indexHtml) {
  return Array.from(indexHtml.matchAll(/\b(?:src|href)="([^"]+)"/g), (match) => match[1])
    .filter((value) => value && !isExternalReference(value))
    .map(normalizeAssetPath)
    .filter(Boolean);
}

function productionTextFiles() {
  const files = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!productionTextExtensions.has(path.extname(entry.name))) continue;
      files.push(absolutePath);
    }
  }

  walk(siteRoot);
  return files.sort((a, b) => a.localeCompare(b));
}

test('static site index references only shipped local assets', () => {
  const indexHtml = readSiteIndex();
  const missingAssets = localAssetReferences(indexHtml).filter(
    (assetPath) => !fs.existsSync(path.join(siteRoot, assetPath)),
  );

  assert.deepEqual(missingAssets, []);
  assert.doesNotMatch(indexHtml, /signin\.js/);
});

test('static site production assets do not call Google Fonts before consent', () => {
  const offenders = productionTextFiles()
    .map((filePath) => ({
      filePath: path.relative(repoRoot, filePath),
      source: fs.readFileSync(filePath, 'utf8'),
    }))
    .filter(({ source }) => googleFontsEndpointPattern.test(source))
    .map(({ filePath }) => filePath);

  assert.deepEqual(offenders, []);
});
