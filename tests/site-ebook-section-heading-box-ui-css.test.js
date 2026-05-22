const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook section headings use tactile reader boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK SECTION HEADING BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__reader h2\s*{[\s\S]*linear-gradient\(135deg, rgba\(0, 106, 167, 0\.065\), rgba\(254, 204, 0, 0\.055\)\)[\s\S]*border-radius: 18px;[\s\S]*display: flex;[\s\S]*padding: 12px 14px;/,
  );
  assert.match(
    css,
    /\.ebook__reader h2::after\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*height: 3px;[\s\S]*min-width: 34px;/,
  );
  assert.match(css, /\.ebook__reader h2:not\(:first-of-type\)::before\s*{[\s\S]*display: none;/);
  assert.match(css, /\.ebook__reader h2:first-of-type\s*{[\s\S]*padding: 12px 14px;/);
  assert.match(
    css,
    /\.ebook__reader h3\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.38\);[\s\S]*border-radius: 14px;[\s\S]*display: inline-flex;[\s\S]*padding: 8px 11px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__reader h2,[\s\S]*:root\[data-theme='dark'\] \.ebook__reader h3\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);[\s\S]*border-color: rgba\(255, 255, 255, 0\.08\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__reader h2\s*{[\s\S]*border-radius: 16px;[\s\S]*padding: 11px 12px;[\s\S]*\.ebook__reader h3\s*{[\s\S]*border-radius: 12px;/,
  );
});
