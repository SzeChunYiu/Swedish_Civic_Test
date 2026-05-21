const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static sign-in modal controls use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /SIGN-IN BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.signin__login,[\s\S]*\.signin__account\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.signin__login::before,[\s\S]*\.signin__account::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*width: 5px;/,
  );
  assert.match(
    css,
    /\.signin__btn\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.56\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.14\);[\s\S]*border-radius: 14px;[\s\S]*min-height: 48px;/,
  );
  assert.match(
    css,
    /\.signin__btn-icon\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.2\);[\s\S]*border: 1px solid rgba\(254, 204, 0, 0\.36\);/,
  );
  assert.match(
    css,
    /\.signin__divider span\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.16\);[\s\S]*border: 1px solid rgba\(254, 204, 0, 0\.32\);[\s\S]*border-radius: 999px;/,
  );
  assert.match(
    css,
    /\.signin__input\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.72\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.18\);[\s\S]*border-radius: 14px;[\s\S]*min-height: 48px;/,
  );
  assert.match(
    css,
    /\.signin__fineprint,[\s\S]*\.signin__signedin\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.07\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.12\);[\s\S]*border-radius: 14px;/,
  );
});
