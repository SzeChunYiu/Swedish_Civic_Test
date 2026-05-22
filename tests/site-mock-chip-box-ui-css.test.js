const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static mock chapter picker chips use tactile selectable boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /MOCK CHAPTER CHIP BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.mock-chapters\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.34\);[\s\S]*border-radius: 20px;[\s\S]*padding: 10px;/,
  );
  assert.match(
    css,
    /\.mock-chip\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.56\);[\s\S]*border-radius: 16px;[\s\S]*min-height: 58px;/,
  );
  assert.match(
    css,
    /\.mock-chip::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*opacity: 0;[\s\S]*width: 4px;/,
  );
  assert.match(
    css,
    /\.mock-chip\.is-on\s*{[\s\S]*linear-gradient\(135deg, rgba\(0, 106, 167, 0\.18\)[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(css, /\.mock-chip\.is-on::before\s*{[\s\S]*opacity: 0\.9;/);
  assert.match(
    css,
    /\.mock-chip__emoji\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.14\);[\s\S]*border-radius: 12px;[\s\S]*height: 34px;/,
  );
  assert.match(
    css,
    /\.mock-chip__num\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*padding: 3px 7px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.mock-chapters\s*{[\s\S]*grid-template-columns: 1fr;[\s\S]*\.mock-chip\s*{[\s\S]*min-height: 54px;/,
  );
});
