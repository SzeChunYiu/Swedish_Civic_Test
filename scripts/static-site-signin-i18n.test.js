const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
}

test('static sign-in trigger and modal copy are localized display text', () => {
  const index = read('site/index.html');
  const signin = read('site/signin.js');
  const requiredKeys = [
    'signin.cta',
    'signin.account',
    'signin.signout',
    'signin.signedin',
    'signin.lede',
    'signin.google',
    'signin.apple',
    'signin.or',
    'signin.magic',
    'signin.fineprint',
  ];

  for (const key of requiredKeys) {
    assert.match(index + signin, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(signin, new RegExp(`['"]${key}['"]`));
  }

  assert.match(signin, /window\.addEventListener\('smt:languagechange', localize\)/);
  assert.match(signin, /btn\.title = triggerText/);
  assert.match(signin, /btn\.setAttribute\('aria-label', triggerText\)/);
});
