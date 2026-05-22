const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static footer bottom text uses compact chip boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /FOOTER BOTTOM CHIP BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.footer__bottom span\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.035\);[\s\S]*border: 1px solid rgba\(255, 255, 255, 0\.07\);[\s\S]*border-radius: 999px;[\s\S]*display: inline-flex;[\s\S]*min-height: 32px;[\s\S]*padding: 7px 10px;/,
  );
  assert.match(
    css,
    /\.footer__bottom span:last-child\s*{[\s\S]*background: rgba\(254, 204, 0, 0\.075\);[\s\S]*border-color: rgba\(254, 204, 0, 0\.16\);[\s\S]*color: var\(--gold\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.footer__bottom span\s*{[\s\S]*border-radius: 14px;[\s\S]*justify-content: center;[\s\S]*width: 100%;/,
  );
});
