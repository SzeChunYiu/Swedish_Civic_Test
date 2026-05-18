const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(repoRoot, 'site');

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

test('static site index references only shipped local assets', () => {
  const indexHtml = readSiteIndex();
  const missingAssets = localAssetReferences(indexHtml).filter(
    (assetPath) => !fs.existsSync(path.join(siteRoot, assetPath)),
  );

  assert.deepEqual(missingAssets, []);
  assert.doesNotMatch(indexHtml, /signin\.js/);
});
