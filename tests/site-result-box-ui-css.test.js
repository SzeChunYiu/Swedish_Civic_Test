const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static quiz and mock result summaries use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /RESULT SUMMARY BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.quiz__result,[\s\S]*\.mock-result\s*{[\s\S]*background:[\s\S]*var\(--card-surface\);[\s\S]*border: 1px solid var\(--card-border\);[\s\S]*box-shadow: var\(--card-shadow\);/,
  );
  assert.match(
    css,
    /\.quiz__result::before,[\s\S]*\.mock-result::before\s*{[\s\S]*background: var\(--card-rail\);[\s\S]*width: 7px;/,
  );
  assert.match(
    css,
    /\.quiz__score\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.5\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.12\);[\s\S]*border-radius: 22px;/,
  );
  assert.match(
    css,
    /\.quiz__breakdown\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.42\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 18px;/,
  );
  assert.match(
    css,
    /\.quiz__breakdown li,[\s\S]*\.result-chapters li\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.5\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 14px;/,
  );
  assert.match(
    css,
    /\.result-chapters\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.36\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 18px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.quiz__result,[\s\S]*\.mock-result\s*{[\s\S]*border-radius: 22px;[\s\S]*padding: 28px 18px 24px 22px;/,
  );
});
