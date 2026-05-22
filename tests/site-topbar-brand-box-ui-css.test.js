const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static topbar brand uses a tactile home box', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /TOPBAR BRAND BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.topbar \.brand\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.46\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.1\);[\s\S]*border-radius: 999px;[\s\S]*min-height: 48px;[\s\S]*padding: 5px 12px 5px 7px;/,
  );
  assert.match(
    css,
    /\.topbar \.brand:hover,[\s\S]*\.topbar \.brand:focus-visible\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.72\);[\s\S]*border-color: rgba\(0, 106, 167, 0\.18\);[\s\S]*box-shadow: var\(--shadow-sm\);[\s\S]*transform: translateY\(-1px\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 640px\)\s*{[\s\S]*\.topbar \.brand\s*{[\s\S]*min-height: 44px;[\s\S]*padding: 5px 10px 5px 6px;/,
  );
});
