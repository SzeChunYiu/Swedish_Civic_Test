const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static site quiz and mock feedback surfaces use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /QUIZ \+ FEEDBACK BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.quiz__card,[\s\S]*\.mock-cfg,[\s\S]*\.mock-bar,[\s\S]*\.mock-review__item\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*border-color: var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.quiz__card::before,[\s\S]*\.mock-review__item::before\s*{[\s\S]*background: var\(--card-rail\);/,
  );
  assert.match(
    css,
    /\.quiz__opts\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.34\);[\s\S]*border-radius: 20px;[\s\S]*padding: 10px;/,
  );
  assert.match(
    css,
    /\.quiz__feedback\s*{[\s\S]*border-left: 7px solid var\(--gold\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(css, /\.mock-cfg\s*{[\s\S]*border-radius: 24px;[\s\S]*padding-left: 34px;/);
  assert.match(css, /\.mock-grid\s*{[\s\S]*border-radius: 16px;[\s\S]*padding: 10px;/);
  assert.match(
    css,
    /\.mock-actions\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*padding: 12px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.quiz__card,[\s\S]*\.mock-cfg,[\s\S]*\.mock-card\s*{[\s\S]*padding-left: 24px;/,
  );
});
