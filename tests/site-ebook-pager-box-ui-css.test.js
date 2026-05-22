const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static ebook pager and stub use tactile navigation boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /EBOOK PAGER BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.ebook__pager\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.4\);[\s\S]*border-radius: 22px;[\s\S]*padding: 12px;/,
  );
  assert.match(
    css,
    /\.ebook__pager a\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.54\);[\s\S]*border-radius: 18px;[\s\S]*min-height: 74px;/,
  );
  assert.match(
    css,
    /\.ebook__pager a:hover,[\s\S]*\.ebook__pager a:focus-visible\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.16\);[\s\S]*transform: translateY\(-1px\);/,
  );
  assert.match(
    css,
    /\.ebook__pager a \.lbl\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;/,
  );
  assert.match(
    css,
    /\.ebook__stub\s*{[\s\S]*linear-gradient\(135deg, rgba\(0, 106, 167, 0\.06\), rgba\(254, 204, 0, 0\.08\)\)[\s\S]*border-radius: 22px;[\s\S]*padding: 34px 28px;/,
  );
  assert.match(
    css,
    /\.ebook__stub p\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 16px;[\s\S]*padding: 12px 14px;/,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*{[\s\S]*\.ebook__pager a:focus-visible\s*{[\s\S]*transform: none;/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.ebook__pager\s*{[\s\S]*flex-direction: column;[\s\S]*\.ebook__stub\s*{[\s\S]*border-radius: 18px;/,
  );
});
