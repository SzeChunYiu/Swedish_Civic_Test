const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc ledes use tactile summary box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC LEDE SUMMARY BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.doc__lede\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.42\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 20px;[\s\S]*max-width: 62ch;[\s\S]*padding: 16px 18px 16px 22px;/,
  );
  assert.match(
    css,
    /\.doc__lede strong\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*font-weight: 900;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__lede\s*{[\s\S]*rgba\(45, 168, 255, 0\.22\) 0 6px[\s\S]*rgba\(255, 255, 255, 0\.045\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 620px\)\s*{[\s\S]*\.doc__lede\s*{[\s\S]*border-radius: 16px;[\s\S]*font-size: 16px;/,
  );
});
