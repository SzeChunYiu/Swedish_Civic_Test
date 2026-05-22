const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static mock history attempts use tactile result receipt boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /MOCK HISTORY BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.mock-history\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 24px;[\s\S]*box-shadow:/,
  );
  assert.match(
    css,
    /\.mock-history::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*width: 6px;/,
  );
  assert.match(
    css,
    /\.mock-history h3\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;/,
  );
  assert.match(css, /\.mock-history ul\s*{[\s\S]*display: grid;[\s\S]*gap: 10px;/);
  assert.match(
    css,
    /\.mock-history li\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.52\);[\s\S]*border-radius: 16px;[\s\S]*padding: 12px 14px;/,
  );
  assert.match(
    css,
    /\.mock-history__date,[\s\S]*\.mock-history__pct\s*{[\s\S]*border-radius: 999px;[\s\S]*padding: 3px 8px;/,
  );
  assert.match(
    css,
    /\.mock-history__verdict\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.14\);[\s\S]*border-radius: 999px;[\s\S]*padding: 4px 8px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.mock-history\s*{[\s\S]*border-radius: 20px;[\s\S]*\.mock-history li\s*{[\s\S]*grid-template-columns: 1fr auto;/,
  );
});
