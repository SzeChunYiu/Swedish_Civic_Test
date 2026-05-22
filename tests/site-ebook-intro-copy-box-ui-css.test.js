const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook intro copy uses tactile reader boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK INTRO COPY BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__crumb\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*width: fit-content;/,
  );
  assert.match(
    css,
    /\.ebook__crumb::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*height: 7px;[\s\S]*width: 7px;/,
  );
  assert.match(
    css,
    /\.ebook__h1\s*{[\s\S]*linear-gradient\(135deg, rgba\(255, 255, 255, 0\.66\), rgba\(0, 106, 167, 0\.035\)\)[\s\S]*border-radius: 22px;[\s\S]*padding: 14px 16px;/,
  );
  assert.match(
    css,
    /\.ebook__lede\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-left: 4px solid rgba\(0, 106, 167, 0\.34\);[\s\S]*border-radius: 18px;[\s\S]*padding: 13px 15px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__crumb,[\s\S]*:root\[data-theme='dark'\] \.ebook__lede\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);[\s\S]*border-color: rgba\(255, 255, 255, 0\.08\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__h1\s*{[\s\S]*border-radius: 18px;[\s\S]*padding: 12px 13px;[\s\S]*\.ebook__lede\s*{[\s\S]*border-radius: 16px;/,
  );
});
