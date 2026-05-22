const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static mock exam sliders use tactile control boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /MOCK SLIDER BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.mock-cfg__label output\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*min-width: 78px;[\s\S]*padding: 6px 12px;/,
  );
  assert.match(
    css,
    /\.mock-cfg__row input\[type='range'\]\s*{[\s\S]*appearance: none;[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*height: 16px;/,
  );
  assert.match(
    css,
    /\.mock-cfg__row input\[type='range'\]::-webkit-slider-thumb\s*{[\s\S]*background: linear-gradient\(135deg, var\(--blue\), #0180bd\);[\s\S]*border-radius: 999px;[\s\S]*height: 24px;[\s\S]*width: 24px;/,
  );
  assert.match(
    css,
    /\.mock-cfg__row input\[type='range'\]::-moz-range-thumb\s*{[\s\S]*background: linear-gradient\(135deg, var\(--blue\), #0180bd\);[\s\S]*height: 20px;[\s\S]*width: 20px;/,
  );
  assert.match(
    css,
    /\.mock-cfg__row input\[type='range'\]:focus-visible\s*{[\s\S]*outline: 3px solid rgba\(0, 106, 167, 0\.24\);/,
  );
  assert.match(
    css,
    /\.mock-cfg__hint,[\s\S]*\.mock-cfg__meta\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*width: fit-content;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.mock-cfg__label output,[\s\S]*\.mock-cfg__meta\s*{[\s\S]*color: var\(--ink\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.mock-cfg__label output\s*{[\s\S]*min-width: 64px;[\s\S]*\.mock-cfg__row input\[type='range'\]\s*{[\s\S]*height: 18px;[\s\S]*\.mock-cfg__hint,/,
  );
});
