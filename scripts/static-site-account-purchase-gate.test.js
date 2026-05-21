const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

test('static web purchase surface is present but locked to signed-in accounts', () => {
  const index = read('site/index.html');
  const purchase = read('site/purchase.js');

  assert.match(index, /id="purchase-account-gate"/);
  assert.match(index, /data-purchase-kind="remove_ads"/);
  assert.match(index, /data-purchase-kind="pro_lifetime"/);
  assert.match(index, /29\s*(?:SEK|kr)/i);
  assert.match(index, /59\s*(?:SEK|kr)/i);
  assert.match(purchase, /function\s+requireSignedInAccount\b/);
  assert.match(purchase, /window\.smtOpenSignin\(\)/);
  assert.match(purchase, /purchaseLocked/);
  assert.match(purchase, /smt:authchange/);
});

test('purchase account gate visible copy is localized and rerenders on language change', () => {
  const index = read('site/index.html');
  const app = read('site/app.js');
  const extras = read('site/i18n-extras.js');
  const purchase = read('site/purchase.js');
  const requiredKeys = [
    'purchase.eyebrow',
    'purchase.h1a',
    'purchase.h1b',
    'purchase.lede',
    'purchase.removeAds.eyebrow',
    'purchase.removeAds.title',
    'purchase.removeAds.body',
    'purchase.removeAds.locked',
    'purchase.removeAds.ready',
    'purchase.premium.eyebrow',
    'purchase.premium.title',
    'purchase.premium.body',
    'purchase.premium.locked',
    'purchase.premium.ready',
    'purchase.price.once',
    'purchase.status.locked',
    'purchase.status.ready',
    'purchase.status.needSignIn',
    'purchase.status.realSignin',
    'purchase.status.preparing',
    'purchase.status.error',
  ];

  for (const key of requiredKeys) {
    assert.match(
      index + purchase,
      new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${key} is wired`,
    );
    assert.match(app, new RegExp(`['"]${key}['"]`), `${key} has en/sv copy`);
    assert.match(extras, new RegExp(`['"]${key}['"]`), `${key} has extra locale copy`);
  }
  assert.match(purchase, /smt:languagechange/);
});
