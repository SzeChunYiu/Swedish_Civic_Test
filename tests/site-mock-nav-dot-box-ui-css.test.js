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
    /\.mock-dot\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.62\);[\s\S]*border-radius: 12px;[\s\S]*min-height: 38px;/,
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
    /@media \(max-width: 640px\)\s*{[\s\S]*\.mock-grid\s*{[\s\S]*grid-template-columns: repeat\(auto-fill, minmax\(34px, 1fr\)\);[\s\S]*\.mock-dot\s*{[\s\S]*min-height: 36px;/,
  );
});
