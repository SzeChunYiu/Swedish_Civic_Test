const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook footnote rows use compact citation boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK FOOTNOTE ROW BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__footnotes ol\s*{[\s\S]*display: grid;[\s\S]*gap: 8px;[\s\S]*padding-top: 4px;/,
  );
  assert.match(
    css,
    /\.ebook__footnotes li\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.44\);[\s\S]*border-radius: 14px;[\s\S]*padding: 10px 12px;/,
  );
  assert.match(
    css,
    /\.ebook__footnote-num\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*min-height: 24px;/,
  );
  assert.match(
    css,
    /\.ebook__footnote-body\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.36\);[\s\S]*border-radius: 12px;[\s\S]*padding: 8px 10px;/,
  );
  assert.match(
    css,
    /\.ebook__footnote-backs\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.04\);[\s\S]*border-radius: 999px;[\s\S]*padding: 4px;/,
  );
  assert.match(
    css,
    /\.ebook__footnote-back:hover,[\s\S]*\.ebook__footnote-back:focus-visible\s*{[\s\S]*background: var\(--ink\);[\s\S]*transform: translateY\(-1px\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__footnote-num,[\s\S]*:root\[data-theme='dark'\] \.ebook__footnote-back\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);[\s\S]*color: var\(--blue-soft\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 540px\)\s*{[\s\S]*\.ebook__footnotes ol\s*{[\s\S]*gap: 10px;[\s\S]*\.ebook__footnote-back\s*{[\s\S]*flex: 1 1 0;/,
  );
});
