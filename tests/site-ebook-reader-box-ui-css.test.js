const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static site ebook reader and sidebar use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK READER BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__sidebar,[\s\S]*\.ebook__reader\s*{[\s\S]*background: var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.ebook__sidebar::before,[\s\S]*\.ebook__reader::before\s*{[\s\S]*background: var\(--card-rail\);/,
  );
  assert.match(
    css,
    /\.ebook__sidebar\s*{[\s\S]*border-radius: 24px;[\s\S]*padding: 20px 16px 18px 22px;/,
  );
  assert.match(
    css,
    /\.ebook__nav a\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 14px;[\s\S]*padding: 11px 12px;/,
  );
  assert.match(
    css,
    /\.ebook__reader\s*{[\s\S]*border-radius: 28px;[\s\S]*padding-left: clamp\(34px, 5vw, 70px\);/,
  );
  assert.doesNotMatch(css, /\.ebook__reader::after/);
  assert.doesNotMatch(css, /\.ebook__reader::after\s*{[\s\S]*radial-gradient/);
  assert.match(
    css,
    /\.ebook__reader blockquote,[\s\S]*\.ebook__factbox\s*{[\s\S]*border-left: 7px solid var\(--gold\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__reader\s*{[\s\S]*padding: 36px 22px 42px 26px;/,
  );
});
