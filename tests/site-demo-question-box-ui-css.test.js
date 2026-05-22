const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static homepage demo prompt uses tactile question header boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DEMO QUESTION HEADER BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.qcard__chip\s*{[\s\S]*linear-gradient\(135deg, rgba\(254, 204, 0, 0\.96\), rgba\(255, 236, 140, 0\.9\)\)[\s\S]*box-shadow:[\s\S]*0 10px 24px -18px rgba\(11, 31, 51, 0\.72\);[\s\S]*padding: 6px 13px;/,
  );
  assert.match(
    css,
    /\.qcard__q\s*{[\s\S]*radial-gradient\(circle at 100% 0%, rgba\(0, 106, 167, 0\.08\), transparent 38%\)[\s\S]*border-radius: 20px;[\s\S]*padding: 18px 20px 18px 24px;/,
  );
  assert.match(
    css,
    /\.qcard__q::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*border-radius: 999px;[\s\S]*width: 4px;/,
  );
  assert.match(
    css,
    /\.qcard__q::after\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.52\);[\s\S]*border-radius: 999px;[\s\S]*width: 78px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.qcard__q,[\s\S]*\.qcard__chip\s*{[\s\S]*color: var\(--ink\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\s*{[\s\S]*\.qcard__chip\s*{[\s\S]*max-width: calc\(100% - 40px\);[\s\S]*\.qcard__q\s*{[\s\S]*border-radius: 16px;[\s\S]*font-size: 22px;[\s\S]*\.qcard__q::before\s*{[\s\S]*width: 3px;/,
  );
});
