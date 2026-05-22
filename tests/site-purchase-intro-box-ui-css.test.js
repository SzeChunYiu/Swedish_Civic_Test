const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static purchase intro uses tactile trust box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /PURCHASE INTRO BOX OPTIMIZATION ROUND/);
  assert.match(css, /\.purchase \.wrap > \.eyebrow,[\s\S]*\.purchase__lede\s*{[\s\S]*z-index: 1;/);
  assert.match(
    css,
    /\.purchase \.wrap--narrow::before\s*{[\s\S]*linear-gradient\(135deg, rgba\(255, 255, 255, 0\.64\), rgba\(231, 241, 248, 0\.44\)\)[\s\S]*border-radius: 28px;[\s\S]*height: 292px;/,
  );
  assert.match(
    css,
    /\.purchase \.wrap--narrow::after\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*border-radius: 999px;[\s\S]*height: 70px;/,
  );
  assert.match(
    css,
    /\.purchase \.wrap > \.eyebrow\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*padding: 7px 12px;/,
  );
  assert.match(css, /\.purchase__grid\s*{[\s\S]*position: relative;[\s\S]*z-index: 1;/);
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.purchase \.wrap--narrow::before,[\s\S]*\.purchase \.wrap > \.eyebrow\s*{[\s\S]*color: var\(--ink\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.purchase \.wrap--narrow::before\s*{[\s\S]*height: 358px;[\s\S]*\.purchase \.wrap--narrow::after\s*{[\s\S]*width: 3px;/,
  );
});
