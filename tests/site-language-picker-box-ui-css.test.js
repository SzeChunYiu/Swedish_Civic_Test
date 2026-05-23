const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static language picker menu uses tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /LANGUAGE PICKER BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.lang-menu\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow-hover\);/,
  );
  assert.match(
    css,
    /\.lang-menu::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*height: 5px;/,
  );
  assert.match(
    css,
    /\.lang-menu button\s*{[^}]*background: rgba\(255, 255, 255, 0\.48\);[^}]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[^}]*min-height: 44px;/,
  );
  assert.doesNotMatch(
    css,
    /\.lang-menu button\s*{[^}]*background: rgba\(255, 255, 255, 0\.48\);[^}]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[^}]*min-height: 42px;/,
  );
  assert.match(
    css,
    /\.lang-menu button\.is-on\s*{[\s\S]*background:[\s\S]*rgba\(254, 204, 0, 0\.2\)[\s\S]*var\(--ink[\s\S]*color: var\(--gold/,
  );
  assert.match(
    css,
    /\.lang-menu button\.is-on::after\s*{[\s\S]*content: '✓';[\s\S]*margin-left: auto;/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.lang-menu\s*{[\s\S]*max-width: calc\(100vw - 28px\);[\s\S]*left: 0;[\s\S]*right: auto;/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*:root\[dir='rtl'\] \.lang-menu\s*{[\s\S]*left: auto;[\s\S]*right: 0;/,
  );
});
