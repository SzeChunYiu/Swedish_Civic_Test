const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static toast and status messages use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /TOAST \+ STATUS BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /#smt-toast-host\s*{[\s\S]*max-width: min\(calc\(100vw - 28px\), 520px\);[\s\S]*width: max-content;/,
  );
  assert.match(
    css,
    /\.smt-toast\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow-hover\);[\s\S]*border-radius: 18px;/,
  );
  assert.match(
    css,
    /\.smt-toast::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*width: 5px;/,
  );
  assert.match(
    css,
    /\.smt-toast--streak\s*{[\s\S]*background:[\s\S]*rgba\(254, 204, 0, 0\.2\)[\s\S]*var\(--card-surface\);/,
  );
  assert.match(
    css,
    /\.smt-toast--win\s*{[\s\S]*background:[\s\S]*rgba\(0, 106, 167, 0\.14\)[\s\S]*var\(--card-surface\);/,
  );
  assert.match(
    css,
    /\.purchase__status,[\s\S]*\.set-hint,[\s\S]*\.modal__hint\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.07\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.12\);[\s\S]*border-radius: 14px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 520px\)\s*{[\s\S]*\.smt-toast\s*{[\s\S]*border-radius: 16px;[\s\S]*width: 100%;/,
  );
});
