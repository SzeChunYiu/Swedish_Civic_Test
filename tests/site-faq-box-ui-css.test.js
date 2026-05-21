const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static site FAQ and chapter list render as intentional study boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FAQ \+ CHAPTER BOX OPTIMIZATION ROUND/);
  assert.match(css, /\.list-quiet\s*{[\s\S]*display: grid;[\s\S]*gap: 12px;/);
  assert.match(
    css,
    /\.list-quiet li\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border-radius: 20px;[\s\S]*box-shadow: var\(--card-shadow\);[\s\S]*opacity: 1;/,
  );
  assert.match(css, /\.list-quiet li::before\s*{[\s\S]*background: var\(--card-rail\);/);
  assert.match(
    css,
    /\.faq__item\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*border-radius: 20px;[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(css, /\.faq__item p\s*{[\s\S]*border-left: 3px solid rgba\(254, 204, 0, 0\.7\);/);
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*\.faq__item:hover\s*{[\s\S]*transform: none;/,
  );
});
