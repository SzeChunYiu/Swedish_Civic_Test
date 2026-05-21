const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static dashboard progress surfaces use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DASHBOARD PROGRESS BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /#v11-dashboard-wrap\s*{[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow-hover\);/,
  );
  assert.match(css, /#v11-dashboard-wrap::before\s*{[\s\S]*background: var\(--card-rail\);/);
  assert.match(
    css,
    /\.v11-card\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*border-color: var\(--card-border\);[\s\S]*border-radius: 20px;[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(css, /\.v11-card::before\s*{[\s\S]*background: var\(--card-rail\);/);
  assert.match(
    css,
    /\.v11-components,[\s\S]*\.v11-freeze-bar\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 16px;[\s\S]*padding: 10px;/,
  );
  assert.match(
    css,
    /\.v11-weak-link\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.52\);[\s\S]*border-radius: 14px;/,
  );
  assert.match(
    css,
    /\.v11-lock__inner\s*{[\s\S]*var\(--card-surface\);[\s\S]*border-radius: 22px;[\s\S]*box-shadow: var\(--card-shadow-hover\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*#v11-dashboard-wrap\s*{[\s\S]*padding: 22px 18px;/,
  );
});
