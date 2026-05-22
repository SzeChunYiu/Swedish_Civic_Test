const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static footer column grid uses a framed box surface', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FOOTER GRID FRAME BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.footer__cols\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.024\);[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.07\);[\s\S]*border-radius: 30px;[\s\S]*box-shadow: inset 0 1px 0 rgba\(255, 255, 255, 0\.07\);[\s\S]*padding: 18px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.footer__cols\s*{[\s\S]*border-radius: 22px;[\s\S]*padding: 12px;/,
  );
});
