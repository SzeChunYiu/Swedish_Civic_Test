const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static sponsored ad slots use restrained tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /SPONSORED AD BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ad-slot__inner\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.ad-slot__inner::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*width: 6px;/,
  );
  assert.match(
    css,
    /\.ad-slot__label,[\s\S]*\.ad-anchor__label\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.16\);[\s\S]*border: 1px solid rgba\(254, 204, 0, 0\.34\);[\s\S]*border-radius: 999px;/,
  );
  assert.match(
    css,
    /\.ad-slot__placeholder,[\s\S]*\.ad-anchor__placeholder\s*{[\s\S]*background:[\s\S]*repeating-linear-gradient[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.16\);[\s\S]*border-radius: 16px;/,
  );
  assert.match(
    css,
    /\.ad-anchor\s*{[\s\S]*background:[\s\S]*rgba\(255, 250, 240, 0\.96\)[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow-hover\);/,
  );
  assert.match(css, /\.ad-anchor__close\s*{[\s\S]*min-height: 44px;[\s\S]*min-width: 44px;/);
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ad-anchor\s*{[\s\S]*border-radius: 20px 20px 0 0;/,
  );
});
