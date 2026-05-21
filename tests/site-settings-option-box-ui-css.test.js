const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static settings option groups use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /SETTINGS OPTION BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.modal__body\s+\.set-group\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.modal__body\s+\.set-group::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*width: 5px;/,
  );
  assert.match(
    css,
    /\.set-segment\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.5\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.12\);[\s\S]*box-shadow: inset 0 1px 0 rgba\(255, 255, 255, 0\.72\);/,
  );
  assert.match(
    css,
    /\.set-segment button\.is-on\s*{[\s\S]*background:[\s\S]*rgba\(254, 204, 0, 0\.18\)[\s\S]*var\(--ink[\s\S]*color: var\(--gold/,
  );
  assert.match(
    css,
    /\.set-palette\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.set-row\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.46\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 14px;/,
  );
  assert.match(
    css,
    /\.set-link\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.16\);[\s\S]*border-radius: 14px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 540px\)\s*{[\s\S]*\.modal__body\s+\.set-group\s*{[\s\S]*padding: 16px 14px 16px 18px;/,
  );
});
