const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static topbar active nav links use marked tactile boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /TOPBAR NAV ACTIVE BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.nav a\.is-active\s*{[\s\S]*background:[\s\S]*var\(--ink\);[\s\S]*border-color: rgba\(0, 106, 167, 0\.22\);[\s\S]*color: var\(--paper\);[\s\S]*gap: 7px;/,
  );
  assert.match(
    css,
    /\.nav a\.is-active::before\s*{[\s\S]*background: var\(--gold\);[\s\S]*border-radius: 999px;[\s\S]*box-shadow: 0 0 0 3px rgba\(254, 204, 0, 0\.14\);[\s\S]*height: 6px;[\s\S]*width: 6px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.nav a\.is-active\s*{[\s\S]*background:[\s\S]*rgba\(45, 168, 255, 0\.16\);[\s\S]*border-color: rgba\(45, 168, 255, 0\.24\);[\s\S]*color: var\(--blue-soft\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.nav a\.is-active::before\s*{[\s\S]*height: 5px;[\s\S]*width: 5px;/,
  );
});
