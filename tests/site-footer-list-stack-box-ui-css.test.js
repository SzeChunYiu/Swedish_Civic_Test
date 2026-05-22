const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static footer link lists use nested stack boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FOOTER LIST STACK BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.footer__cols ul\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.025\);[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.06\);[\s\S]*border-radius: 16px;[\s\S]*gap: 6px;[\s\S]*padding: 8px;/,
  );
  assert.match(
    css,
    /\.footer__cols li \+ li\s*{[\s\S]*border-top: 1px solid rgba\(255, 255, 255, 0\.055\);[\s\S]*padding-top: 6px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.footer__cols ul\s*{[\s\S]*border-radius: 14px;[\s\S]*padding: 7px;/,
  );
});
