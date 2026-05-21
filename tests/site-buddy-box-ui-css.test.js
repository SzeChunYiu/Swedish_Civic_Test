const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static Dala buddy bubble and picker cards use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /BUDDY BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.dala-bubble\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow-hover\);/,
  );
  assert.match(
    css,
    /\.dala-bubble__name\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.18\);[\s\S]*border: 1px solid rgba\(254, 204, 0, 0\.34\);[\s\S]*border-radius: 999px;/,
  );
  assert.match(
    css,
    /#dala-figure\s*{[\s\S]*background:[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.buddy-card\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.buddy-card\.is-on\s*{[\s\S]*background:[\s\S]*rgba\(254, 204, 0, 0\.2\)[\s\S]*var\(--card-surface\);[\s\S]*box-shadow:[\s\S]*var\(--card-shadow-hover\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.dala-buddy\s*{[\s\S]*max-width: calc\(100vw - 24px\);/,
  );
});
