const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook sidebar brand and subtitle use tactile header boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK SIDEBAR BRAND BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__brand\s*{[\s\S]*linear-gradient\(135deg, rgba\(255, 255, 255, 0\.68\), rgba\(0, 106, 167, 0\.06\)\)[\s\S]*border-radius: 18px;[\s\S]*min-height: 46px;[\s\S]*padding: 8px 10px;/,
  );
  assert.match(
    css,
    /\.ebook__brand-mark\s*{[\s\S]*border-radius: 8px;[\s\S]*box-shadow:[\s\S]*0 0 0 3px rgba\(0, 106, 167, 0\.08\)[\s\S]*overflow: hidden;/,
  );
  assert.match(
    css,
    /img\.ebook__brand-mark\s*{[\s\S]*border-radius: 8px;[\s\S]*0 0 0 3px rgba\(0, 106, 167, 0\.08\)[\s\S]*overflow: hidden;/,
  );
  assert.match(
    css,
    /\.ebook__sub\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.4\);[\s\S]*border-radius: 16px;[\s\S]*margin: 10px 0 14px;[\s\S]*padding: 10px 12px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__brand,[\s\S]*:root\[data-theme='dark'\] \.ebook__sub\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);[\s\S]*border-color: rgba\(255, 255, 255, 0\.08\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.ebook__brand-mark\s*{[\s\S]*0 0 0 3px rgba\(45, 168, 255, 0\.12\)/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__brand\s*{[\s\S]*border-radius: 16px;[\s\S]*min-height: 44px;[\s\S]*\.ebook__sub\s*{[\s\S]*border-radius: 14px;[\s\S]*margin: 8px 0 12px;/,
  );
});
