const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook footnote source links use tactile source pills', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK FOOTNOTE SOURCE LINK BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__footnote-body a\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.07\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*padding: 3px 8px;[\s\S]*text-decoration: none;/,
  );
  assert.match(
    css,
    /\.ebook__footnote-body a::after\s*{[\s\S]*content: '↗';[\s\S]*font-family: var\(--mono\);[\s\S]*opacity: 0\.74;/,
  );
  assert.match(
    css,
    /\.ebook__footnote-body a:hover,[\s\S]*\.ebook__footnote-body a:focus-visible\s*{[\s\S]*background: var\(--ink\);[\s\S]*color: var\(--gold\);/,
  );
  assert.match(
    css,
    /\.ebook__footnote-body a:focus-visible\s*{[\s\S]*outline: 2px solid var\(--gold\);[\s\S]*outline-offset: 2px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__footnote-body a\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);[\s\S]*color: var\(--blue-soft\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__footnote-body a:hover,[\s\S]*:root\[data-theme='dark'\] \.ebook__footnote-body a:focus-visible\s*{[\s\S]*background: var\(--gold\);[\s\S]*color: #0b1f33;/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__footnote-body a\s*{[\s\S]*border-radius: 12px;[\s\S]*padding: 4px 8px;/,
  );
});
