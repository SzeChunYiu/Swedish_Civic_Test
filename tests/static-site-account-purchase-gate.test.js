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

test('purchase handoff binds the selected plan to the signed-in Supabase account', () => {
  const purchase = read('site/purchase.js');

  assert.match(purchase, /smt_account_id/);
  assert.match(purchase, /smt_account_email/);
  assert.match(purchase, /URLSearchParams/);
  assert.match(purchase, /account_id/);
  assert.match(purchase, /plan/);
  assert.match(purchase, /play\.google\.com\/store\/apps\/details/);
  assert.match(purchase, /purchase_intents/);
  assert.match(purchase, /user_id:\s*account\.id/);
  assert.match(purchase, /plan:\s*kind/);
});

test('sign-in session persistence exposes stable account identity for purchases', () => {
  const signin = read('site/signin.js');

  assert.match(signin, /session\.user\.id/);
  assert.match(signin, /smt_account_id/);
  assert.match(signin, /smt_account_email/);
  assert.match(signin, /localStorage\.removeItem\(['"]smt_account_id['"]\)/);
  assert.match(signin, /window\.dispatchEvent\(new Event\(['"]smt:authchange['"]\)\)/);
});
