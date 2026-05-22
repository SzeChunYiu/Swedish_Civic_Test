const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static topbar inner row uses a framed chrome box', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /TOPBAR INNER FRAME BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.topbar__inner\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.24\);[\s\S]*border: 1px solid rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*box-shadow: inset 0 1px 0 rgba\(255, 255, 255, 0\.4\);[\s\S]*margin-block: 8px;[\s\S]*padding: 8px 14px;/,
  );
  assert.match(
    css,
    /@media \(max-width: 720px\)\s*{[\s\S]*\.topbar__inner\s*{[\s\S]*border-radius: 24px;[\s\S]*margin-block: 6px;[\s\S]*padding: 8px 10px;/,
  );
});
