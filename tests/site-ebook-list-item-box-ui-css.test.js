const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook reader lists use tactile study item boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK READER LIST ITEM BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__reader > ul,[\s\S]*\.ebook__reader > ol\s*{[\s\S]*display: grid;[\s\S]*list-style: none;[\s\S]*padding-left: 0;/,
  );
  assert.match(
    css,
    /\.ebook__reader > ul > li,[\s\S]*\.ebook__reader > ol > li\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 14px;[\s\S]*padding: 10px 12px 10px 38px;/,
  );
  assert.match(
    css,
    /\.ebook__reader > ul > li::before,[\s\S]*\.ebook__reader > ol > li::before\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*height: 22px;[\s\S]*width: 22px;/,
  );
  assert.match(css, /\.ebook__reader > ul > li::before\s*{[\s\S]*content: '•';/);
  assert.match(css, /\.ebook__reader > ol\s*{[\s\S]*counter-reset: ebook-list;/);
  assert.match(css, /\.ebook__reader > ol > li::before\s*{[\s\S]*content: counter\(ebook-list\);/);
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__reader > ul > li,[\s\S]*:root\[data-theme='dark'\] \.ebook__reader > ol > li\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__reader > ul,[\s\S]*\.ebook__reader > ol\s*{[\s\S]*gap: 7px;[\s\S]*\.ebook__reader > ul > li,[\s\S]*padding: 9px 10px 9px 36px;/,
  );
});
