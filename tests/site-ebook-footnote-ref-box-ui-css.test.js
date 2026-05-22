const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook inline footnote refs use compact citation pills', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK INLINE FOOTNOTE REF BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__footnote-ref\s*{[\s\S]*display: inline-flex;[\s\S]*transform: translateY\(-0\.18em\);[\s\S]*vertical-align: baseline;/,
  );
  assert.match(
    css,
    /\.ebook__footnote-ref a\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*font-family: var\(--mono\);[\s\S]*min-height: 18px;[\s\S]*min-width: 20px;/,
  );
  assert.match(
    css,
    /\.ebook__footnote-ref a:hover,[\s\S]*\.ebook__footnote-ref a:focus-visible\s*{[\s\S]*background: var\(--gold\);[\s\S]*color: var\(--ink\);/,
  );
  assert.match(
    css,
    /\.ebook__footnote-ref a:focus-visible\s*{[\s\S]*outline: 2px solid rgba\(0, 106, 167, 0\.32\);[\s\S]*outline-offset: 2px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__footnote-ref a\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);[\s\S]*color: var\(--blue-soft\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__footnote-ref a:hover,[\s\S]*:root\[data-theme='dark'\] \.ebook__footnote-ref a:focus-visible\s*{[\s\S]*background: var\(--gold\);[\s\S]*color: #0b1f33;/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__footnote-ref\s*{[\s\S]*margin-left: 4px;[\s\S]*\.ebook__footnote-ref a\s*{[\s\S]*min-height: 20px;[\s\S]*min-width: 22px;/,
  );
});
