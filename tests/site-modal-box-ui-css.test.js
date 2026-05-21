const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static site settings and sign-in modals use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /MODAL BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.modal__panel\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow:[\s\S]*var\(--card-shadow-hover\);/,
  );
  assert.match(css, /\.modal__panel::before\s*{[\s\S]*background: var\(--card-rail\);/);
  assert.match(css, /\.set-group\s*{[\s\S]*border-radius: 18px;[\s\S]*padding: 14px;/);
  assert.match(
    css,
    /\.set-palette\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*min-height: 118px;/,
  );
  assert.match(
    css,
    /\.signin__lede,[\s\S]*\.signin__signedin\s*{[\s\S]*border-left: 3px solid rgba\(254, 204, 0, 0\.82\);/,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*\.signin__btn:hover\s*{[\s\S]*transform: none;/,
  );
});
