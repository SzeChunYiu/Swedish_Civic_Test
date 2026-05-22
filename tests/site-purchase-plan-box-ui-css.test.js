const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static purchase plan cards use tactile account-bound product boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /PURCHASE PLAN BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.purchase__lede\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 18px;[\s\S]*padding: 14px 16px;/,
  );
  assert.match(
    css,
    /\.purchase__card\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border-radius: 30px;[\s\S]*padding: 28px 28px 26px 34px;/,
  );
  assert.match(
    css,
    /\.purchase__card:nth-child\(2\)\s*{[\s\S]*linear-gradient\(135deg, rgba\(0, 106, 167, 0\.09\)/,
  );
  assert.match(
    css,
    /\.purchase__eyebrow\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*padding: 5px 10px;/,
  );
  assert.match(
    css,
    /\.purchase__price\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.48\);[\s\S]*border-radius: 18px;[\s\S]*padding: 12px 14px;/,
  );
  assert.match(
    css,
    /\.purchase__btn\[data-purchase-locked='true'\]\s*{[\s\S]*border: 1px dashed rgba\(11, 31, 51, 0\.28\);[\s\S]*box-shadow: none;/,
  );
  assert.match(
    css,
    /\.purchase__btn\[data-purchase-locked='true'\]::before\s*{[\s\S]*content: '🔒';/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.purchase__card\s*{[\s\S]*border-radius: 24px;[\s\S]*\.purchase__price\s*{[\s\S]*flex-direction: column;/,
  );
});
