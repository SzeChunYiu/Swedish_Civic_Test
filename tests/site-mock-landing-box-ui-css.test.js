const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static mock exam landing intro uses tactile planning boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /MOCK LANDING BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.mock-landing__inner\s*{[\s\S]*background:[\s\S]*linear-gradient\(135deg, rgba\(255, 255, 255, 0\.68\), rgba\(255, 248, 228, 0\.4\)\);[\s\S]*border-radius: 28px;[\s\S]*max-width: 860px;[\s\S]*padding: 30px clamp\(22px, 5vw, 48px\);/,
  );
  assert.match(
    css,
    /\.mock-landing__inner::before\s*{[\s\S]*background: linear-gradient\(180deg, var\(--gold\), var\(--blue\)\);[\s\S]*border-radius: 999px;[\s\S]*height: 64px;/,
  );
  assert.match(
    css,
    /\.mock-landing__inner > \.eyebrow\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*padding: 7px 12px;/,
  );
  assert.match(
    css,
    /\.mock-landing__lede\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 18px;[\s\S]*padding: 14px 16px;/,
  );
  assert.match(
    css,
    /\.mock-landing__cta\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.055\);[\s\S]*border-radius: 20px;[\s\S]*padding: 12px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.mock-landing__inner,[\s\S]*\.mock-landing__cta\s*{[\s\S]*rgba\(255, 255, 255, 0\.045\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.mock-landing__inner\s*{[\s\S]*border-radius: 22px;[\s\S]*padding: 24px 18px 26px;[\s\S]*\.mock-landing__lede\s*{[\s\S]*font-size: 15px;/,
  );
});
