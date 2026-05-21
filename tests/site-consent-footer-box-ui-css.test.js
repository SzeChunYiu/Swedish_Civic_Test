const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static site consent and footer utility surfaces use tactile box treatment', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /CONSENT \+ FOOTER BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.consent\s*{[\s\S]*#071625;[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.1\);[\s\S]*border-radius: 24px;/,
  );
  assert.match(css, /\.consent__inner::before\s*{[\s\S]*background: var\(--card-rail\);/);
  assert.match(
    css,
    /\.consent__inner\s*{[\s\S]*grid-template-columns: auto minmax\(0, 1fr\) auto;/,
  );
  assert.match(
    css,
    /\.consent__actions\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.06\);[\s\S]*border-radius: 999px;[\s\S]*padding: 5px;/,
  );
  assert.match(css, /\.footer__brag\s*{[\s\S]*border-radius: 30px;[\s\S]*padding: 30px 32px 34px;/);
  assert.match(css, /\.footer__brag::before\s*{[\s\S]*background: var\(--card-rail\);/);
  assert.match(
    css,
    /\.footer__cols > div\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.035\);[\s\S]*border-radius: 22px;[\s\S]*padding: 22px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.consent__inner::before\s*{[\s\S]*height: 5px;/,
  );
});
