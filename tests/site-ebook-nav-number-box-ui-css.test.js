const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook sidebar navigation numbers use compact progress boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK NAV NUMBER BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__nav-n\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*font-family: var\(--mono\);[\s\S]*min-height: 26px;[\s\S]*min-width: 32px;/,
  );
  assert.match(
    css,
    /\.ebook__nav a:hover \.ebook__nav-n,[\s\S]*\.ebook__nav a:focus-visible \.ebook__nav-n\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.2\);[\s\S]*color: #4f2d12;/,
  );
  assert.match(
    css,
    /\.ebook__nav a\.is-active \.ebook__nav-n\s*{[\s\S]*background: var\(--gold\);[\s\S]*border-color: var\(--gold\);[\s\S]*color: var\(--ink\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__nav-n\s*{[\s\S]*background: rgba\(45, 168, 255, 0\.12\);[\s\S]*color: var\(--blue-soft\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__nav a:hover \.ebook__nav-n,[\s\S]*:root\[data-theme='dark'\] \.ebook__nav a\.is-active \.ebook__nav-n\s*{[\s\S]*background: var\(--gold\);[\s\S]*color: #0b1f33;/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__nav-n\s*{[\s\S]*min-height: 24px;[\s\S]*min-width: 30px;[\s\S]*padding: 2px 7px;/,
  );
});
