const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const stylesPath = path.join(__dirname, '..', 'site', 'styles.css');

test('static doc back links and kickers use tactile utility boxes', () => {
  const css = fs.readFileSync(stylesPath, 'utf8');

  assert.match(css, /DOC BACK AND KICKER BOX OPTIMIZATION ROUND/);
  assert.match(
    css,
    /\.doc__back a\s*{[\s\S]*background:[\s\S]*rgba\(0, 106, 167, 0\.04\);[\s\S]*border-color: rgba\(0, 106, 167, 0\.13\);[\s\S]*gap: 7px;[\s\S]*min-height: 34px;[\s\S]*text-decoration: none;/,
  );
  assert.match(
    css,
    /\.doc__back a::before\s*{[\s\S]*background: rgba\(0, 106, 167, 0\.08\);[\s\S]*border-radius: 999px;[\s\S]*content: '←';[\s\S]*height: 20px;[\s\S]*width: 20px;/,
  );
  assert.match(
    css,
    /\.doc__kicker\s*{[\s\S]*background:[\s\S]*rgba\(255, 255, 255, 0\.58\);[\s\S]*gap: 8px;[\s\S]*padding: 8px 13px 8px 10px;/,
  );
  assert.match(
    css,
    /\.doc__kicker::before\s*{[\s\S]*background: var\(--gold\);[\s\S]*height: 7px;[\s\S]*width: 7px;/,
  );
  assert.match(
    css,
    /:root\[data-theme='dark'\] \.doc__back a,[\s\S]*:root\[data-theme='dark'\] \.doc__kicker\s*{[\s\S]*background: rgba\(255, 255, 255, 0\.045\);/,
  );
});
