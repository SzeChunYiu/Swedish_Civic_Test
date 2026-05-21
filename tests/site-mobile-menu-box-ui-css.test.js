const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static mobile navigation drawer uses tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /MOBILE MENU BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.topbar\.is-nav-open\s+\.nav\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow-hover\);/,
  );
  assert.match(
    css,
    /\.topbar\.is-nav-open\s+\.nav::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*height: 5px;/,
  );
  assert.match(
    css,
    /\.topbar\.is-nav-open\s+\.nav a\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.5\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 14px;/,
  );
  assert.match(
    css,
    /\.topbar\.is-nav-open\s+\.nav a\.is-active\s*{[\s\S]*background:[\s\S]*rgba\(254, 204, 0, 0\.18\)[\s\S]*var\(--ink[\s\S]*color: var\(--gold/,
  );
  assert.match(
    css,
    /\.topbar\.is-nav-open\s+\.nav a::before\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.18\);[\s\S]*border-radius: 999px;[\s\S]*width: 8px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 420px\)\s*{[\s\S]*\.topbar\.is-nav-open\s+\.nav\s*{[\s\S]*border-radius: 18px;/,
  );
});
