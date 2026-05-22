const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static practice intro header uses a tactile study card box', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /PRACTICE HEADER BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.practice__head\s*{[\s\S]*background:[\s\S]*linear-gradient\(135deg, rgba\(255, 255, 255, 0\.64\), rgba\(255, 248, 228, 0\.42\)\);[\s\S]*border-radius: 30px;[\s\S]*max-width: 760px;[\s\S]*padding: 30px clamp\(22px, 5vw, 54px\) 34px;/,
  );
  assert.match(
    css,
    /\.practice__head::after\s*{[\s\S]*background: linear-gradient\(180deg, var\(--blue\), var\(--gold\)\);[\s\S]*border-radius: 999px;[\s\S]*height: 58px;/,
  );
  assert.match(
    css,
    /\.practice__head > \.eyebrow\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*padding: 7px 12px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.practice__head\s*{[\s\S]*rgba\(255, 255, 255, 0\.045\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.practice__head\s*{[\s\S]*border-radius: 22px;[\s\S]*padding: 24px 18px 28px;[\s\S]*\.practice__head::after\s*{[\s\S]*height: 44px;/,
  );
});
