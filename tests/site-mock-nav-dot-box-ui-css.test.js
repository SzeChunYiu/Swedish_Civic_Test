const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static mock question navigation dots use tactile progress boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /MOCK NAV DOT BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.mock-grid\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.48\);[\s\S]*border-radius: 18px;[\s\S]*padding: 12px;/,
  );
  assert.match(
    css,
    /\.mock-dot\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.62\);[\s\S]*border-radius: 12px;[\s\S]*min-height: 44px;[\s\S]*min-width: 44px;/,
  );
  assert.match(
    css,
    /\.mock-dot::after\s*{[\s\S]*border-radius: 999px;[\s\S]*height: 4px;[\s\S]*width: 16px;/,
  );
  assert.match(
    css,
    /\.mock-dot\.is-done\s*{[\s\S]*linear-gradient\(180deg, rgba\(0, 106, 167, 0\.14\)[\s\S]*color: var\(--blue-ink\);/,
  );
  assert.match(css, /\.mock-dot\.is-done::after\s*{[\s\S]*background: var\(--blue\);/);
  assert.match(
    css,
    /\.mock-dot\.is-on\s*{[\s\S]*background: var\(--ink\);[\s\S]*color: var\(--gold\);[\s\S]*transform: translateY\(-1px\);/,
  );
  assert.match(css, /\.mock-dot\.is-on::after\s*{[\s\S]*background: var\(--gold\);/);
  assert.match(
    css,
    /\.mock-dot:focus-visible\s*{[\s\S]*border-color: var\(--blue\);[\s\S]*box-shadow:[\s\S]*0 0 0 5px rgba\(0, 106, 167, 0\.2\),[\s\S]*var\(--card-shadow\);[\s\S]*outline: 3px solid var\(--gold\);[\s\S]*outline-offset: 3px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.mock-dot:focus-visible\s*{[\s\S]*border-color: var\(--gold\);[\s\S]*box-shadow:[\s\S]*0 0 0 5px rgba\(254, 204, 0, 0\.22\),[\s\S]*var\(--card-shadow\);[\s\S]*outline-color: var\(--gold\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.mock-grid\s*{[\s\S]*grid-template-columns: repeat\(auto-fill, minmax\(44px, 1fr\)\);[\s\S]*\.mock-dot\s*{[\s\S]*min-height: 44px;/,
  );
});
