const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static homepage demo answer options use tactile choice boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DEMO OPTION BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.qcard__opts\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.34\);[\s\S]*border-radius: 20px;[\s\S]*padding: 10px;/,
  );
  assert.match(
    css,
    /\.qopt\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.56\);[\s\S]*border-radius: 16px;[\s\S]*min-height: 58px;/,
  );
  assert.match(
    css,
    /\.qopt:hover:not\(\[disabled\]\)\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.2\);[\s\S]*transform: translateY\(-1px\);/,
  );
  assert.match(
    css,
    /\.qopt \.key\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.82\);[\s\S]*border-radius: 12px;/,
  );
  assert.match(
    css,
    /\.qopt\.is-correct\s*{[\s\S]*linear-gradient\(135deg, rgba\(30, 135, 75, 0\.18\)[\s\S]*inset 4px 0 0 rgba\(30, 135, 75, 0\.72\)/,
  );
  assert.match(
    css,
    /\.qopt\.is-wrong\s*{[\s\S]*linear-gradient\(135deg, rgba\(194, 65, 12, 0\.16\)[\s\S]*inset 4px 0 0 rgba\(194, 65, 12, 0\.7\)/,
  );
  assert.match(
    css,
    /\.qopt:focus-visible\s*{[\s\S]*outline: 3px solid rgba\(0, 106, 167, 0\.24\);/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.qcard__opts,[\s\S]*\.qopt \.key\s*{[\s\S]*rgba\(255, 255, 255, 0\.045\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.qcard__opts\s*{[\s\S]*border-radius: 18px;[\s\S]*\.qopt\s*{[\s\S]*min-height: 54px;/,
  );
});
